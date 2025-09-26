// src/components/Orders.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainLayout from "./MainLayout";
import "../styles/Orders.css";

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

type Order = {
  _id: string;
  orderNumber?: string;
  createdAt?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  items?: OrderItem[];
  total: number;
  paymentMethod?: string;
  estimatedDelivery?: string;
};

const SHOW_TOTAL = false;
const trimTrailingSlash = (s: string) => s.replace(/\/+$/, "");

const useBases = () => {
  return useMemo(() => {
    const rawApi = import.meta.env.VITE_API_URL as string | undefined;
    const rawImage =
      (import.meta.env.VITE_IMAGE_BASE_URL as string | undefined) ||
      (rawApi ? rawApi.replace(/\/api\/?$/, "") : undefined) ||
      (import.meta.env.VITE_MEDIA_URL as string | undefined);

    const apiBase = trimTrailingSlash(rawApi || "http://localhost:5000/api");
    const imageBase = trimTrailingSlash(rawImage || "http://localhost:5000");
    return { apiBase, imageBase };
  }, []);
};

const formatDate = (iso?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!iso) return "-";
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    };
    return new Date(iso).toLocaleDateString("en-US", defaultOptions);
  } catch {
    return iso!;
  }
};

// ✅ toInners function
const toInners = (it: OrderItem) => {
  if (it.inners && it.inners > 0) return it.inners;
  const perInner =
    it.innerQty && it.innerQty > 0
      ? it.innerQty
      : it.nosPerInner && it.nosPerInner > 0
      ? it.nosPerInner
      : 12;
  return Math.ceil((it.qty || 0) / perInner);
};

