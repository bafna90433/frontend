// ════════════════════════════════════════════════════════════
// CHECKOUT UTILITY FUNCTIONS
// Extracted from Checkout.tsx — logic unchanged
// ════════════════════════════════════════════════════════════

import { MEDIA_URL } from "./api";
import type { Item, OrderData } from "../types/CheckoutTypes";

export const getMinimumQuantity = (item: Item): number => {
  const price = item.price || 0;
  const dbMQ = Number(item.minOrderQty) || 0;
  const dbPieces = Number(item.piecesPerUnit || item.piecesPerInner || item.innerQty) || 1;
  const strictBulk = item.isBulkOnly || false;

  if (strictBulk && dbPieces > 1) {
    return Math.max(dbMQ, dbPieces);
  } else {
    if (dbMQ > 0) return dbMQ;
    
    // Fallback logic
    const fallbackMin = price < 60 ? 3 : 2;
    return dbPieces > 1 ? dbPieces : fallbackMin;
  }
};

export const getItemValues = (item: Item) => {
  const piecesPerUnit = item.piecesPerUnit || item.piecesPerInner || item.innerQty || 1;
  const innerCount = Math.round((item.quantity || 0) / piecesPerUnit) || 1;
  const unitPrice = item.price || 0;
  const minQty = getMinimumQuantity(item);
  const totalPrice = (item.quantity || 0) * unitPrice;
  return { innerCount, unitPrice, totalPrice, minQty };
};

export const loadRazorpay = () =>
  new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const normalizeWhatsApp91 = (raw?: string) => {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  const without91 = digits.startsWith("91") ? digits.slice(2) : digits;
  const last10 = without91.length > 10 ? without91.slice(-10) : without91;
  if (last10.length !== 10) return "";
  return `91${last10}`;
};

// ✅ Updated: ImageKit Helper for Checkout Thumbnails
export const getThumbUrl = (url: string | undefined, baseUrl: string) => {
  if (!url) return "/images/placeholder.webp";
  if (url.includes("ik.imagekit.io")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}tr=w-150,h-150,cm-at_max,f-auto,q-80`;
  }
  if (url.startsWith("http")) return url;
  return `${baseUrl}${encodeURIComponent(url)}`;
};

export const generateInvoicePDF = (order: OrderData, user: any): boolean => {
  const win = window.open("", "_blank");
  if (!win) { alert("Popup blocked!"); return false; }
  
  const addr = order.shippingAddress;
  const wa = normalizeWhatsApp91(user?.whatsapp || user?.otpMobile);
  
  const orderDate = order.date ? new Date(order.date).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  }) : new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const shipTo = addr
    ? addr.isDifferentShipping
      ? `<strong>${addr.fullName || user?.ownerName || "Customer"}</strong><br/>${addr.shippingStreet}<br/>${addr.shippingArea || ""}<br/>${addr.shippingCity}, ${addr.shippingState} – ${addr.shippingPincode}<br/>📞 ${addr.phone || user?.otpMobile}`
      : `<strong>${addr.fullName || user?.ownerName || "Customer"}</strong><br/>${addr.street}<br/>${addr.area || ""}<br/>${addr.city}, ${addr.state} – ${addr.pincode}<br/>📞 ${addr.phone || user?.otpMobile}`
    : "No shipping address";

  const paymentText = order.paymentMode === "ONLINE" ? "Paid (Online)" : order.paymentMode === "COD" ? "Cash on Delivery" : (order.paymentMode || "Online");
  let payHtml = `Payment: ${paymentText}`;
  if (order.paymentMode === "COD" && (order.advancePaid || 0) > 0) {
    const rem = order.total - (order.advancePaid || 0);
    payHtml += `<br><span style="color:#16a34a">Advance: ₹${order.advancePaid}</span><br><strong style="color:#dc2626">Collect: ₹${rem}</strong>`;
  }

  const gstMap: Record<number, { base: number; gst: number }> = {};
  order.items.forEach(it => {
    const rate = it.gstRate || 0;
    const total = (it.qty || it.quantity) * it.price;
    const base = total / (1 + rate / 100);
    const gst = total - base;
    if (!gstMap[rate]) gstMap[rate] = { base: 0, gst: 0 };
    gstMap[rate].base += base;
    gstMap[rate].gst += gst;
  });

  const itemRows = order.items.map((it, i) => {
    const qty = it.qty || it.quantity;
    const amt = qty * it.price;
    return `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${it.name}<br><small style="color:#888">SKU: ${it.sku || "—"}</small></td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">₹${it.price.toLocaleString()}</td>
      <td style="text-align:right">₹${amt.toLocaleString()}</td>
    </tr>`;
  }).join("");

  const subtotal = order.itemsPrice || order.items.reduce((s, i) => s + (i.qty || i.quantity) * i.price, 0);
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

  const html = `<!DOCTYPE html><html><head><title>Invoice ${order.orderNumber}</title>
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
  <div style="text-align:right"><h1>INVOICE</h1><p style="opacity:.8;font-size:13px;margin-top:4px">${order.orderNumber}</p></div>
</div>
<div class="inv-meta">
  <section><h3>Bill To</h3><p><strong>${addr?.shopName || user?.shopName || addr?.fullName || "—"}</strong><br>GST: ${addr?.gstNumber || "N/A"}<br>📞 ${addr?.phone || user?.otpMobile || "—"}<br>💬 ${wa || "—"}</p></section>
  <section><h3>Ship To</h3><p>${shipTo}</p></section>
  <section><h3>Details</h3><p>Date: ${orderDate}<br>${payHtml}</p></section>
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
  return true;
};
