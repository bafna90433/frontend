// src/components/Orders.tsx

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainLayout from "./MainLayout";
import "../styles/Orders.css";

// ================= TYPES =================
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

// Return Request Type
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

type Order = {
  _id: string;
  orderNumber?: string;
  createdAt?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  items?: OrderItem[];
  total: number;
  paymentMode?: string;
  estimatedDelivery?: string;
  
  // Tracking Fields
  trackingId?: string;
  courierName?: string;
  isShipped?: boolean;

  shippingAddress?: string | {
    fullName?: string;
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };

  // Return Request Field
  returnRequest?: ReturnRequest;
};

// ================= UTILITIES =================
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

const toPackets = (it: OrderItem) => {
  if (it.inners && it.inners > 0) return it.inners;
  const perInner =
    it.innerQty && it.innerQty > 0
      ? it.innerQty
      : it.nosPerInner && it.nosPerInner > 0
      ? it.nosPerInner
      : 12;
  return Math.ceil((it.qty || 0) / perInner);
};

// ================= INVOICE GENERATOR =================
const generateInvoice = (order: Order) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format shipping address properly
  let shippingAddressStr = "-";
  if (order.shippingAddress) {
    if (typeof order.shippingAddress === "string") {
      shippingAddressStr = order.shippingAddress;
    } else if (typeof order.shippingAddress === "object") {
      const addr = order.shippingAddress;
      shippingAddressStr = `${addr.fullName || ""}, ${addr.street || ""}, ${addr.area || ""}, ${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`;
    }
  }

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${order.orderNumber || order._id.slice(-6)}</title>
      <style>
        body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; color: #333; }
        .invoice-container { max-width: 850px; margin: 0 auto; background: #fff; padding: 35px; border-radius: 10px; border: 1px solid #ddd; }
        .header { text-align: center; margin-bottom: 25px; }
        .company-name { font-size: 24px; font-weight: 700; color: #2c5aa0; text-transform: uppercase; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background: #2c5aa0; color: #fff; padding: 10px; text-align: left; }
        .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .grand-total td { font-weight: 700; font-size: 15px; border-top: 2px solid #2c5aa0; padding-top: 10px; }
      </style>
      <script>
        function printInvoice() { window.print(); }
      </script>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-name">BafnaToys</div>
          <div>Pro Forma Invoice</div>
        </div>
        <p><strong>Order No:</strong> ${order.orderNumber || order._id}</p>
        <p><strong>Date:</strong> ${currentDate}</p>
        <p><strong>To:</strong> ${shippingAddressStr}</p>
        
        <table class="items-table">
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${order.items?.map(it => `
              <tr>
                <td>${it.name}</td>
                <td>${it.qty} pcs (${toPackets(it)} pkts)</td>
                <td>${it.price.toFixed(2)}</td>
                <td>${(it.qty * it.price).toFixed(2)}</td>
              </tr>`).join("")}
          </tbody>
          <tfoot>
            <tr class="grand-total">
              <td colspan="3" style="text-align:right;">Grand Total</td>
              <td>₹${order.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style="text-align:center; margin-top:20px;">
        <button onclick="printInvoice()" style="padding:10px 20px; background:#2c5aa0; color:white; border:none; cursor:pointer;">Print Invoice</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
};

/* -------------------- MAIN COMPONENT -------------------- */
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

  // ✅ STATES FOR RETURN MODAL
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("Damaged Product");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnImages, setReturnImages] = useState<FileList | null>(null);
  const [returnVideo, setReturnVideo] = useState<File | null>(null);
  const [uploadingReturn, setUploadingReturn] = useState(false);
  
  // ✅ NEW: Selected Items for Return
  const [returnSelectedItems, setReturnSelectedItems] = useState<string[]>([]);

  // ✅ UPLOAD FUNCTION (Fixed URL)
  const uploadFileToBackend = async (file: File) => {
    const formData = new FormData();
    formData.append("images", file);

    try {
      const token = localStorage.getItem("token");
      const uploadUrl = `${apiBase}/upload`; 

      const response = await axios.post(uploadUrl, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        }
      });

      if (response.data && response.data.urls && response.data.urls.length > 0) {
        return response.data.urls[0]; 
      }
      return null;
    } catch (error) {
      console.error("Backend Upload Error:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          setError("Please login to view your orders.");
          setLoading(false);
          return;
        }
        
        const user = JSON.parse(userStr);
        const token = localStorage.getItem("token");
        
        if (!user?._id) {
          setError("Invalid user data. Please login again.");
          setLoading(false);
          return;
        }

        const url = `${apiBase}/orders`;
        const response = await axios.get(url, {
          params: { customerId: user._id },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (response.data && Array.isArray(response.data)) {
          const sortedOrders = response.data.sort(
            (a: Order, b: Order) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );
          setOrders(sortedOrders);
        } else {
          setOrders([]);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError("Your session has expired. Please login again.");
        } else if (err.response?.status === 404) {
          setOrders([]);
        } else {
          setError("Could not fetch orders. Please try again later.");
        }
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

  const getTrackingUrl = (order: Order) => {
    if (!order.trackingId) return "#";
    const courier = (order.courierName || "").toLowerCase();
    
    if (courier.includes("ithink") || courier.includes("delhivery")) {
      return `https://www.ithinklogistics.co.in/postship/tracking/${order.trackingId}`;
    }
    
    return `https://www.google.com/search?q=${order.trackingId}+tracking`;
  };

  // ✅ CANCEL ORDER FUNCTION
  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
        const token = localStorage.getItem("token");
        await axios.put(
            `${apiBase}/orders/${orderId}/status`, 
            { 
              status: "cancelled",
              cancelledBy: "Customer" 
            }, 
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "cancelled" } : o));
        alert("Order cancelled successfully.");
    } catch (error) {
        console.error("Cancel Error:", error);
        alert("Failed to cancel order. Please try again.");
    }
  };

  // ✅ HANDLE OPEN RETURN MODAL
  const handleOpenReturn = (orderId: string) => {
    setSelectedOrderId(orderId);
    setReturnSelectedItems([]); // Reset selection
    setShowReturnModal(true);
    setReturnReason("Damaged Product");
    setReturnDescription("");
    setReturnImages(null);
    setReturnVideo(null);
  };

  // ✅ HANDLE ITEM CHECKBOX
  const handleItemSelect = (itemName: string) => {
    setReturnSelectedItems(prev => {
        if (prev.includes(itemName)) {
            return prev.filter(i => i !== itemName);
        } else {
            return [...prev, itemName];
        }
    });
  };

  // ✅ HANDLE SUBMIT RETURN
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    // 🔴 Validation: Check if items are selected
    if (returnSelectedItems.length === 0) {
        alert("Please select at least one product to return.");
        return;
    }

    setUploadingReturn(true);

    try {
      // 1. Upload Images
      let uploadedImageUrls: string[] = [];
      if (returnImages && returnImages.length > 0) {
        for (let i = 0; i < returnImages.length; i++) {
          const url = await uploadFileToBackend(returnImages[i]);
          if (url) uploadedImageUrls.push(url);
        }
      }

      // 2. Upload Video
      let uploadedVideoUrl = "";
      if (returnVideo) {
        const vidUrl = await uploadFileToBackend(returnVideo);
        if (vidUrl) uploadedVideoUrl = vidUrl;
      }
      
      if (returnImages && returnImages.length > 0 && uploadedImageUrls.length === 0) {
          alert("Image upload failed. Please check connection.");
          setUploadingReturn(false);
          return;
      }

      // ✅ PREPARE DESCRIPTION WITH SELECTED ITEMS
      const formattedDescription = `[RETURN ITEMS: ${returnSelectedItems.join(", ")}] \n\nUser Note: ${returnDescription}`;

      // 3. Send to Backend
      const token = localStorage.getItem("token");
      await axios.put(
        `${apiBase}/orders/return/${selectedOrderId}`,
        {
          reason: returnReason,
          description: formattedDescription, // Sent combined info
          images: uploadedImageUrls,
          video: uploadedVideoUrl
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      alert("Return request submitted successfully!");
      setShowReturnModal(false);
      window.location.reload(); 

    } catch (error) {
      console.error("Return Error", error);
      alert("Failed to submit return request.");
    } finally {
      setUploadingReturn(false);
    }
  };

  const StatusBadge = ({ status, returnReq }: { status: Order["status"], returnReq?: ReturnRequest }) => {
    if (returnReq?.isRequested) {
        let color = "#F59E0B"; 
        let label = "Return Pending";
        let icon = "⏳";

        if (returnReq.status === 'Approved') { color = "#10B981"; label = "Return Approved"; icon = "✅"; }
        if (returnReq.status === 'Rejected') { color = "#EF4444"; label = "Return Rejected"; icon = "❌"; }

        return (
            <div className="status-badge-container">
            <span className="status-badge" style={{ backgroundColor: `${color}10`, color: color, border: `1px solid ${color}` }}>
              <span className="status-icon">{icon}</span> {label}
            </span>
          </div>
        )
    }

    const statusMap = {
      pending: { color: "#F59E0B", label: "Pending", icon: "⏳" },
      processing: { color: "#3B82F6", label: "Processing", icon: "🔄" },
      shipped: { color: "#8B5CF6", label: "Shipped", icon: "🚚" },
      delivered: { color: "#10B981", label: "Delivered", icon: "✅" },
      cancelled: { color: "#EF4444", label: "Cancelled", icon: "❌" },
      returned: { color: "#6366f1", label: "Returned", icon: "🔙" },
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
    const returned = status === "returned";

    return (
      <div className={`order-progress ${cancelled ? "cancelled" : ""} ${returned ? "returned" : ""}`}>
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
              ) : returned && index === 3 ? (
                 <span>🔙</span>
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

  // Helper to get items of selected order for modal
  const getSelectedOrderItems = () => {
      const order = orders.find(o => o._id === selectedOrderId);
      return order ? order.items : [];
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
                <option value="returned">Returned</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-state"><p>Loading your orders...</p></div>
        ) : error ? (
          <div className="error-state">
            <h3>Unable to load orders</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>
            <button onClick={() => window.location.href = "/"}>Start Shopping</button>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className={`order-card ${expandedOrder === order._id ? "expanded" : ""}`}
              >
                <div className="order-summary" onClick={() => toggleOrder(order._id)}>
                  <div className="order-meta">
                    <div>
                      <h3>Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}</h3>
                      <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <StatusBadge status={order.status} returnReq={order.returnRequest} />
                  </div>
                  <div className="order-preview">
                    <div className="items-preview">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="item-preview">
                          <img 
                            src={resolveImage(item.image)} 
                            alt={item.name} 
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-product.png"; }}
                          />
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-totals">
                      <div className="order-total">
                        <span>Total:</span>
                        <strong>₹{order.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedOrder === order._id && (
                  <div className="order-details">
                    <OrderProgress status={order.status} />
                    
                    {order.status === "shipped" && order.trackingId && (
                      <div className="tracking-section" style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd', margin: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                           <h4 style={{ margin: '0 0 5px 0', color: '#0369a1' }}>🚚 Shipment On The Way!</h4>
                           <p style={{ margin: 0 }}>Courier: {order.courierName || "Express"} | Tracking: {order.trackingId}</p>
                        </div>
                        <a href={getTrackingUrl(order)} target="_blank" rel="noopener noreferrer" className="track-btn" style={{ background: '#0284c7', color: 'white', padding: '8px 15px', borderRadius: '5px', textDecoration: 'none' }}>Track</a>
                      </div>
                    )}

                    {/* ✅ CANCEL BUTTON (Only if Pending) */}
                    {order.status === 'pending' && (
                       <div style={{ marginTop: '20px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleCancelOrder(order._id)}
                            style={{ backgroundColor: '#fff', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                             ❌ Cancel Order
                          </button>
                       </div>
                    )}

                    {order.status === 'delivered' && !order.returnRequest?.isRequested && (
                       <div className="return-section" style={{ marginTop: '20px', padding: '15px', background: '#fff1f2', border: '1px solid #fda4af', borderRadius: '8px' }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#be123c' }}>Need to Return?</h4>
                          <p style={{ fontSize: '14px', marginBottom: '10px' }}>Returns are only accepted for Damaged or Wrong products. You must provide image/video proof.</p>
                          <button 
                            onClick={() => handleOpenReturn(order._id)}
                            style={{ backgroundColor: '#e11d48', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                             Request Return
                          </button>
                       </div>
                    )}

                    {order.returnRequest?.isRequested && (
                        <div style={{ marginTop: '20px', padding: '15px', background: '#f3f4f6', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                            <h4 style={{ margin: '0 0 5px 0' }}>Return Request Details</h4>
                            <p><strong>Status:</strong> {order.returnRequest.status}</p>
                            <p><strong>Reason:</strong> {order.returnRequest.reason}</p>
                            {order.returnRequest.adminComment && (
                                <p style={{ color: 'red' }}><strong>Admin Comment:</strong> {order.returnRequest.adminComment}</p>
                            )}
                        </div>
                    )}

                    <div className="details-grid">
                      <div className="items-list">
                         <h4>Order Items</h4>
                         <div className="items-container">
                          {order.items?.map((item, i) => (
                            <div key={i} className="item-detail">
                              <div className="item-image">
                                <img src={resolveImage(item.image)} alt={item.name} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-product.png"; }} />
                              </div>
                              <div className="item-info">
                                <h5>{item.name}</h5>
                                <div className="item-specs"><span>{item.qty} pcs ({toPackets(item)} pkts)</span></div>
                                <div className="item-price">₹{item.price.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="order-summary-card">
                         <h4>Order Summary</h4>
                         <div className="summary-row"><span>Order No</span><span>{order.orderNumber}</span></div>
                         <div className="summary-row"><span>Total</span><span>₹{order.total}</span></div>
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

        {/* ✅ RETURN REQUEST MODAL WITH PRODUCT SELECTION */}
        {showReturnModal && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div className="modal-content" style={{ background: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h2 style={{ marginTop: 0, color: '#2c5aa0' }}>Request Return</h2>
                    <form onSubmit={handleSubmitReturn}>
                        
                        {/* SELECT PRODUCTS SECTION */}
                        <div style={{ marginBottom: '15px', border:'1px solid #eee', padding:'10px', borderRadius:'5px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color:'#333' }}>
                                Select Product(s) to Return *
                            </label>
                            <div style={{ maxHeight:'150px', overflowY:'auto' }}>
                                {getSelectedOrderItems()?.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingBottom:'8px', borderBottom:'1px solid #f9f9f9' }}>
                                        <input 
                                            type="checkbox" 
                                            id={`item-${index}`}
                                            checked={returnSelectedItems.includes(item.name)}
                                            onChange={() => handleItemSelect(item.name)}
                                            style={{ width:'18px', height:'18px', cursor:'pointer' }}
                                        />
                                        <img src={resolveImage(item.image)} alt="" style={{width:'35px', height:'35px', objectFit:'cover', borderRadius:'4px'}} />
                                        <label htmlFor={`item-${index}`} style={{ fontSize:'13px', cursor:'pointer', flex:1 }}>
                                            {item.name} <br/> 
                                            <span style={{color:'#666', fontSize:'11px'}}>Qty: {item.qty}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {returnSelectedItems.length === 0 && (
                                <p style={{color:'red', fontSize:'11px', margin:'5px 0 0'}}>Please select at least one item.</p>
                            )}
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reason</label>
                            <select 
                                value={returnReason} 
                                onChange={(e) => setReturnReason(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="Damaged Product">Damaged Product</option>
                                <option value="Wrong Product">Wrong Product</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description / Note</label>
                            <textarea 
                                value={returnDescription} 
                                onChange={(e) => setReturnDescription(e.target.value)}
                                placeholder="Describe the damage or issue..."
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '80px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Upload Images (Proof)</label>
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={(e) => setReturnImages(e.target.files)}
                                required
                                style={{ width: '100%' }}
                            />
                            <small style={{color:'#666'}}>Max 3 images recommended</small>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Upload Video (Optional)</label>
                            <input 
                                type="file" 
                                accept="video/*" 
                                onChange={(e) => setReturnVideo(e.target.files ? e.target.files[0] : null)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                type="button" 
                                onClick={() => setShowReturnModal(false)}
                                style={{ padding: '10px 20px', borderRadius: '5px', border: '1px solid #ccc', background: '#f3f4f6', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={uploadingReturn}
                                style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: uploadingReturn ? '#ccc' : '#2c5aa0', color: 'white', cursor: 'pointer', opacity: uploadingReturn ? 0.7 : 1 }}
                            >
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