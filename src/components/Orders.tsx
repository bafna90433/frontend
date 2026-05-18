// src/components/Orders.tsx
import React, { useEffect, useMemo, useState } from "react";
import api, { MEDIA_URL } from "../utils/api";
import MainLayout from "./MainLayout";
import "../styles/Orders.css";
import {
  Package, ChevronRight, ChevronDown, FileText, X, Truck,
  CheckCircle2, Clock, XCircle, RotateCcw, AlertTriangle,
  MapPin, CreditCard, Calendar, Hash, Camera, Video,
  ChevronLeft, Filter, Search, ShoppingBag, ArrowLeft,
} from "lucide-react";

type OrderItem = {
  productId?: string;
  name: string;
  qty: number;
  price: number;
  image?: string;
  inners?: number;
  nosPerInner?: number;
  sku?: string;
  gstRate?: number;
};

type ReturnRequest = {
  isRequested: boolean;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
  description: string;
  proofImages: string[];
  proofVideo: string;
  adminComment?: string;
  requestDate?: string;
};

type ShippingAddress = {
  shopName?: string;
  gstNumber?: string;
  fullName?: string;
  phone?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDifferentShipping?: boolean;
  shippingStreet?: string;
  shippingArea?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
};

type Order = {
  _id: string;
  orderNumber?: string;
  createdAt?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  items?: OrderItem[];
  total: number;
  itemsPrice?: number;
  shippingPrice?: number;
  discountAmount?: number;
  advancePaid?: number;
  remainingAmount?: number;
  paymentMode?: string;
  estimatedDelivery?: string;
  trackingId?: string;
  courierName?: string;
  isShipped?: boolean;
  shippingAddress?: string | ShippingAddress;
  returnRequest?: ReturnRequest;
};


const formatDate = (iso?: string) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
};

const formatDateShort = (iso?: string) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short",
    });
  } catch { return iso; }
};

const toPackets = (it: OrderItem) => {
  if (it.inners && it.inners > 0) return it.inners;
  const perInner = it.innerQty && it.innerQty > 0 ? it.innerQty : it.nosPerInner && it.nosPerInner > 0 ? it.nosPerInner : 12;
  return Math.ceil((it.qty || 0) / perInner);
};

// ✅ Removed Pending from main configs since we merge it
const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  processing: { color: "#3b82f6", bg: "rgba(59,130,246,.08)", icon: <CheckCircle2 size={14} />, label: "Confirmed" },
  shipped: { color: "#8b5cf6", bg: "rgba(139,92,246,.08)", icon: <Truck size={14} />, label: "Shipped" },
  delivered: { color: "#10b981", bg: "rgba(16,185,129,.08)", icon: <CheckCircle2 size={14} />, label: "Delivered" },
  cancelled: { color: "#ef4444", bg: "rgba(239,68,68,.08)", icon: <XCircle size={14} />, label: "Cancelled" },
  returned: { color: "#6366f1", bg: "rgba(99,102,241,.08)", icon: <RotateCcw size={14} />, label: "Returned" },
};

const returnStatusConfig: Record<string, { color: string; icon: string; label: string }> = {
  Pending: { color: "#f59e0b", icon: "⏳", label: "Return Pending" },
  Approved: { color: "#10b981", icon: "✅", label: "Return Approved" },
  Rejected: { color: "#ef4444", icon: "❌", label: "Return Rejected" },
};

/* --- Invoice Generation Logic --- */
const normalizeWhatsApp91 = (raw?: string) => {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  const without91 = digits.startsWith("91") ? digits.slice(2) : digits;
  const last10 = without91.length > 10 ? without91.slice(-10) : without91;
  if (last10.length !== 10) return "";
  return `91${last10}`;
};

