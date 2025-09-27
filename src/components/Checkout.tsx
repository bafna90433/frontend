// src/components/Checkout.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import api, { MEDIA_URL } from "../utils/api";
import "../styles/Checkout.css";

interface Item {
  _id: string;
  name: string;
  quantity?: number;
  bulkPricing?: Array<{ inner: number; qty: number; price: number }>;
  innerQty?: number;
  image?: string;
  images?: string[];
  price?: number;
}

interface User {
  _id: string;
  shopName?: string;
  otpMobile?: string;
  whatsapp?: string;
  isApproved?: boolean;
}

interface OrderData {
  orderNumber: string;
  items: Array<{
    productId: string;
    name: string;
    qty: number;
    innerQty: number;
    inners: number;
    price: number;
    image: string;
  }>;
  total: number;
  date: string;
  customerId: string;
}

/* ✅ Generate Invoice PDF */
const generateInvoicePDF = (orderData: OrderData, user: User | null): boolean => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocked! Please allow popups to view and print your invoice.");
    return false;
  }

  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const invoiceContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${orderData.orderNumber}</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          margin: 0; padding: 20px;
          background: #f4f6f9; color: #333;
        }
        .invoice-container {
          max-width: 850px; margin: 0 auto;
          border-radius: 10px; padding: 35px;
          background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2c5aa0;
          padding-bottom: 20px; margin-bottom: 30px;
        }
        .header img { max-height: 65px; margin-bottom: 10px; }
        .company-info { font-size: 14px; color: #555; line-height: 1.5; }
        .invoice-title {
          font-size: 26px; color: #2c5aa0;
          text-transform: uppercase; font-weight: bold;
          margin: 25px 0; text-align: center;
        }
        .invoice-details {
          display: flex; justify-content: space-between;
          flex-wrap: wrap; margin-bottom: 25px;
        }
        .detail-section {
          flex: 1; min-width: 260px; margin-bottom: 15px;
        }
        .detail-section h3 {
          font-size: 16px; color: #2c5aa0;
          margin-bottom: 8px; border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .billto-table {
          width: 100%; border-collapse: collapse; font-size: 14px;
        }
        .billto-table td { padding: 4px 6px; vertical-align: top; }
        .billto-table td:first-child { width: 130px; font-weight: 600; }

        .items-table {
          width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;
        }
        .items-table th {
          background: #2c5aa0; color: white;
          padding: 10px; text-align: left; font-size: 14px;
        }
        .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .items-table tr:nth-child(even) { background: #f9f9f9; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }

        .total-section { text-align: right; margin-top: 20px; }
        .grand-total {
          font-size: 20px; font-weight: bold;
          color: #2c5aa0; border-top: 2px solid #2c5aa0;
          padding-top: 10px; display: inline-block;
        }

        .footer {
          margin-top: 40px; padding-top: 15px;
          border-top: 1px solid #ccc;
          font-size: 13px; color: #555;
          text-align: center; line-height: 1.5;
        }
        .footer strong { color: #2c5aa0; }

        .invoice-buttons { margin-top: 20px; text-align: center; }
        .print-btn, .download-btn {
          margin: 10px; padding: 10px 20px; border-radius: 5px;
          font-size: 15px; font-weight: 600; cursor: pointer; border: none;
          transition: 0.3s ease;
        }
        .print-btn { background: #2c5aa0; color: white; }
        .print-btn:hover { background: #244a82; }
        .download-btn { background: #28a745; color: white; }
        .download-btn:hover { background: #1e7e34; }

        @media print {
          .invoice-buttons { display: none; }
          body { background: #fff; }
          .invoice-container, .items-table, .items-table tr, .items-table td, .items-table th {
            page-break-inside: avoid !important;
          }
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <script>
        function printInvoice() { window.print(); }
        function downloadAsPDF() {
          const element = document.querySelector('.invoice-container');
          const opt = {
            margin: [10, 10, 10, 10],
            filename: 'Invoice-${orderData.orderNumber}.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
          };
          html2pdf().set(opt).from(element).save();
        }
      </script>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <img src="logo.webp" alt="BafnaToys Logo" />
          <div class="company-info">
            1-12, Sundapalayam Rd, Coimbatore, Kalikkanaicken Palayam, Tamil Nadu 641007 <br/>
            Phone: +91 9043347300 | Email: bafnatoysphotos@gmail.com
          </div>
        </div>
        <h1 class="invoice-title">Pro Forma Invoice</h1>

        <div class="invoice-details">
          <div class="detail-section">
            <h3>Bill To</h3>
            <table class="billto-table">
              <tr><td>Shop Name</td><td>: ${user?.shopName || "Customer"}</td></tr>
              <tr><td>Mobile</td><td>: ${user?.otpMobile || "-"}</td></tr>
              <tr><td>WhatsApp</td><td>: ${user?.whatsapp || "-"}</td></tr>
            </table>
          </div>
          <div class="detail-section">
            <h3>Invoice Details</h3>
            <table class="billto-table">
              <tr><td>Invoice No</td><td>: ${orderData.orderNumber}</td></tr>
              <tr><td>Date</td><td>: ${currentDate}</td></tr>
              <tr><td>Status</td><td>: ${orderData.status || "Pending"}</td></tr>
            </table>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Rate (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.items.map(item => {
              const pcsLabel = item.qty === 1 ? "pc" : "pcs";
              const innerLabel = item.inners === 1 ? "inner" : "inners";
              return `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.qty} ${pcsLabel} (${item.inners} ${innerLabel})</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${(item.qty * item.price).toFixed(2)}</td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>

        <div class="total-section">
          <div class="grand-total">
            Grand Total: ₹${orderData.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div class="footer">
          <p><strong>Thank you for shopping with BafnaToys!</strong><br/>This is a computer-generated invoice.</p>
        </div>
      </div>

      <div class="invoice-buttons">
        <button class="print-btn" onclick="printInvoice()">🖨️ Print Invoice</button>
        <button class="download-btn" onclick="downloadAsPDF()">📄 Download as PDF</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(invoiceContent);
  printWindow.document.close();
  return true;
};


/* ✅ Helper for Line Total */
const getItemTotalPrice = (item: Item): number => {
  const sortedTiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
  const inners = item.quantity || 0;
  const activeTier =
    sortedTiers.length > 0
      ? sortedTiers.reduce((prev, tier) => (inners >= tier.inner ? tier : prev), sortedTiers[0])
      : null;
  if (!activeTier) return 0;
  const piecesPerInner =
    item.innerQty && item.innerQty > 0
      ? item.innerQty
      : activeTier.qty > 0 && activeTier.inner > 0
      ? activeTier.qty / activeTier.inner
      : 1;
  const totalPieces = inners * piecesPerInner;
  return totalPieces * activeTier.price;
};

/* ✅ Checkout Component */
const Checkout: React.FC = () => {
  const { cartItems, setCartItemQuantity, clearCart, removeFromCart } = useShop();
  const navigate = useNavigate();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);

  const IMAGE_BASE_URL = `${MEDIA_URL}/uploads/`;
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const isApproved = user?.isApproved === true;

  const totalInners = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const grandTotal = cartItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0);

  const handleViewInvoice = () => {
    if (!orderDetails) return;
    generateInvoicePDF(orderDetails, user);
  };

  const handlePlaceOrder = async () => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(raw);
    if (!cartItems.length) {
      alert("Cart is empty.");
      return;
    }

    const items = cartItems.map((item: Item) => {
      const sortedTiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
      const activeTier =
        sortedTiers.length > 0
          ? sortedTiers.reduce((prev, tier) => (item.quantity! >= tier.inner ? tier : prev), sortedTiers[0])
          : null;
      const piecesPerInner =
        item.innerQty && item.innerQty > 0
          ? item.innerQty
          : activeTier && activeTier.inner > 0
          ? activeTier.qty / activeTier.inner
          : 1;
      const totalPieces = (item.quantity || 0) * piecesPerInner;
      return {
        productId: item._id,
        name: item.name,
        qty: totalPieces,
        innerQty: piecesPerInner,
        inners: item.quantity || 0,
        price: activeTier ? activeTier.price : item.price || 0,
        image: item.image || item.images?.[0] || "",
      };
    });

    const payload = { customerId: user._id, items, total: grandTotal };

    try {
      setPlacing(true);
      const { data } = await api.post("/orders", payload);
      const orderNumber = data?.order?.orderNumber || data?.orderNumber;
      if (!orderNumber) throw new Error("Order number not returned");

      setOrderNumber(orderNumber);
      setOrderDetails({
        orderNumber,
        items,
        total: grandTotal,
        date: new Date().toISOString(),
        customerId: user._id,
      });
      setOrderPlaced(true);
      clearCart();
    } catch (err: any) {
      console.error("Order place error:", err);
      alert(err?.response?.data?.message || err?.message || "Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (cartItems.length === 0 && !orderPlaced) {
    return <div className="checkout-empty">No items in cart.</div>;
  }

  if (orderPlaced) {
    return (
      <div className="checkout-success">
        <h2>Order placed successfully!</h2>
        <p>
          Thank you, <b>{user?.shopName}</b>! <br />
          <b>Your Order Number: {orderNumber}</b>
        </p>
        <div className="invoice-actions" style={{ marginTop: "30px", textAlign: "center" }}>
          <h3>Invoice Options</h3>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleViewInvoice} className="modern-btn" style={{ background: "#2c5aa0" }}>
              📄 View / Print / Download Invoice
            </button>
            <button onClick={() => navigate("/orders")} className="modern-btn" style={{ background: "#6c757d" }}>
              📋 View All Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-wrapper two-column">
      <div className="checkout-left">
        <h2>Your Order</h2>
        {cartItems.map((item: Item) => {
          const sortedTiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
          const inners = item.quantity || 0;
          const imgSrc = item.image?.startsWith("http")
            ? item.image
            : item.image?.includes("/uploads/")
            ? `${MEDIA_URL}${item.image}`
            : `${IMAGE_BASE_URL}${encodeURIComponent(item.image || "")}`;
          const activeTier =
            sortedTiers.length > 0
              ? sortedTiers.reduce((prev, tier) => (inners >= tier.inner ? tier : prev), sortedTiers[0])
              : null;

          return (
            <div key={item._id} className="checkout-item">
              <div className="checkout-image-wrapper">
                <img
                  src={imgSrc}
                  alt={item.name}
                  className="checkout-item-big-img"
                  onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.png")}
                />
              </div>
              <div className="checkout-item-info">
                <div className="checkout-item-name">
                  {item.name}
                  <button
                    className="checkout-remove-btn"
                    onClick={() => removeFromCart(item._id)}
                    title="Remove from cart"
                  ></button>
                </div>
                <div className="checkout-item-qty fancy-qty">
                  <button className="qty-btn" onClick={() => setCartItemQuantity(item, Math.max(1, item.quantity! - 1))}>
                    –
                  </button>
                  <span className="qty-value">{inners}</span>
                  <button className="qty-btn" onClick={() => setCartItemQuantity(item, item.quantity! + 1)}>
                    +
                  </button>
                </div>
                <div className="checkout-item-total">Total Inners: {inners}</div>
                <div className="packing-section">
                  <h4 className="packing-title">
                    <span className="packing-icon">P</span> Packing & Pricing
                  </h4>
                  <ul className="pricing-list">
                    {sortedTiers.map((tier) => {
                      const highlight = activeTier && tier.inner === activeTier.inner;
                      return (
                        <li key={tier.inner} className={highlight ? "active-tier-row" : ""}>
                          {tier.inner} inner ({tier.qty} pcs) {isApproved ? ` ₹${tier.price}/pc` : " 🔒"}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {isApproved && (
                  <div className="product-line-total">
                    <b>Line Total:</b> ₹{getItemTotalPrice(item).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="checkout-right checkout-card">
        <h2 className="checkout-title">Complete Your Order</h2>
        <div className="checkout-summary">
          <p><b>Total Items:</b> {cartItems.length}</p>
          <p><b>Total Inners:</b> {totalInners}</p>
          {isApproved && <p><b>Grand Total:</b> ₹{grandTotal.toLocaleString()}</p>}
        </div>
        <button
          className="checkout-placeorder modern-btn"
          onClick={handlePlaceOrder}
          disabled={placing || !cartItems.length}
        >
          {placing ? "Placing Order..." : "✅ Place Order"}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