/* -------------------- Invoice Generator -------------------- */
const generateInvoice = (order: Order) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${order.orderNumber || order._id.slice(-6)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #333; }
        .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #e0e0e0; border-radius: 10px; padding: 30px; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 20px; margin-bottom: 30px; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .invoice-title { font-size: 24px; margin: 10px 0; color: #333; text-align: center; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; }
        .detail-section { flex: 1; min-width: 250px; margin-bottom: 15px; }
        .detail-section h3 { border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #2c5aa0; }
        .billto-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .billto-table td { padding: 4px 6px; vertical-align: top; }
        .billto-table td:first-child { width: 120px; font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .items-table th { background: #2c5aa0; color: white; padding: 10px; text-align: left; }
        .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .items-table tr:nth-child(even) { background: #f9f9f9; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .invoice-buttons { margin-top: 20px; text-align: center; }
        .print-btn, .download-btn { margin: 10px; padding: 10px 20px; border-radius: 4px; font-size: 16px; font-weight: bold; cursor: pointer; border: none; }
        .print-btn { background: #2c5aa0; color: white; }
        .download-btn { background: #28a745; color: white; }
        @media print {
          .invoice-buttons { display: none; }
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
            filename: 'Invoice-${order.orderNumber || order._id.slice(-6)}.pdf',
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
          <div><b>Bafna Toys Wholesaler</b></div>
          <div>1-12, Sundapalayam Rd, Coimbatore, Tamil Nadu 641007</div>
          <div>Phone: +91 9043347300 | Email: bafnatoysphotos@gmail.com</div>
        </div>
        <h1 class="invoice-title">TAX INVOICE</h1>
        <div class="invoice-details">
          <div class="detail-section">
            <h3>Bill To:</h3>
            <table class="billto-table">
              <tr><td>Shop Name</td><td>: ${user?.shopName || "-"}</td></tr>
              <tr><td>Mobile</td><td>: ${user?.otpMobile || "-"}</td></tr>
              <tr><td>WhatsApp</td><td>: ${user?.whatsapp || "-"}</td></tr>
            </table>
          </div>
          <div class="detail-section">
            <h3>Invoice Details:</h3>
            <div><strong>Invoice No:</strong> ${order.orderNumber || order._id.slice(-6)}</div>
            <div><strong>Date:</strong> ${currentDate}</div>
            <div><strong>Status:</strong> ${order.status}</div>
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
            ${order.items?.map(it => `
              <tr>
                <td>${it.name}</td>
                <td>${it.qty} pcs (${toInners(it)} inners)</td>
                <td>${it.price.toFixed(2)}</td>
                <td>${(it.qty * it.price).toFixed(2)}</td>
              </tr>`).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right; font-weight:bold; padding:10px; border-top:2px solid #2c5aa0;">
                Grand Total
              </td>
              <td style="font-weight:bold; font-size:16px; border-top:2px solid #2c5aa0; color:#2c5aa0;">
                ₹${order.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">
          <p>Thank you for shopping with BafnaToys!</p>
          <p>Terms & Conditions: Goods once sold will not be taken back. Subject to jurisdiction.</p>
          <p>This is a computer generated invoice.</p>
        </div>
      </div>
      <div class="invoice-buttons">
        <button class="print-btn" onclick="printInvoice()">🖨️ Print Invoice</button>
        <button class="download-btn" onclick="downloadAsPDF()">📄 Download as PDF</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
};

/* -------------------- Orders Component -------------------- */
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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw) {
          setError("Please login to view your orders.");
          setLoading(false);
          return;
        }
        const user = JSON.parse(raw);
        const url = `${apiBase}/orders`;
        const { data } = await axios.get<Order[]>(url, {
          params: { customerId: user._id },
        });
        setOrders(
          Array.isArray(data)
            ? data.sort(
                (a, b) =>
                  new Date(b.createdAt || 0).getTime() -
                  new Date(a.createdAt || 0).getTime()
              )
            : []
        );
      } catch {
        setError("Could not fetch orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [apiBase]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const StatusBadge = ({ status }: { status: Order["status"] }) => {
    const statusMap = {
      pending: { color: "#F59E0B", label: "Pending", icon: "⏳" },
      processing: { color: "#3B82F6", label: "Processing", icon: "🔄" },
      shipped: { color: "#8B5CF6", label: "Shipped", icon: "🚚" },
      delivered: { color: "#10B981", label: "Delivered", icon: "✅" },
      cancelled: { color: "#EF4444", label: "Cancelled", icon: "❌" },
    } as const;
    return (
      <div className="status-badge-container">
        <span
          className="status-badge"
          style={{
            backgroundColor: `${statusMap[status].color}10`,
            color: statusMap[status].color,
            border: `1px solid ${statusMap[status].color}`,
          }}
        >
          <span className="status-icon">{statusMap[status].icon}</span>
          {statusMap[status].label}
        </span>
      </div>
    );
  };

  const OrderProgress = ({ status }: { status: Order["status"] }) => {
    const steps = [
      { id: "pending", label: "Order Placed" },
      { id: "processing", label: "Processing" },
      { id: "shipped", label: "Shipped" },
      { id: "delivered", label: "Delivered" },
    ] as const;
    const currentIndex = steps.findIndex((step) => step.id === status);
    const cancelled = status === "cancelled";
    return (
      <div className={`order-progress ${cancelled ? "cancelled" : ""}`}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`progress-step ${
              index <= currentIndex ? "active" : ""
            } ${index === currentIndex ? "current" : ""}`}
          >
            <div className="step-indicator">
              {cancelled ? (
                <span>❌</span>
              ) : index < currentIndex ? (
                <span>✓</span>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="step-label">{step.label}</div>
            {index < steps.length - 1 && (
              <div
                className={`step-connector ${
                  index < currentIndex ? "active" : ""
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="orders-container">
        <div className="orders-header">
          <div className="header-content">
            <h1>Your Orders</h1>
            <p>View and manage your order history</p>
          </div>
          {orders.length > 0 && (
            <div className="orders-filter">
              <label htmlFor="status-filter">Filter by status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as Order["status"] | "all")
                }
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-state"><p>Loading your orders...</p></div>
        ) : error ? (
          <div className="error-state"><h3>Unable to load orders</h3><p>{error}</p></div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>
            <p>
              {statusFilter === "all"
                ? "You haven't placed any orders yet."
                : `You don't have any ${statusFilter} orders.`}
            </p>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className={`order-card ${
                  expandedOrder === order._id ? "expanded" : ""
                }`}
              >
                <div className="order-summary" onClick={() => toggleOrder(order._id)}>
                  <div className="order-meta">
                    <div>
                      <h3>Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}</h3>
                      <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="order-preview">
                    <div className="items-preview">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="item-preview">
                          <img src={resolveImage(item.image)} alt={item.name} />
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-totals">
                      <div className="order-total">
                        <span>Total Inners:</span>
                        <strong>{order.items?.reduce((sum, it) => sum + toInners(it), 0)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedOrder === order._id && (
                  <div className="order-details">
                    <OrderProgress status={order.status} />
                    <div className="details-grid">
                      <div className="items-list">
                        <h4>Order Items ({order.items?.length})</h4>
                        <div className="items-container">
                          {order.items?.map((item, i) => (
                            <div key={i} className="item-detail">
                              <div className="item-image">
                                <img src={resolveImage(item.image)} alt={item.name} />
                              </div>
                              <div className="item-info">
                                <h5>{item.name}</h5>
                                <div className="item-specs"><span>{toInners(item)} inners</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="order-summary-card">
                        <h4>Order Summary</h4>
                        <div className="summary-row"><span>Order Number</span><span>{order.orderNumber || order._id.slice(-6).toUpperCase()}</span></div>
                        <div className="summary-row"><span>Order Date</span><span>{formatDate(order.createdAt)}</span></div>
                        <div className="summary-row"><span>Payment Method</span><span>{order.paymentMethod || "Not specified"}</span></div>
                        <div className="summary-row">
                          <button className="invoice-btn" onClick={() => generateInvoice(order)}>📄 View Invoice</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Orders;
