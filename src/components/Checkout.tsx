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
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
  };
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
  paymentMethod: string;
  date: string;
  customerId: string;
}

const generateInvoicePDF = (
  orderData: OrderData,
  user: User | null
): boolean => {
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
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          background: white;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          padding: 30px;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2c5aa0;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header img {
          max-height: 60px;
          margin-bottom: 10px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #2c5aa0;
          margin-bottom: 5px;
        }
        .invoice-title {
          font-size: 24px;
          margin: 10px 0;
          color: #333;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .detail-section {
          flex: 1;
          min-width: 250px;
          margin-bottom: 15px;
        }
        .detail-section h3 {
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 10px;
          color: #2c5aa0;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th {
          background: #2c5aa0;
          color: white;
          padding: 12px;
          text-align: left;
        }
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }
        .items-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        .total-section {
          text-align: right;
          margin-top: 20px;
          font-size: 18px;
        }
        .grand-total {
          font-size: 22px;
          font-weight: bold;
          color: #2c5aa0;
          border-top: 2px solid #2c5aa0;
          padding-top: 10px;
        }
        .invoice-buttons {
          margin-top: 20px;
          text-align: center;
        }
        .print-btn, .download-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 10px;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          border: none;
        }
        .print-btn {
          background: #2c5aa0;
          color: white;
        }
        .download-btn {
          background: #28a745;
          color: white;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 14px;
        }
        @media print {
          .invoice-buttons { display: none; }
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <script>
        function printInvoice() { window.print(); }
        function downloadAsPDF() {
          const element = document.querySelector('.invoice-container');
          html2pdf()
            .from(element)
            .save('Invoice-${orderData.orderNumber}.pdf');
        }
      </script>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <img src="logo.webp" alt="Company Logo" />
          <div>wholesaler</div>
          <div>1-12, Sundapalayam Rd, Coimbatore, Kalikkanaicken Palayam, Tamil Nadu 641007</div>
          <div>Phone: +91 9043347300 | Email: bafnatoysphotos@gmail.com</div>
        </div>
        <h1 class="invoice-title">TAX INVOICE</h1>
        <div class="invoice-details">
          <div class="detail-section">
            <h3>Bill To:</h3>
            <div><strong>${user?.name || "Customer"}</strong></div>
            <div>${user?.email || ""}</div>
            <div>${user?.phone || ""}</div>
            <div>${
              user?.address
                ? `${user.address.street}, ${user.address.city}`
                : ""
            }</div>
          </div>
          <div class="detail-section">
            <h3>Invoice Details:</h3>
            <div><strong>Invoice No:</strong> ${orderData.orderNumber}</div>
            <div><strong>Date:</strong> ${currentDate}</div>
            <div><strong>Order Type:</strong> Regular</div>
            <div><strong>Payment Method:</strong> ${
              orderData.paymentMethod || "COD"
            }</div>
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
            ${orderData.items
              .map(
                (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.qty} pcs (${item.inners} inners)</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${(item.qty * item.price).toFixed(2)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
        <div class="total-section">
          <div class="grand-total">
            Grand Total: ₹${orderData.total.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Terms & Conditions: Goods once sold will not be taken back. Subject to jurisdiction.</p>
          <p>This is a computer generated invoice.</p>
        </div>
      </div>
      <div class="invoice-buttons">
        <button class="print-btn" onclick="printInvoice()">
          🖨️ Print Invoice
        </button>
        <button class="download-btn" onclick="downloadAsPDF()">
          📄 Download as PDF
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(invoiceContent);
  printWindow.document.close();
  return true;
};

const getItemTotalPrice = (item: Item): number => {
  const sortedTiers = [...(item.bulkPricing || [])].sort(
    (a, b) => a.inner - b.inner
  );
  const inners = item.quantity || 0;

  const activeTier =
    sortedTiers.length > 0
      ? sortedTiers.reduce(
          (prev, tier) => (inners >= tier.inner ? tier : prev),
          sortedTiers[0]
        )
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

const Checkout: React.FC = () => {
  const { cartItems, setCartItemQuantity, clearCart, removeFromCart } =
    useShop();
  const navigate = useNavigate();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);

  const IMAGE_BASE_URL = `${MEDIA_URL}/uploads/`;

  const user: User | null = JSON.parse(
    localStorage.getItem("user") || "null"
  );
  const isApproved = user?.isApproved === true;

  const totalInners = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  const grandTotal = cartItems.reduce(
    (sum, item) => sum + getItemTotalPrice(item),
    0
  );

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
      const sortedTiers = [...(item.bulkPricing || [])].sort(
        (a, b) => a.inner - b.inner
      );
      const activeTier =
        sortedTiers.length > 0
          ? sortedTiers.reduce(
              (prev, tier) => (item.quantity! >= tier.inner ? tier : prev),
              sortedTiers[0]
            )
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

    const payload = {
      customerId: user._id,
      items,
      total: grandTotal,
      paymentMethod: "COD",
    };

    try {
      setPlacing(true);
      const { data } = await api.post("/orders", payload);
      const orderNumber =
        data?.order?.orderNumber ||
        data?.orderNumber ||
        data?.order?.orderNumber;
      if (!orderNumber) throw new Error("Order number not returned");

      setOrderNumber(orderNumber);

      const completeOrderDetails: OrderData = {
        orderNumber: orderNumber,
        items: items,
        total: grandTotal,
        paymentMethod: "COD",
        date: new Date().toISOString(),
        customerId: user._id,
      };

      setOrderDetails(completeOrderDetails);
      setOrderPlaced(true);
      clearCart();
    } catch (err: any) {
      console.error("Order place error:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Could not place order. Please try again."
      );
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
          Thank you for your purchase.
          <br />
          <b>Your Order Number: {orderNumber}</b>
        </p>
        <div
          className="invoice-actions"
          style={{ marginTop: "30px", textAlign: "center" }}
        >
          <h3>Invoice Options</h3>
          <div
            style={{
              display: "flex",
              gap: "15px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleViewInvoice}
              className="modern-btn"
              style={{ background: "#2c5aa0" }}
            >
              📄 View/Print Invoice
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="modern-btn"
              style={{ background: "#6c757d" }}
            >
              📋 View All Orders
            </button>
          </div>
        </div>
        <div
          className="invoice-preview"
          style={{
            marginTop: "30px",
            textAlign: "left",
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "5px",
            background: "#f9f9f9",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <strong>Invoice #:</strong> {orderDetails?.orderNumber}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <strong>Date:</strong> {new Date(orderDetails?.date).toLocaleDateString()}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <strong>Total Items:</strong> {orderDetails?.items.length}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <strong>Grand Total:</strong> ₹{orderDetails?.total.toLocaleString()}
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
          const sortedTiers = [...(item.bulkPricing || [])].sort(
            (a, b) => a.inner - b.inner
          );
          const inners = item.quantity || 0;

          const imgSrc = item.image?.startsWith("http")
            ? item.image
            : item.image?.includes("/uploads/")
            ? `${MEDIA_URL}${item.image}`
            : `${IMAGE_BASE_URL}${encodeURIComponent(item.image || "")}`;

          const activeTier =
            sortedTiers.length > 0
              ? sortedTiers.reduce(
                  (prev, tier) => (inners >= tier.inner ? tier : prev),
                  sortedTiers[0]
                )
              : null;

          return (
            <div key={item._id} className="checkout-item">
              <div className="checkout-image-wrapper">
                <img
                  src={imgSrc}
                  alt={item.name}
                  className="checkout-item-big-img"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).src = "/placeholder.png")
                  }
                />
              </div>
              <div className="checkout-item-info">
                <div className="checkout-item-name">
                  {item.name}
                  <button
                    className="checkout-remove-btn"
                    onClick={() => removeFromCart(item._id)}
                    title="Remove from cart"
                  >
                    🗑
                  </button>
                </div>
                <div className="checkout-item-qty fancy-qty">
                  <button
                    className="qty-btn"
                    onClick={() =>
                      setCartItemQuantity(item, Math.max(1, item.quantity! - 1))
                    }
                  >
                    –
                  </button>
                  <span className="qty-value">{inners}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setCartItemQuantity(item, item.quantity! + 1)}
                  >
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
                      const highlight =
                        activeTier && tier.inner === activeTier.inner;
                      return (
                        <li
                          key={tier.inner}
                          className={highlight ? "active-tier-row" : ""}
                        >
                          {tier.inner} inner ({tier.qty} pcs)
                          {isApproved ? ` ₹${tier.price}/pc` : " 🔒"}
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
          <p>
            <b>Total Items:</b> {cartItems.length}
          </p>
          <p>
            <b>Total Inners:</b> {totalInners}
          </p>
          {isApproved && (
            <p>
              <b>Grand Total:</b> ₹{grandTotal.toLocaleString()}
            </p>
          )}
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
