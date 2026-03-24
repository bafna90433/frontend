// src/components/Orders.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
  innerQty?: number;
  inners?: number;
  nosPerInner?: number;
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

// ✅ Updated Shipping Address Type
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
  paymentMode?: string;
  estimatedDelivery?: string;
  trackingId?: string;
  courierName?: string;
  isShipped?: boolean;
  shippingAddress?: string | ShippingAddress; // ✅ Used new type
  returnRequest?: ReturnRequest;
};

const trimTrailingSlash = (s: string) => s.replace(/\/+$/, "");

const useBases = () =>
  useMemo(() => {
    const rawApi = import.meta.env.VITE_API_URL as string | undefined;
    const rawImage =
      (import.meta.env.VITE_IMAGE_BASE_URL as string | undefined) ||
      (rawApi ? rawApi.replace(/\/api\/?$/, "") : undefined) ||
      (import.meta.env.VITE_MEDIA_URL as string | undefined);
    return {
      apiBase: trimTrailingSlash(rawApi || "http://localhost:5000/api"),
      imageBase: trimTrailingSlash(rawImage || "http://localhost:5000"),
    };
  }, []);

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

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "#f59e0b", bg: "rgba(245,158,11,.08)", icon: <Clock size={14} />, label: "Pending" },
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
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sa = order.shippingAddress as ShippingAddress;
  const wa = normalizeWhatsApp91(user?.whatsapp || user?.otpMobile);

  let shippingHtml = "No shipping address provided";
  
  // ✅ Handling Different Shipping Logic
  if (sa && typeof sa === "object") {
    if (sa.isDifferentShipping) {
      shippingHtml = [
        sa.fullName ? `<strong>${sa.fullName}</strong>` : "",
        sa.shippingStreet,
        sa.shippingArea,
        `${sa.shippingCity}, ${sa.shippingState}`,
        sa.shippingPincode ? `PIN: ${sa.shippingPincode}` : "",
        sa.phone ? `Phone: ${sa.phone}` : "",
      ].filter(Boolean).join("<br>");
    } else {
      shippingHtml = [
        sa.fullName ? `<strong>${sa.fullName}</strong>` : "",
        sa.street,
        sa.area,
        `${sa.city}, ${sa.state}`,
        sa.pincode ? `PIN: ${sa.pincode}` : "",
        sa.phone ? `Phone: ${sa.phone}` : "",
      ].filter(Boolean).join("<br>");
    }
  } else if (typeof sa === "string") {
    shippingHtml = sa;
  }

  const paymentText = order.paymentMode === "ONLINE" ? "Paid (Online)" : order.paymentMode === "COD" ? "Cash on Delivery" : (order.paymentMode || "Online");

  const content = `<!DOCTYPE html><html><head><title>Invoice - ${order.orderNumber || order._id.slice(-6)}</title><style>body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;background:#fff;color:#333}.invoice-container{max-width:850px;margin:0 auto;border:1px solid #ddd;padding:30px}.header{text-align:center;margin-bottom:25px;border-bottom:3px solid #2c5aa0;padding-bottom:15px}.header img{max-height:70px}.invoice-details{display:flex;justify-content:space-between;gap:14px;margin-bottom:25px}.detail-section{width:32%}.detail-section h3{font-size:15px;color:#2c5aa0;border-bottom:1px solid #ddd;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px}th{background:#2c5aa0;color:#fff;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #eee}.footer{margin-top:40px;text-align:center;font-size:12px;color:#777}@media print{.btn-hide{display:none}}</style></head><body><div class="invoice-container"><div class="header"><img src="https://res.cloudinary.com/dpdecxqb9/image/upload/v1758783697/bafnatoys/lwccljc9kkosfv9wnnrq.png" alt="BafnaToys"/><p>1-12, Thondamuthur Road, Coimbatore - 641007<br>+91 9043347300 | bafnatoysphotos@gmail.com</p><h2>PRO FORMA INVOICE</h2></div><div class="invoice-details"><div class="detail-section"><h3>Bill To</h3><p><strong>${sa?.shopName || user?.shopName || "-"}</strong><br>GST: ${sa?.gstNumber || "N/A"}<br>Mobile: ${user?.otpMobile || "-"}<br>WhatsApp: ${wa || "-"}</p></div><div class="detail-section"><h3>Ship To</h3><p>${shippingHtml}</p></div><div class="detail-section"><h3>Order Details</h3><p>Invoice: ${order.orderNumber || order._id.slice(-6)}<br>Date: ${currentDate}<br>Payment: ${paymentText}${order.trackingId ? `<br>AWB: ${order.trackingId}` : ""}</p></div></div><table><thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${(order.items || []).map((it) => `<tr><td>${it.name}</td><td>${it.qty}</td><td>₹${it.price}</td><td>₹${it.qty * it.price}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="3" align="right"><strong>Total</strong></td><td><strong>₹${order.total}</strong></td></tr></tfoot></table><div class="footer"><p>Thank you for choosing BafnaToys!</p></div></div><div style="text-align:center;margin-top:20px" class="btn-hide"><button onclick="window.print()" style="padding:10px 20px;background:#2c5aa0;color:white;border:none;cursor:pointer;margin-right:10px;">Print Invoice</button><button onclick="window.close()" style="padding:10px 20px;background:#64748b;color:white;border:none;cursor:pointer">Close</button></div></body></html>`;

  printWindow.document.write(content);
  printWindow.document.close();
};

const Orders: React.FC = () => {
  const { apiBase, imageBase } = useBases();

  const resolveImage = (img?: string) => {
    if (!img) return "/placeholder-product.png";
    if (/^https?:\/\//i.test(img)) return img;
    return `${imageBase}/${img.replace(/^\//, "")}`;
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
      const token = localStorage.getItem("token");
      const response = await axios.post(`${apiBase}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
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
        const token = localStorage.getItem("token");
        if (!user?._id) { setError("Invalid session. Please login again."); setLoading(false); return; }
        const response = await axios.get(`${apiBase}/orders`, {
          params: { customerId: user._id },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  }, [apiBase]);

  const filteredOrders = useMemo(() => {
    let list = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);
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

  // ✅ UPDATED TRACKING URL LOGIC (Delhivery Deep Link setup)
  const getTrackingUrl = (order: Order) => {
    if (!order.trackingId) return "#";
    const c = (order.courierName || "").toLowerCase();
    
    if (c.includes("delhivery")) {
      return `https://www.delhivery.com/track/package/?waybill=${order.trackingId}`;
    }
    if (c.includes("vxpress") || c.includes("v-xpress") || c.includes("v xpress")) {
      return "https://vxpress.in/track-result/";
    }
    return `https://www.google.com/search?q=${encodeURIComponent(`${order.trackingId} tracking`)}`;
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${apiBase}/orders/${orderId}/status`, { status: "cancelled", cancelledBy: "Customer" },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "cancelled" } : o));
    } catch { alert("Failed to cancel."); }
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

      const token = localStorage.getItem("token");
      await axios.put(`${apiBase}/orders/return/${selectedOrderId}`, {
        reason: returnReason,
        description: `[RETURN ITEMS: ${returnSelectedItems.join(", ")}]\n\n${returnDescription}`,
        images: imgUrls,
        video: vidUrl,
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

      alert("Return request submitted!");
      setShowReturnModal(false);
      window.location.reload();
    } catch { alert("Failed to submit return."); } finally { setUploadingReturn(false); }
  };

  const getSelectedOrderItems = () => orders.find(o => o._id === selectedOrderId)?.items || [];

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  const filterTabs = [
    { key: "all", label: "All", icon: <Package size={14} /> },
    { key: "pending", label: "Pending", icon: <Clock size={14} /> },
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
              const st = statusConfig[order.status];
              const hasReturn = order.returnRequest?.isRequested;
              const retSt = hasReturn ? returnStatusConfig[order.returnRequest!.status] : null;

              return (
                <div key={order._id} className={`ord-card ${isOpen ? "ord-card--open" : ""}`}>
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
                      {/* Progress */}
                      <div className={`ord-progress ${order.status === "cancelled" ? "ord-progress--off" : ""}`}>
                        {(["pending", "processing", "shipped", "delivered"] as const).map((step, i) => {
                          const stepOrder = ["pending", "processing", "shipped", "delivered"];
                          const currentIdx = stepOrder.indexOf(order.status);
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
                              {i < 3 && <div className={`ord-prog-line ${isActive && i < currentIdx ? "ord-prog-line--on" : ""}`} />}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Tracking */}
                      {order.status === "shipped" && order.trackingId && (
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

                      {/* Cancel */}
                      {order.status === "pending" && (
                        <button className="ord-cancel-btn" onClick={() => handleCancelOrder(order._id)}>
                          <XCircle size={15} /> Cancel Order
                        </button>
                      )}

                      {/* Return Section */}
                      {order.status === "delivered" && !hasReturn && (
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