const generateInvoice = (order: Order) => {
  const win = window.open("", "_blank");
  if (!win) { alert("Popup blocked!"); return; }

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const addr = typeof order.shippingAddress === 'object' ? order.shippingAddress as ShippingAddress : null;
  const wa = normalizeWhatsApp91(user?.whatsapp || user?.otpMobile);

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  }) : new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const shipTo = addr
    ? addr.isDifferentShipping
      ? `<strong>${addr.fullName || user?.ownerName || "Customer"}</strong><br/>${addr.shippingStreet}<br/>${addr.shippingArea || ""}<br/>${addr.shippingCity}, ${addr.shippingState} – ${addr.shippingPincode}<br/>📞 ${addr.phone || user?.otpMobile}`
      : `<strong>${addr.fullName || user?.ownerName || "Customer"}</strong><br/>${addr.street}<br/>${addr.area || ""}<br/>${addr.city}, ${addr.state} – ${addr.pincode}<br/>📞 ${addr.phone || user?.otpMobile}`
    : typeof order.shippingAddress === 'string' ? order.shippingAddress : "No shipping address";

  const paymentText = order.paymentMode === "ONLINE" ? "Paid (Online)" : order.paymentMode === "COD" ? "Cash on Delivery" : (order.paymentMode || "Online");
  let payHtml = `Payment: ${paymentText}`;
  if (order.paymentMode === "COD" && (order.advancePaid || 0) > 0) {
    const rem = order.total - (order.advancePaid || 0);
    payHtml += `<br><span style="color:#16a34a">Advance: ₹${order.advancePaid}</span><br><strong style="color:#dc2626">Collect: ₹${rem}</strong>`;
  }

  const gstMap: Record<number, { base: number; gst: number }> = {};
  (order.items || []).forEach(it => {
    const rate = it.gstRate || 0;
    const total = it.qty * it.price;
    const base = total / (1 + rate / 100);
    const gst = total - base;
    if (!gstMap[rate]) gstMap[rate] = { base: 0, gst: 0 };
    gstMap[rate].base += base;
    gstMap[rate].gst += gst;
  });

  const itemRows = (order.items || []).map((it, i) => {
    const amt = it.qty * it.price;
    return `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${it.name}<br><small style="color:#888">SKU: ${it.sku || "—"}</small></td>
      <td style="text-align:center">${it.qty}</td>
      <td style="text-align:right">₹${it.price.toLocaleString()}</td>
      <td style="text-align:right">₹${amt.toLocaleString()}</td>
    </tr>`;
  }).join("");

  const subtotal = order.itemsPrice || (order.items || []).reduce((s, i) => s + i.qty * i.price, 0);
  const shipping = order.shippingPrice || 0;
  const storedDiscount = order.discountAmount || 0;
  const impliedDiscount = storedDiscount > 0 ? storedDiscount : Math.max(0, Math.round(subtotal + shipping - order.total));
  const discountPct = impliedDiscount > 0 && subtotal > 0 ? ((impliedDiscount / subtotal) * 100).toFixed(0) : "";

  let gstSummaryRows = "";
  const gstRates = Object.entries(gstMap).filter(([, v]) => v.gst > 0).map(([rate]) => `${rate}%`);
  if (gstRates.length > 0) gstSummaryRows += `<tr class="summary"><td colspan="4" style="text-align:right;color:#059669;font-size:12px">GST ${gstRates.join(", ")} Already included in Price</td><td style="text-align:right"></td></tr>`;

  let summaryRows = `<tr class="summary"><td colspan="4" style="text-align:right">Subtotal</td><td style="text-align:right">₹${subtotal.toLocaleString()}</td></tr>`;
  if (shipping > 0) summaryRows += `<tr class="summary"><td colspan="4" style="text-align:right">Shipping</td><td style="text-align:right">₹${shipping.toLocaleString()}</td></tr>`;
  if (impliedDiscount > 0) summaryRows += `<tr class="summary"><td colspan="4" style="text-align:right;color:#16a34a;font-weight:600">Volume Discount${discountPct ? " (" + discountPct + "%)" : ""}</td><td style="text-align:right;color:#16a34a;font-weight:600">−₹${impliedDiscount.toLocaleString()}</td></tr>`;
  summaryRows += gstSummaryRows;
  summaryRows += `<tr class="grand"><td colspan="4" style="text-align:right"><strong>Grand Total</strong></td><td style="text-align:right"><strong>₹${order.total.toLocaleString()}</strong></td></tr>`;

  const html = `<!DOCTYPE html><html><head><title>Invoice ${order.orderNumber || order._id.slice(-6)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#1e293b;padding:24px;background:#fff}
.inv{max-width:860px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
.inv-head{background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:center}
.inv-head img{height:56px;filter:brightness(0) invert(1)}
.inv-head h1{font-size:28px;font-weight:800;letter-spacing:1px}
.inv-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;padding:24px 32px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.inv-meta section h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:6px;font-weight:700}
.inv-meta section p{font-size:13px;line-height:1.6}
table{width:100%;border-collapse:collapse;font-size:13px}
thead{background:#f1f5f9}
th{padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;font-weight:700;border-bottom:2px solid #e2e8f0}
td{padding:10px 14px;border-bottom:1px solid #f1f5f9}
.summary td{border:none;padding:6px 14px;font-size:13px;color:#475569}
.grand td{border-top:2px solid #1e3a5f;padding:12px 14px;font-size:15px}
.inv-foot{text-align:center;padding:20px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8}
@media print{
  .no-print{display:none!important}
  body{padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .inv{border:none;border-radius:0}
  .inv-head{background:transparent!important;padding:20px 0!important;border-bottom:2px solid #dc2626}
  .inv-head img{filter:brightness(0) saturate(100%) invert(27%) sepia(91%) saturate(3011%) hue-rotate(348deg) brightness(93%) contrast(93%)!important}
  .inv-head h1{color:#1e293b!important}
  .inv-head p{color:#64748b!important}
}
</style></head><body>
<div class="inv">
<div class="inv-head">
  <img src="https://ik.imagekit.io/rishii/bafnatoys/Copy%20of%20Super_Car___05_vrkphh.webp?updatedAt=1775309336739" alt="BafnaToys"/>
  <div style="text-align:right"><h1>INVOICE</h1><p style="opacity:.8;font-size:13px;margin-top:4px">${order.orderNumber || order._id.slice(-6)}</p></div>
</div>
<div class="inv-meta">
  <section><h3>Bill To</h3><p><strong>${addr?.shopName || user?.shopName || addr?.fullName || "—"}</strong><br>GST: ${addr?.gstNumber || "N/A"}<br>📞 ${addr?.phone || user?.otpMobile || "—"}<br>💬 ${wa || "—"}</p></section>
  <section><h3>Ship To</h3><p>${shipTo}</p></section>
  <section><h3>Details</h3><p>Date: ${orderDate}<br>${payHtml}${order.trackingId ? `<br>AWB: ${order.trackingId}` : ""}</p></section>
</div>
<div style="padding:0 32px 24px">
  <table><thead><tr><th>#</th><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${itemRows}</tbody>
  <tfoot>${summaryRows}</tfoot></table>
</div>
<div class="inv-foot">
  <p>Thank you for choosing <strong>BafnaToys</strong>!</p>
  <p style="margin-top:4px">1-12, Thondamuthur Road, Coimbatore – 641007 | +91 9043347300</p>
</div>
</div>
<div style="text-align:center;margin-top:20px" class="no-print">
  <button onclick="window.print()" style="padding:12px 28px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">🖨️ Print Invoice</button>
</div>
</body></html>`;

  win.document.write(html);
  win.document.close();
};

