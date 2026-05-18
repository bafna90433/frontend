// src/components/OrderDetails.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { MEDIA_URL } from "../utils/api";
import MainLayout from "./MainLayout";
import "../styles/Orders.css";
import {
  Package, ChevronRight, FileText, X, Truck,
  CheckCircle2, Clock, XCircle, RotateCcw, AlertTriangle,
  CreditCard, Calendar, Hash, Camera, Video, ArrowLeft,
} from "lucide-react";

type OrderItem = { productId?: string; name: string; qty: number; price: number; image?: string; inners?: number; nosPerInner?: number; sku?: string; gstRate?: number; };
type ReturnRequest = { isRequested: boolean; status: "Pending" | "Approved" | "Rejected"; reason: string; description: string; proofImages: string[]; proofVideo: string; adminComment?: string; requestDate?: string; };
type ShippingAddress = { shopName?: string; gstNumber?: string; fullName?: string; phone?: string; street?: string; area?: string; city?: string; state?: string; pincode?: string; isDifferentShipping?: boolean; shippingStreet?: string; shippingArea?: string; shippingCity?: string; shippingState?: string; shippingPincode?: string; };
type Order = { _id: string; orderNumber?: string; createdAt?: string; status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned"; items?: OrderItem[]; total: number; itemsPrice?: number; shippingPrice?: number; discountAmount?: number; advancePaid?: number; remainingAmount?: number; paymentMode?: string; estimatedDelivery?: string; trackingId?: string; courierName?: string; isShipped?: boolean; shippingAddress?: string | ShippingAddress; returnRequest?: ReturnRequest; };


const formatDate = (iso?: string) => {
  if (!iso) return "-";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
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

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>(); 
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("Damaged Product");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnImages, setReturnImages] = useState<FileList | null>(null);
  const [returnVideo, setReturnVideo] = useState<File | null>(null);
  const [uploadingReturn, setUploadingReturn] = useState(false);
  const [returnSelectedItems, setReturnSelectedItems] = useState<string[]>([]);

  // ✅ ADDED: ImageKit Optimizer for small thumbnails
  const resolveImage = (img?: string) => {
    if (!img) return "/placeholder-product.png";
    
    if (img.includes("ik.imagekit.io")) {
      const sep = img.includes("?") ? "&" : "?";
      return `${img}${sep}tr=w-150,h-150,cm-at_max,f-auto,q-80`;
    }
    
    if (img.includes("res.cloudinary.com") && img.includes("/image/upload/")) {
      if (img.includes("/f_auto") || img.includes("/w_")) return img;
      return img.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_150,h_150,c_fill/`);
    }

    if (/^https?:\/\//i.test(img)) return img;
    return `${MEDIA_URL}/${img.replace(/^\//, "")}`;
  };

  useEffect(() => {
    const fetchSingleOrder = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        
        if (!userStr) { setError("Please login to view this order."); setLoading(false); return; }
        
        const user = JSON.parse(userStr);
        const response = await api.get(`/orders`, {
          params: { customerId: user._id },
        });

        if (response.data && Array.isArray(response.data)) {
          const foundOrder = response.data.find((o: Order) => o._id === orderId || o.orderNumber === orderId);
          if (foundOrder) {
            setOrder(foundOrder);
          } else {
            setError("Order not found or you don't have permission to view it.");
          }
        }
      } catch (err: any) {
        setError("Failed to fetch order details.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchSingleOrder();
  }, [orderId]);

  const getTrackingUrl = (trackingId: string, courierName?: string) => {
    if (!trackingId) return "#";
    const c = (courierName || "").toLowerCase();
    if (c.includes("delhivery")) return `https://www.delhivery.com/track-v2/package/${trackingId}`;
    if (c.includes("vxpress") || c.includes("v-xpress") || c.includes("v xpress")) return "https://vxpress.in/track-result/";
    return `https://www.google.com/search?q=${encodeURIComponent(`${trackingId} tracking`)}`;
  };

  const handleCancelOrder = async () => {
    if (!order || !window.confirm("Cancel this order?")) return;
    try {
      await api.put(`/orders/${order._id}/status`, { status: "cancelled", cancelledBy: "Customer" });
      setOrder({ ...order, status: "cancelled" });
    } catch { alert("Failed to cancel."); }
  };

  const handleItemSelect = (name: string) => setReturnSelectedItems(prev => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
  
  const uploadFileToBackend = async (file: File) => {
    const formData = new FormData(); formData.append("images", file);
    try {
      const response = await api.post(`/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      return response.data?.urls?.[0] || null;
    } catch { return null; }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || returnSelectedItems.length === 0) { alert("Select at least one product."); return; }
    setUploadingReturn(true);
    try {
      let imgUrls: string[] = [];
      if (returnImages) { for (let i = 0; i < returnImages.length; i++) { const url = await uploadFileToBackend(returnImages[i]); if (url) imgUrls.push(url); } }
      let vidUrl = "";
      if (returnVideo) { const v = await uploadFileToBackend(returnVideo); if (v) vidUrl = v; }
      if (returnImages && returnImages.length > 0 && imgUrls.length === 0) { alert("Upload failed."); setUploadingReturn(false); return; }

      await api.put(`/orders/return/${order._id}`, {
        reason: returnReason, description: `[RETURN ITEMS: ${returnSelectedItems.join(", ")}]\n\n${returnDescription}`, images: imgUrls, video: vidUrl,
      });

      alert("Return request submitted!");
      setShowReturnModal(false);
      window.location.reload();
    } catch { alert("Failed to submit return."); } finally { setUploadingReturn(false); }
  };

  if (loading) return <MainLayout><div className="ord-state"><div className="ord-spinner" /><p>Loading order details...</p></div></MainLayout>;
  if (error || !order) return <MainLayout><div className="ord-state ord-state--err"><AlertTriangle size={40} /><h3>Oops!</h3><p>{error}</p><button className="ord-state-btn" onClick={() => navigate('/orders')}>Back to Orders</button></div></MainLayout>;

  const st = statusConfig[order.status];
  const hasReturn = order.returnRequest?.isRequested;
  const retSt = hasReturn && order.returnRequest ? returnStatusConfig[order.returnRequest.status] : null;

  return (
    <MainLayout>
      <div className="ord-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "20px 0" }}>
        
        <div className="ord-mob-head" style={{ marginBottom: "20px" }}>
          <button className="ord-back" onClick={() => navigate('/orders')}>
            <ArrowLeft size={20} />
          </button>
          <div className="ord-mob-head-text">
            <h1>Order Details</h1>
            <span>{order.orderNumber || order._id.slice(-6).toUpperCase()}</span>
          </div>
        </div>

        <div className="ord-card ord-card--open" style={{ border: 'none', boxShadow: 'none' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Placed on {formatDate(order.createdAt)}</p>
              <h2 style={{ margin: '5px 0 0 0', fontSize: '18px' }}>Total: ₹{order.total.toLocaleString("en-IN")}</h2>
            </div>
            <div className="ord-badge" style={{ background: retSt ? `${retSt.color}10` : st.bg, color: retSt ? retSt.color : st.color, borderColor: retSt ? retSt.color : st.color, fontSize: '14px', padding: '6px 12px' }}>
              {retSt ? <span>{retSt.icon}</span> : st.icon}
              {retSt ? retSt.label : st.label}
            </div>
          </div>

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
                      {order.status === "cancelled" ? <XCircle size={14} /> : i < currentIdx ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
                    </div>
                    <span className="ord-prog-label">{statusConfig[step].label}</span>
                  </div>
                  {i < 3 && <div className={`ord-prog-line ${isActive && i < currentIdx ? "ord-prog-line--on" : ""}`} />}
                </React.Fragment>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '20px 0' }}>
            {order.status === "shipped" && order.trackingId && (
              <a href={getTrackingUrl(order.trackingId, order.courierName)} target="_blank" rel="noopener noreferrer" className="ord-track-btn" style={{ flex: 1, textAlign: 'center' }}>
                <Truck size={15} style={{ marginRight: '5px' }} /> Track Shipment
              </a>
            )}
            {order.status === "pending" && (
              <button className="ord-cancel-btn" onClick={handleCancelOrder} style={{ flex: 1 }}>
                <XCircle size={15} /> Cancel Order
              </button>
            )}
            {order.status === "delivered" && !hasReturn && (
              <button className="ord-return-btn" onClick={() => setShowReturnModal(true)} style={{ flex: 1 }}>
                <RotateCcw size={14} /> Request Return
              </button>
            )}
            <button className="ord-invoice-btn" onClick={() => generateInvoice(order)} style={{ flex: 1 }}>
              <FileText size={15} /> View Invoice
            </button>
          </div>

          <div className="ord-items-section" style={{ marginTop: '30px' }}>
            <h4>Products in this Order ({order.items?.length || 0})</h4>
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

          {hasReturn && order.returnRequest && (
            <div className="ord-return-status" style={{ marginTop: '20px' }}>
              <div className="ord-return-status-head">
                <strong>Return Request Details</strong>
              </div>
              <p><strong>Reason:</strong> {order.returnRequest.reason}</p>
              <p><strong>Description:</strong> {order.returnRequest.description}</p>
              {order.returnRequest.adminComment && (
                <p className="ord-admin-comment"><strong>Admin Note:</strong> {order.returnRequest.adminComment}</p>
              )}
            </div>
          )}

        </div>
      </div>

      {showReturnModal && (
          <div className="ord-modal-overlay" onClick={() => setShowReturnModal(false)}>
            <div className="ord-modal" onClick={e => e.stopPropagation()}>
              <div className="ord-modal-head">
                <h3><RotateCcw size={18} /> Return Request</h3>
                <button onClick={() => setShowReturnModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmitReturn} className="ord-modal-body">
                <div className="ord-modal-section">
                  <label className="ord-modal-label">Select Products to Return *</label>
                  <div className="ord-return-items">
                    {(order.items || []).map((item, i) => (
                      <label key={i} className={`ord-return-item ${returnSelectedItems.includes(item.name) ? "ord-return-item--on" : ""}`}>
                        <input type="checkbox" checked={returnSelectedItems.includes(item.name)} onChange={() => handleItemSelect(item.name)} />
                        <img src={resolveImage(item.image)} alt="" />
                        <div><span>{item.name}</span><small>Qty: {item.qty}</small></div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="ord-modal-section"><label className="ord-modal-label">Reason</label><select value={returnReason} onChange={e => setReturnReason(e.target.value)} className="ord-modal-select"><option>Damaged Product</option><option>Wrong Product</option></select></div>
                <div className="ord-modal-section"><label className="ord-modal-label">Description *</label><textarea value={returnDescription} onChange={e => setReturnDescription(e.target.value)} required placeholder="Describe the issue..." className="ord-modal-textarea" /></div>
                <div className="ord-modal-section"><label className="ord-modal-label"><Camera size={14} /> Upload Images (Proof) *</label><input type="file" multiple accept="image/*" onChange={e => setReturnImages(e.target.files)} required className="ord-modal-file" /></div>
                <div className="ord-modal-section"><label className="ord-modal-label"><Video size={14} /> Upload Video (Optional)</label><input type="file" accept="video/*" onChange={e => setReturnVideo(e.target.files?.[0] || null)} className="ord-modal-file" /></div>
                <div className="ord-modal-footer">
                  <button type="button" onClick={() => setShowReturnModal(false)} className="ord-modal-cancel">Cancel</button>
                  <button type="submit" disabled={uploadingReturn} className="ord-modal-submit">{uploadingReturn ? "Uploading..." : "Submit Request"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </MainLayout>
  );
};

export default OrderDetails;