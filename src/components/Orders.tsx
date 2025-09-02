import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "./MainLayout";
import "../styles/Orders.css";

type OrderItem = {
  productId?: string;
  name: string;
  qty: number;
  price: number;
  image?: string;
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
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
};

// ✅ Use backend Railway URL instead of localhost
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://bafnatoys-backend-production.up.railway.app";

/** Toggle to show/hide grand totals everywhere */
const SHOW_TOTAL = false;

const resolveImage = (img?: string) => {
  if (!img) return "/placeholder-product.png";
  if (img.startsWith("http")) return img;
  return `${API_BASE}/${img.replace(/^\//, "")}`;
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

const toInners = (it: Pick<OrderItem, "qty" | "nosPerInner">) => {
  const perInner = it.nosPerInner && it.nosPerInner > 0 ? it.nosPerInner : 12;
  return Math.ceil((it.qty || 0) / perInner);
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">(
    "all"
  );

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
        const { data } = await axios.get<Order[]>(
          `${API_BASE}/api/orders`,
          { params: { customerId: user._id } }
        );

        setOrders(
          Array.isArray(data)
            ? data.sort(
                (a, b) =>
                  new Date(b.createdAt || 0).getTime() -
                  new Date(a.createdAt || 0).getTime()
              )
            : []
        );
      } catch (e: any) {
        setError(
          e.response?.status === 404
            ? "No orders found"
            : "Could not fetch orders. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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
    };

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
    ];

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
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <h3>Unable to load orders</h3>
            <p>{error}</p>
            <button
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>
            <p>
              {statusFilter === "all"
                ? "You haven't placed any orders yet."
                : `You don't have any ${statusFilter} orders.`}
            </p>
            <a href="/products" className="primary-button">
              Browse Products
            </a>
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
                <div
                  className="order-summary"
                  onClick={() => toggleOrder(order._id)}
                >
                  <div className="order-meta">
                    <div>
                      <h3>
                        Order #
                        {order.orderNumber ||
                          order._id.slice(-6).toUpperCase()}
                      </h3>
                      <p className="order-date">
                        Placed on {formatDate(order.createdAt)}
                        {order.estimatedDelivery && (
                          <span className="delivery-estimate">
                            • Estimated delivery:{" "}
                            {formatDate(order.estimatedDelivery)}
                          </span>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                {expandedOrder === order._id && (
                  <div className="order-details">
                    <OrderProgress status={order.status} />
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