const Orders: React.FC = () => {
  const resolveImage = (img?: string) => {
    if (!img) return "/placeholder-product.png";
    if (/^https?:\/\//i.test(img)) return img;
    return `${MEDIA_URL}/${img.replace(/^\//, "")}`;
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("Damaged Product");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnImages, setReturnImages] = useState<FileList | null>(null);
  const [returnVideo, setReturnVideo] = useState<File | null>(null);
  const [uploadingReturn, setUploadingReturn] = useState(false);
  const [returnSelectedItems, setReturnSelectedItems] = useState<string[]>([]);

  const uploadFileToBackend = async (file: File) => {
    const formData = new FormData();
    formData.append("images", file);
    try {
      const response = await api.post(`/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data?.urls?.[0] || null;
    } catch { return null; }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const userStr = localStorage.getItem("user");
        if (!userStr) { setError("Please login to view orders."); setLoading(false); return; }
        const user = JSON.parse(userStr);
        if (!user?._id) { setError("Invalid session. Please login again."); setLoading(false); return; }
        const response = await api.get(`/orders`, {
          params: { customerId: user._id },
        });
        if (response.data && Array.isArray(response.data)) {
          setOrders(response.data.sort((a: Order, b: Order) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          ));
        } else setOrders([]);
      } catch (err: any) {
        if (err.response?.status === 401) setError("Session expired. Please login again.");
        else if (err.response?.status === 404) setOrders([]);
        else setError("Could not fetch orders.");
      } finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetOrder = params.get("orderId");

      if (targetOrder) {
        const orderToOpen = orders.find(
          (o) => o._id === targetOrder || o.orderNumber === targetOrder
        );

        if (orderToOpen) {
          setExpandedOrder(orderToOpen._id);
          setTimeout(() => {
            const element = document.getElementById(`order-${orderToOpen._id}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 300);
        }
      }
    }
  }, [orders]);

  // ✅ Maps pending -> processing for frontend filters
  const filteredOrders = useMemo(() => {
    let list = statusFilter === "all" ? orders : orders.filter(o => {
      const displayStatus = o.status === "pending" ? "processing" : o.status;
      return displayStatus === statusFilter;
    });
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        (o.orderNumber || o._id).toLowerCase().includes(q) ||
        o.items?.some(it => it.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [orders, statusFilter, searchQuery]);

  const toggleOrder = (id: string) => setExpandedOrder(expandedOrder === id ? null : id);

  const getTrackingUrl = (order: Order) => {
    if (!order.trackingId) return "#";
    const c = (order.courierName || "").toLowerCase();
    
    if (c.includes("delhivery")) {
      return `https://www.delhivery.com/track-v2/package/${order.trackingId}`;
    }
    if (c.includes("vxpress") || c.includes("v-xpress") || c.includes("v xpress")) {
      return "https://vxpress.in/track-result/";
    }
    return `https://www.google.com/search?q=${encodeURIComponent(`${order.trackingId} tracking`)}`;
  };

  const handleOpenReturn = (orderId: string) => {
    setSelectedOrderId(orderId);
    setReturnSelectedItems([]);
    setReturnReason("Damaged Product");
    setReturnDescription("");
    setReturnImages(null);
    setReturnVideo(null);
    setShowReturnModal(true);
  };

  const handleItemSelect = (name: string) =>
    setReturnSelectedItems(prev => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || returnSelectedItems.length === 0) { alert("Select at least one product."); return; }
    setUploadingReturn(true);
    try {
      let imgUrls: string[] = [];
      if (returnImages) {
        for (let i = 0; i < returnImages.length; i++) {
          const url = await uploadFileToBackend(returnImages[i]);
          if (url) imgUrls.push(url);
        }
      }
      let vidUrl = "";
      if (returnVideo) { const v = await uploadFileToBackend(returnVideo); if (v) vidUrl = v; }
      if (returnImages && returnImages.length > 0 && imgUrls.length === 0) { alert("Upload failed."); setUploadingReturn(false); return; }

      await api.put(`/orders/return/${selectedOrderId}`, {
        reason: returnReason,
        description: `[RETURN ITEMS: ${returnSelectedItems.join(", ")}]\n\n${returnDescription}`,
        images: imgUrls,
        video: vidUrl,
      });

      alert("Return request submitted!");
      setShowReturnModal(false);
      window.location.reload();
    } catch { alert("Failed to submit return."); } finally { setUploadingReturn(false); }
  };

  const getSelectedOrderItems = () => orders.find(o => o._id === selectedOrderId)?.items || [];

  // ✅ Merge Pending into Confirmed
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(o => { 
      const displayStatus = o.status === "pending" ? "processing" : o.status;
      counts[displayStatus] = (counts[displayStatus] || 0) + 1; 
    });
    return counts;
  }, [orders]);

  // ✅ Removed Pending from tabs
  const filterTabs = [
    { key: "all", label: "All", icon: <Package size={14} /> },
    { key: "processing", label: "Confirmed", icon: <CheckCircle2 size={14} /> },
    { key: "shipped", label: "Shipped", icon: <Truck size={14} /> },
    { key: "delivered", label: "Delivered", icon: <CheckCircle2 size={14} /> },
    { key: "cancelled", label: "Cancelled", icon: <XCircle size={14} /> },
  ];

  return (
    <MainLayout>
      <div className="ord-page">
        {/* ── MOBILE HEADER ── */}
        <div className="ord-mob-head">
          <button className="ord-back" onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </button>
          <div className="ord-mob-head-text">
            <h1>My Orders</h1>
            <span>{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* ── DESKTOP HEADER ── */}
        <div className="ord-desk-head">
          <div>
            <h1>My Orders</h1>
            <p>Track, manage & review your purchases</p>
          </div>
          <div className="ord-head-stats">
            <div className="ord-stat-chip">
              <Package size={16} />
              <span><strong>{orders.length}</strong> Total</span>
            </div>
            <div className="ord-stat-chip ord-stat-chip--green">
              <CheckCircle2 size={16} />
              <span><strong>{statusCounts.delivered || 0}</strong> Delivered</span>
            </div>
          </div>
        </div>

        {/* ── SEARCH ── */}
        {orders.length > 0 && (
          <div className="ord-search-bar">
            <Search size={16} className="ord-search-icon" />
            <input
              type="text"
              placeholder="Search by order number or product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="ord-search-input"
            />
            {searchQuery && (
              <button className="ord-search-clear" onClick={() => setSearchQuery("")}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── FILTER TABS ── */}
        {orders.length > 0 && (
          <div className="ord-tabs-wrap">
            <div className="ord-tabs">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  className={`ord-tab ${statusFilter === tab.key ? "ord-tab--on" : ""}`}
                  onClick={() => setStatusFilter(tab.key as any)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {(statusCounts[tab.key] || 0) > 0 && (
                    <span className="ord-tab-count">{statusCounts[tab.key]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="ord-state">
            <div className="ord-spinner" />
            <p>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="ord-state ord-state--err">
            <AlertTriangle size={40} />
            <h3>Unable to load</h3>
            <p>{error}</p>
            <button className="ord-state-btn" onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="ord-state">
            <ShoppingBag size={48} strokeWidth={1.2} />
            <h3>{statusFilter !== "all" ? "No orders in this category" : "No orders yet"}</h3>
            <p>Start shopping to see your orders here</p>
            <button className="ord-state-btn" onClick={() => window.location.href = "/"}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="ord-list">
            {filteredOrders.map(order => {
              const isOpen = expandedOrder === order._id;
              
              // ✅ Virtual Display status forces "pending" -> "processing"
              const displayStatus = order.status === "pending" ? "processing" : order.status;
              const st = statusConfig[displayStatus];
              
              const hasReturn = order.returnRequest?.isRequested;
              const retSt = hasReturn ? returnStatusConfig[order.returnRequest!.status] : null;

              return (
                <div key={order._id} id={`order-${order._id}`} className={`ord-card ${isOpen ? "ord-card--open" : ""}`}>
                  {/* ── Summary ── */}
                  <div className="ord-card-top" onClick={() => toggleOrder(order._id)}>
                    <div className="ord-card-row1">
                      <div className="ord-card-id">
                        <Hash size={13} />
                        <span>{order.orderNumber || order._id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="ord-badge" style={{ background: retSt ? `${retSt.color}10` : st.bg, color: retSt ? retSt.color : st.color, borderColor: retSt ? retSt.color : st.color }}>
                        {retSt ? <span>{retSt.icon}</span> : st.icon}
                        {retSt ? retSt.label : st.label}
                      </div>
                    </div>

                    <div className="ord-card-row2">
                      <div className="ord-card-images">
                        {order.items?.slice(0, 4).map((item, i) => (
                          <div key={i} className="ord-card-thumb" style={{ zIndex: 10 - i }}>
                            <img src={resolveImage(item.image)} alt="" onError={e => { (e.target as HTMLImageElement).src = "/placeholder-product.png"; }} />
                          </div>
                        ))}
                        {(order.items?.length || 0) > 4 && (
                          <div className="ord-card-thumb ord-card-thumb--more">
                            +{(order.items?.length || 0) - 4}
                          </div>
                        )}
                      </div>

                      <div className="ord-card-right">
                        <div className="ord-card-total">
                          ₹{order.total.toLocaleString("en-IN")}
                        </div>
                        <div className="ord-card-date">
                          <Calendar size={11} />
                          {formatDateShort(order.createdAt)}
                        </div>
                      </div>

                      <ChevronDown size={18} className={`ord-card-chevron ${isOpen ? "ord-card-chevron--up" : ""}`} />
                    </div>
                  </div>

                  {/* ── Expanded Details ── */}
                  {isOpen && (
                    <div className="ord-card-body">
                      {/* Progress (Starts directly from processing/Confirmed) */}
                      <div className={`ord-progress ${order.status === "cancelled" ? "ord-progress--off" : ""}`}>
                        {(["processing", "shipped", "delivered"] as const).map((step, i) => {
                          const stepOrder = ["processing", "shipped", "delivered"];
                          const currentIdx = stepOrder.indexOf(displayStatus);
                          const isActive = i <= currentIdx;
                          const isCurrent = i === currentIdx;
                          return (
                            <React.Fragment key={step}>
                              <div className={`ord-prog-step ${isActive ? "ord-prog-step--on" : ""} ${isCurrent ? "ord-prog-step--cur" : ""}`}>
                                <div className="ord-prog-dot">
                                  {order.status === "cancelled" ? <XCircle size={14} /> :
                                    i < currentIdx ? <CheckCircle2 size={14} /> :
                                      <span>{i + 1}</span>}
                                </div>
                                <span className="ord-prog-label">{statusConfig[step].label}</span>
                              </div>
                              {/* Shortened array length from 3 to 2 for line generation */}
                              {i < 2 && <div className={`ord-prog-line ${isActive && i < currentIdx ? "ord-prog-line--on" : ""}`} />}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Tracking */}
                      {displayStatus === "shipped" && order.trackingId && (
                        <div className="ord-tracking">
                          <div className="ord-tracking-info">
                            <Truck size={18} />
                            <div>
                              <strong>Shipment on the way!</strong>
                              <span>{order.courierName || "Courier"} · {order.trackingId}</span>
                            </div>
                          </div>
                          <a href={getTrackingUrl(order)} target="_blank" rel="noopener noreferrer" className="ord-track-btn">
                            Track <ChevronRight size={14} />
                          </a>
                        </div>
                      )}

                      {/* ✅ Cancel Order button completely removed from here */}

                      {/* Return Section */}
                      {displayStatus === "delivered" && !hasReturn && (
                        <div className="ord-return-cta">
                          <div>
                            <strong>Need to return?</strong>
                            <p>Only for damaged or wrong products with proof</p>
                          </div>
                          <button className="ord-return-btn" onClick={() => handleOpenReturn(order._id)}>
                            <RotateCcw size={14} /> Request Return
                          </button>
                        </div>
                      )}

                      {hasReturn && (
                        <div className="ord-return-status">
                          <div className="ord-return-status-head">
                            <strong>Return Request</strong>
                            <span className="ord-badge" style={{ background: `${retSt!.color}10`, color: retSt!.color, borderColor: retSt!.color }}>
                              {retSt!.icon} {retSt!.label}
                            </span>
                          </div>
                          <p><strong>Reason:</strong> {order.returnRequest!.reason}</p>
                          {order.returnRequest!.adminComment && (
                            <p className="ord-admin-comment">
                              <strong>Admin:</strong> {order.returnRequest!.adminComment}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Items */}
                      <div className="ord-items-section">
                        <h4>Items ({order.items?.length || 0})</h4>
                        <div className="ord-items-list">
                          {order.items?.map((item, i) => (
                            <div key={i} className="ord-item">
                              <div className="ord-item-img">
                                <img src={resolveImage(item.image)} alt={item.name} onError={e => { (e.target as HTMLImageElement).src = "/placeholder-product.png"; }} />
                              </div>
                              <div className="ord-item-info">
                                <h5>{item.name}</h5>
                                <div className="ord-item-meta">
                                  <span>{item.qty} pcs · {toPackets(item)} pkts</span>
                                  <span className="ord-item-price">₹{(item.qty * item.price).toLocaleString("en-IN")}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="ord-summary-grid">
                        <div className="ord-summary-card">
                          <div className="ord-sum-row">
                            <span><Hash size={13} /> Order No</span>
                            <span>{order.orderNumber}</span>
                          </div>
                          <div className="ord-sum-row">
                            <span><Calendar size={13} /> Date</span>
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="ord-sum-row">
                            <span><CreditCard size={13} /> Payment</span>
                            <span>{order.paymentMode || "Online"}</span>
                          </div>
                          <div className="ord-sum-row ord-sum-row--total">
                            <span>Total</span>
                            <span>₹{order.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <button className="ord-invoice-btn" onClick={() => generateInvoice(order)}>
                            <FileText size={15} /> View Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Return Modal ── */}
        {showReturnModal && (
          <div className="ord-modal-overlay" onClick={() => setShowReturnModal(false)}>
            <div className="ord-modal" onClick={e => e.stopPropagation()}>
              <div className="ord-modal-head">
                <h3><RotateCcw size={18} /> Return Request</h3>
                <button onClick={() => setShowReturnModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmitReturn} className="ord-modal-body">
                {/* Product Selection */}
                <div className="ord-modal-section">
                  <label className="ord-modal-label">Select Products to Return *</label>
                  <div className="ord-return-items">
                    {getSelectedOrderItems().map((item, i) => (
                      <label key={i} className={`ord-return-item ${returnSelectedItems.includes(item.name) ? "ord-return-item--on" : ""}`}>
                        <input type="checkbox" checked={returnSelectedItems.includes(item.name)} onChange={() => handleItemSelect(item.name)} />
                        <img src={resolveImage(item.image)} alt="" />
                        <div>
                          <span>{item.name}</span>
                          <small>Qty: {item.qty}</small>
                        </div>
                      </label>
                    ))}
                  </div>
                  {returnSelectedItems.length === 0 && <p className="ord-modal-err">Select at least one item</p>}
                </div>

                <div className="ord-modal-section">
                  <label className="ord-modal-label">Reason</label>
                  <select value={returnReason} onChange={e => setReturnReason(e.target.value)} className="ord-modal-select">
                    <option>Damaged Product</option>
                    <option>Wrong Product</option>
                  </select>
                </div>

                <div className="ord-modal-section">
                  <label className="ord-modal-label">Description *</label>
                  <textarea value={returnDescription} onChange={e => setReturnDescription(e.target.value)} required placeholder="Describe the issue..." className="ord-modal-textarea" />
                </div>

                <div className="ord-modal-section">
                  <label className="ord-modal-label"><Camera size={14} /> Upload Images (Proof) *</label>
                  <input type="file" multiple accept="image/*" onChange={e => setReturnImages(e.target.files)} required className="ord-modal-file" />
                </div>

                <div className="ord-modal-section">
                  <label className="ord-modal-label"><Video size={14} /> Upload Video (Optional)</label>
                  <input type="file" accept="video/*" onChange={e => setReturnVideo(e.target.files?.[0] || null)} className="ord-modal-file" />
                </div>

                <div className="ord-modal-footer">
                  <button type="button" onClick={() => setShowReturnModal(false)} className="ord-modal-cancel">Cancel</button>
                  <button type="submit" disabled={uploadingReturn} className="ord-modal-submit">
                    {uploadingReturn ? "Uploading..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Orders;