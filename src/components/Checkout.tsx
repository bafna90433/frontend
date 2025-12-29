import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import api, { MEDIA_URL } from "../utils/api";
import "../styles/Checkout.css";
import { Trash2, Plus, Minus, FileText, MapPin, User as UserIcon, CreditCard, Package, AlertCircle } from "lucide-react";

// --- Types ---
interface Item {
  _id: string;
  name: string;
  quantity?: number;
  innerQty?: number;
  piecesPerInner?: number;
  image?: string;
  images?: string[];
  price?: number;
  sku?: string;
  stock?: number;
}

interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  street: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  type: string;
  isDefault?: boolean;
}

interface OrderData {
  orderNumber: string;
  items: any[];
  total: number;
  date: string;
  paymentMode?: string;
  paymentId?: string;
  shippingAddress?: any;
  advancePaid?: number; // Added for UI display
}

// --- Helper function for minimum quantity ---
const getMinimumQuantity = (price: number): number => {
  return price < 60 ? 3 : 2;
};

// Helper to get item values including minimum quantity
const getItemValues = (item: Item) => {
  const innerCount = item.quantity || 0;
  const unitPrice = item.price || 0;
  const minQty = getMinimumQuantity(unitPrice);
  const totalPrice = innerCount * unitPrice * (item.piecesPerInner || item.innerQty || 1);

  return { 
    innerCount, 
    unitPrice, 
    totalPrice,
    minQty 
  };
};

// --- Improved Razorpay Script Loader (Prevents duplicate injection) ---
const loadRazorpay = () => {
  return new Promise((resolve) => {
    // Check if already loaded
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// --- YOUR EXACT DESIGN Invoice Generator with Logo ---
const generateInvoicePDF = (orderData: OrderData, user: any): boolean => {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) { 
    alert("Popup blocked! Please allow popups to generate invoice."); 
    return false; 
  }
  
  // Get formatted date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-IN", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  // Extract address details
  const addr = orderData.shippingAddress;
  const shopName = user?.shopName || addr?.fullName || "Customer";
  const mobile = addr?.phone || user?.otpMobile || "N/A";
  const whatsapp = mobile;
  
  // Parse address components
  let shipToAddress = "";
  if (addr) {
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.area) parts.push(addr.area);
    if (addr.city || addr.state) {
      const cityState = [addr.city, addr.state].filter(Boolean).join(", ");
      if (cityState) parts.push(cityState);
    }
    if (addr.pincode) parts.push(`PIN: ${addr.pincode}`);
    shipToAddress = parts.join(", ");
  }
  
  // Logo URL
  const logoUrl = "https://res.cloudinary.com/dpdecxqb9/image/upload/v1758783697/bafnatoys/lwccljc9kkosfv9wnnrq.png";
  
  // Prepare items for display with inner/pcs details
  const invoiceItems = orderData.items.map(item => {
    const totalPieces = item.qty || 0;
    const inners = item.inners || Math.floor(totalPieces / (item.innerQty || 1));
    const piecesPerInner = item.innerQty || 1;
    
    return {
      name: item.name,
      quantity: `${totalPieces} pcs (${inners} inner${inners !== 1 ? 's' : ''})`,
      rate: `₹${(item.price || 0).toFixed(2)}`,
      amount: `₹${((item.price || 0) * totalPieces).toFixed(2)}`
    };
  });

  // Calculate Balance logic for Invoice
  const totalAmount = orderData.total;
  const advancePaid = orderData.advancePaid || 0;
  const balanceAmount = Math.max(totalAmount - advancePaid, 0);
  
  const invoiceContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Invoice - ${orderData.orderNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      body { padding: 30px; color: #333; background: #f8f9fa; }
      .invoice-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; }
      /* Header with Logo */
      .invoice-header { background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 25px 35px; text-align: center; position: relative; }
      .logo-container { margin-bottom: 15px; }
      .company-logo { height: 60px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
      .company-name { font-size: 28px; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px; }
      .company-address { font-size: 15px; opacity: 0.9; line-height: 1.5; margin-bottom: 5px; }
      .company-contact { font-size: 14.5px; opacity: 0.85; margin-top: 8px; }
      .invoice-title { text-align: center; padding: 25px 35px 20px; border-bottom: 2px dashed #e5e7eb; }
      .invoice-title h1 { color: #1e293b; font-size: 24px; font-weight: 700; margin-bottom: 5px; }
      .invoice-title .subtitle { color: #64748b; font-size: 15px; }
      /* Invoice Info Grid */
      .invoice-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 25px 35px; border-bottom: 2px dashed #e5e7eb; }
      .info-section h3 { color: #2c5aa0; font-size: 16px; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
      .info-table { width: 100%; border-collapse: collapse; }
      .info-table tr { border-bottom: 1px solid #f1f5f9; }
      .info-table td { padding: 8px 0; vertical-align: top; font-size: 14.5px; }
      .info-table td:first-child { color: #64748b; font-weight: 500; width: 40%; }
      .info-table td:last-child { color: #1e293b; font-weight: 600; }
      /* Products Table */
      .products-section { padding: 25px 35px; border-bottom: 2px dashed #e5e7eb; }
      .products-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
      .products-table thead { background: #f8fafc; border-bottom: 2px solid #e5e7eb; }
      .products-table th { padding: 14px 12px; text-align: left; font-weight: 700; color: #334155; font-size: 14.5px; }
      .products-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
      .product-name { font-weight: 600; color: #1e293b; font-size: 14.5px; }
      /* Total Section */
      .total-section { padding: 25px 35px; background: #f8fafc; border-top: 2px dashed #e5e7eb; }
      .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .total-label { font-size: 16px; color: #64748b; font-weight: 600; }
      .total-amount { font-size: 18px; color: #1e293b; font-weight: 700; }
      .grand-total-row { margin-top: 15px; border-top: 2px solid #e2e8f0; padding-top: 15px; }
      .grand-total-row .total-amount { font-size: 24px; color: #2c5aa0; font-weight: 800; }
      
      /* Footer */
      .invoice-footer { padding: 25px 35px; text-align: center; background: #f1f5f9; color: #64748b; font-size: 14px; line-height: 1.6; }
      .thank-you { margin-bottom: 15px; font-weight: 600; color: #2c5aa0; font-size: 15px; }
      /* Controls */
      .print-controls { display: flex; justify-content: center; gap: 15px; margin-top: 25px; padding: 20px; }
      .print-btn { padding: 12px 30px; background: #2c5aa0; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px; }
      .print-btn:hover { background: #1d3d6f; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(44, 90, 160, 0.3); }
      .close-btn { padding: 12px 30px; background: #64748b; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.3s ease; }
      .close-btn:hover { background: #475569; }
      /* Status Badges */
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      .status-paid { background: #d1fae5; color: #065f46; }
      .status-pending { background: #fef3c7; color: #92400e; }
      @media print { .print-controls { display: none; } body { padding: 0; background: white; } .invoice-container { box-shadow: none; border-radius: 0; } }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="logo-container">
          <img src="${logoUrl}" alt="Bafna Toys" class="company-logo" />
        </div>
        <div class="company-name"></div>
        <div class="company-address">
          1-12, Sundapalayam Rd, Coimbatore, Tamil Nadu 641007
        </div>
        <div class="company-contact">
          Phone: +91 9043347300 | Email: bafnatoysphotos@gmail.com
        </div>
      </div>
      
      <div class="invoice-title">
        <h1>PRO FORMA INVOICE</h1>
        <div class="subtitle">Order #${orderData.orderNumber}</div>
      </div>
      
      <div class="invoice-info-grid">
        <div class="info-section">
          <h3>Bill To</h3>
          <table class="info-table">
            <tr><td>Shop Name</td><td>: ${shopName}</td></tr>
            <tr><td>Mobile</td><td>: ${mobile}</td></tr>
            <tr><td>WhatsApp</td><td>: ${whatsapp}</td></tr>
          </table>
        </div>
        <div class="info-section">
          <h3>Ship To</h3>
          <table class="info-table">
            <tr><td>Address</td><td>: ${shipToAddress || "Address not provided"}</td></tr>
            <tr><td>Phone</td><td>: ${mobile}</td></tr>
          </table>
        </div>
      </div>
      
      <div class="invoice-info-grid">
        <div class="info-section">
          <h3>Invoice Details</h3>
          <table class="info-table">
            <tr><td>Invoice No</td><td>: ${orderData.orderNumber}</td></tr>
            <tr><td>Date</td><td>: ${formattedDate}</td></tr>
            <tr>
              <td>Status</td>
              <td>: <span class="status-badge ${orderData.paymentMode === "COD" ? "status-pending" : "status-paid"}">
                ${orderData.paymentMode === "COD" ? "Pending (COD)" : "Paid"}
              </span></td>
            </tr>
            <tr><td>Payment Mode</td><td>: ${orderData.paymentMode === "COD" ? "Cash on Delivery" : "Online Payment"}</td></tr>
            ${orderData.paymentId ? `<tr><td>Transaction ID</td><td>: ${orderData.paymentId}</td></tr>` : ''}
          </table>
        </div>
      </div>
      
      <div class="products-section">
        <h3 style="color: #2c5aa0; font-size: 16px; font-weight: 700; margin-bottom: 20px;">Product Details</h3>
        <table class="products-table">
          <thead>
            <tr>
              <th style="width: 50%;">Product</th>
              <th style="width: 20%;">Quantity</th>
              <th style="width: 15%;">Rate (₹)</th>
              <th style="width: 15%;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceItems.map(item => `
            <tr>
              <td class="product-name">${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.rate}</td>
              <td>${item.amount}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="total-section">
        <div class="total-row">
           <div class="total-label">Subtotal</div>
           <div class="total-amount">₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        
        ${advancePaid > 0 ? `
        <div class="total-row" style="color: #059669;">
           <div class="total-label">Advance Paid</div>
           <div class="total-amount">- ₹${advancePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        ` : ''}

        <div class="total-row grand-total-row">
          <div class="total-label">${advancePaid > 0 && orderData.paymentMode === 'COD' ? 'Balance to Pay' : 'Grand Total'}</div>
          <div class="total-amount">₹${balanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
      
      <div class="invoice-footer">
        <div class="thank-you">Thank you for choosing BafnaToys!</div>
        <div>We appreciate your business and look forward to serving you again.</div>
      </div>
    </div>
    
    <div class="print-controls">
      <button class="print-btn" onclick="window.print()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>
        Print Invoice
      </button>
      <button class="close-btn" onclick="window.close()">Close</button>
    </div>
  </body>
  </html>`;
  
  printWindow.document.write(invoiceContent);
  printWindow.document.close();
  return true;
};

const getItemTotalPrice = (item: Item) => (item.quantity || 0) * (item.piecesPerInner || item.innerQty || 1) * (item.price || 0);

const Checkout: React.FC = () => {
  const { cartItems, setCartItemQuantity, clearCart, removeFromCart } = useShop();
  const navigate = useNavigate();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMode, setPaymentMode] = useState<"ONLINE" | "COD">("ONLINE");
  
  // New State for COD Advance
  const [codAdvance, setCodAdvance] = useState<number>(0);

  const IMAGE_BASE_URL = `${MEDIA_URL}/uploads/`;
  const [user, setUser] = useState<any>(null);
  const [minimumQtyError, setMinimumQtyError] = useState<string | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) { 
      navigate("/login"); 
      return; 
    }
    
    const userData = JSON.parse(userString);
    setUser(userData);

    // Check if COD is allowed for this user (based on isApproved)
    if (!userData.isApproved) {
      setPaymentMode("COD");
    }

    const selectedStr = localStorage.getItem("temp_checkout_address");
    if (selectedStr) {
      setSelectedAddress(JSON.parse(selectedStr));
    } else {
      fetchDefaultAddress();
    }

    // Fetch COD Advance Settings
    fetchCodSettings();

  }, []);

  const fetchCodSettings = async () => {
    try {
      const { data } = await api.get("/settings/cod");
      if (data && data.advanceAmount) {
        setCodAdvance(Number(data.advanceAmount));
      }
    } catch (error) {
      console.error("Failed to fetch COD settings", error);
    }
  };

  // Check for minimum quantity validation
  useEffect(() => {
    const invalidItems = cartItems.filter(item => {
      const { innerCount, minQty } = getItemValues(item);
      return innerCount < minQty;
    });

    if (invalidItems.length > 0) {
      const itemNames = invalidItems.map(item => item.name).join(", ");
      setMinimumQtyError(`Minimum quantity not met for: ${itemNames}. Please update quantities in cart.`);
    } else {
      setMinimumQtyError(null);
    }
  }, [cartItems]);

  const fetchDefaultAddress = async () => {
    try {
      const { data } = await api.get("/addresses");
      if (data && data.length > 0) {
        const def = data.find((a: Address) => a.isDefault) || data[0];
        setSelectedAddress(def);
      }
    } catch (e) { 
      console.error("Failed to fetch default address"); 
    }
  };

  // Quantity control handlers - BLOCK at minimum quantity
  const handleDecrease = (item: Item) => {
    const currentQty = item.quantity || 0;
    const { minQty } = getItemValues(item);
    
    // If at or below minimum quantity, block further decrease
    if (currentQty <= minQty) {
      return; // Do nothing - button should be disabled
    }
    
    // Decrease by 1
    setCartItemQuantity(item, currentQty - 1);
  };

  const handleIncrease = (item: Item) => {
    const currentQty = item.quantity || 0;
    setCartItemQuantity(item, currentQty + 1);
  };

  const handleChooseAddress = () => navigate("/addresses?select=true");

  const handlePlaceOrder = async () => {
    // Check if all items meet minimum quantity
    const invalidItems = cartItems.filter(item => {
      const { innerCount, minQty } = getItemValues(item);
      return innerCount < minQty;
    });

    if (invalidItems.length > 0) {
      alert("Some items do not meet the minimum quantity requirement. Please update your cart.");
      navigate("/cart");
      return;
    }

    if (!user || !selectedAddress || !cartItems.length) {
      alert("Please ensure items are in cart and address is selected.");
      return;
    }

    const total = cartItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
    
    // Logic: If COD Advance > Total, treat it as full prepaid (cap it)
    const applicableAdvance = paymentMode === "COD" ? Math.min(codAdvance, total) : 0;
    const isCodDirect = paymentMode === "COD" && applicableAdvance <= 0;

    // --- Scenario 1: PURE COD (No Advance Required) ---
    if (isCodDirect) {
      try {
        setPlacing(true);
        
        const items = cartItems.map((item: any) => ({
          productId: item._id,
          name: item.name,
          qty: (item.quantity || 0) * (item.piecesPerInner || item.innerQty || 1),
          innerQty: item.piecesPerInner || item.innerQty || 1,
          inners: item.quantity || 0,
          price: item.price || 0,
          image: item.image || "",
        }));

        const { data } = await api.post("/orders", {
          customerId: user._id,
          items,
          total,
          shippingAddress: selectedAddress,
          paymentMode: "COD",
          paymentId: null,
          advancePaid: 0
        });

        const orderNum = data.order?.orderNumber || data.orderNumber;
        setOrderNumber(orderNum);
        setOrderDetails({
          orderNumber: orderNum,
          items,
          total,
          date: new Date().toISOString(),
          paymentMode: "COD",
          shippingAddress: selectedAddress,
          advancePaid: 0
        });

        setOrderPlaced(true);
        clearCart();
        localStorage.removeItem("temp_checkout_address");
        setPlacing(false);
      } catch (err: any) {
        console.error(err);
        alert("Failed to place COD order. Please try again.");
        setPlacing(false);
      }
      return;
    }

    // --- Scenario 2: Razorpay (Online OR COD Advance) ---
    try {
      setPlacing(true);

      // Determine actual amount to pay online right now
      // If ONLINE mode: pay full total
      // If COD mode (with advance): pay only the advance amount
      const payAmount = paymentMode === "ONLINE" ? total : applicableAdvance;

      // 1. Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
        alert("Payment gateway failed to load. Check your internet connection.");
        setPlacing(false);
        return;
      }

      // 2. Create Razorpay order on Backend
      const { data: razorOrder } = await api.post("/payments/create-order", {
        amount: payAmount, 
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: razorOrder.amount,
        currency: "INR",
        name: "Bafna Toys",
        description: paymentMode === "COD" 
          ? `Advance Payment for COD Order` 
          : `Order #${Date.now()}`,
        order_id: razorOrder.id,

        handler: async function (response: any) {
          try {
            // 3. Verify payment on Backend
            const verifyRes = await api.post("/payments/verify", response);

            if (verifyRes.data?.success !== true) {
              alert("Payment verification failed. Please contact support.");
              setPlacing(false);
              return;
            }

            // 4. Place order in database AFTER payment verification
            const items = cartItems.map((item: any) => ({
              productId: item._id,
              name: item.name,
              qty: (item.quantity || 0) * (item.piecesPerInner || item.innerQty || 1),
              innerQty: item.piecesPerInner || item.innerQty || 1,
              inners: item.quantity || 0,
              price: item.price || 0,
              image: item.image || "",
            }));

            // Prepare payload
            // For COD + Advance: we still call it COD mode, but pass advancePaid & paymentId
            const finalPaymentMode = paymentMode; 

            const { data } = await api.post("/orders", {
              customerId: user._id,
              items,
              total, // The order total is still the FULL amount
              shippingAddress: selectedAddress,
              paymentMode: finalPaymentMode,
              paymentId: response.razorpay_payment_id,
              advancePaid: paymentMode === "COD" ? applicableAdvance : 0
            });

            // Finalize state
            const orderNum = data.order?.orderNumber || data.orderNumber;
            setOrderNumber(orderNum);
            setOrderDetails({
              orderNumber: orderNum,
              items,
              total,
              date: new Date().toISOString(),
              paymentMode: finalPaymentMode,
              paymentId: response.razorpay_payment_id,
              shippingAddress: selectedAddress,
              advancePaid: paymentMode === "COD" ? applicableAdvance : 0
            });

            setOrderPlaced(true);
            clearCart();
            localStorage.removeItem("temp_checkout_address");
          } catch (err) {
            console.error(err);
            alert("Order creation failed after payment. Please contact support.");
          } finally {
            setPlacing(false);
          }
        },

        prefill: {
          name: selectedAddress.fullName,
          contact: selectedAddress.phone,
          email: user.email || ""
        },

        theme: { color: "#2c5aa0" },
        
        modal: {
          ondismiss: function() {
            alert("Payment cancelled by user");
            setPlacing(false);
          },
          escape: false
        },
        
        notes: {
          orderType: paymentMode === "COD" ? "COD with Advance" : "Prepaid Order"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to initiate payment. Please try again.");
      setPlacing(false);
    }
  };

  if (orderPlaced) {
    // Calculate values for success screen
    const isCod = orderDetails?.paymentMode === "COD";
    const advPaid = orderDetails?.advancePaid || 0;
    const totalAmt = orderDetails?.total || 0;
    const balance = Math.max(totalAmt - advPaid, 0);

    return (
      <div className="checkout-success-container">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Order Placed Successfully!</h2>
          <p className="order-number">Order #: <strong>{orderNumber}</strong></p>
          
          <div className="success-payment-summary" style={{margin: '20px 0', padding: '15px', background: '#f8fafc', borderRadius: '8px'}}>
             <p className="order-mode">
              Payment Mode: <strong>{isCod ? "Cash on Delivery" : "Online Payment"}</strong>
            </p>
            
            {isCod && advPaid > 0 && (
              <>
                <p style={{color: '#059669', marginTop: '5px'}}>
                  Advance Paid: <strong>₹{advPaid.toLocaleString()}</strong>
                </p>
                <p style={{color: '#d97706', marginTop: '5px', fontSize: '1.1em'}}>
                  Balance to Pay on Delivery: <strong>₹{balance.toLocaleString()}</strong>
                </p>
              </>
            )}

            {orderDetails?.paymentId && (
              <p className="transaction-id" style={{marginTop: '10px', fontSize: '0.9em', color: '#64748b'}}>
                Transaction ID: <code>{orderDetails.paymentId}</code>
              </p>
            )}
          </div>

          <div className="invoice-buttons" style={{ marginTop: '20px' }}>
            <button onClick={() => generateInvoicePDF(orderDetails!, user)} className="invoice-btn primary">
              <FileText size={18} /> View & Print Invoice
            </button>
            <button onClick={() => navigate("/orders")} className="invoice-btn secondary">
              View All Orders
            </button>
            <button onClick={() => navigate("/products")} className="invoice-btn outline">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = user?.isApproved === true;
  const grandTotal = cartItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
  const canUseOnline = isApproved;

  // Calculate Advance Logic for Render
  const applicableAdvance = Math.min(codAdvance, grandTotal);
  const showCodAdvance = paymentMode === "COD" && applicableAdvance > 0;
  const payOnDeliveryAmount = Math.max(grandTotal - applicableAdvance, 0);

  // Calculate total pieces and check if all items meet minimum quantity
  const allItemsMeetMinQty = cartItems.every(item => {
    const { innerCount, minQty } = getItemValues(item);
    return innerCount >= minQty;
  });

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p className="checkout-steps">Complete your purchase</p>
      </div>

      {/* Minimum Quantity Warning Banner */}
      {minimumQtyError && (
        <div className="minimum-qty-banner">
          <AlertCircle size={20} />
          <div className="warning-content">
            <strong>Minimum Quantity Alert</strong>
            <p>{minimumQtyError}</p>
          </div>
          <button 
            className="go-to-cart-btn"
            onClick={() => navigate("/cart")}
          >
            Update Cart
          </button>
        </div>
      )}

      <div className="checkout-grid">
        <div className="checkout-left">
          {/* Payment Mode Selection */}
          <div className="checkout-section payment-mode-card">
            <div className="section-header">
              <h2>📦 Select Payment Method</h2>
            </div>
            <div className="payment-options">
              <div 
                className={`payment-option ${paymentMode === "COD" ? "selected" : ""} ${!canUseOnline ? "forced" : ""}`}
                onClick={() => setPaymentMode("COD")}
              >
                <div className="payment-icon">
                  <Package size={24} />
                </div>
                <div className="payment-info">
                  <h3>Cash on Delivery</h3>
                  
                  {/* Dynamic description based on Advance setting */}
                  {codAdvance > 0 && applicableAdvance > 0 ? (
                    <p style={{color: '#d97706', fontWeight: 500}}>
                      Pay ₹{applicableAdvance} advance to confirm
                    </p>
                  ) : (
                    <p>Pay when you receive your order</p>
                  )}

                  {!canUseOnline && (
                    <span className="payment-note">(Your account is pending approval for online payments)</span>
                  )}
                </div>
                <div className="payment-radio">
                  <div className={`radio-circle ${paymentMode === "COD" ? "active" : ""}`} />
                </div>
              </div>
              
              <div 
                className={`payment-option ${paymentMode === "ONLINE" ? "selected" : ""} ${!canUseOnline ? "disabled" : ""}`}
                onClick={() => canUseOnline && setPaymentMode("ONLINE")}
              >
                <div className="payment-icon">
                  <CreditCard size={24} />
                </div>
                <div className="payment-info">
                  <h3>Online Payment</h3>
                  <p>Pay securely with Razorpay</p>
                  {!canUseOnline && (
                    <span className="payment-note">(Available after account approval)</span>
                  )}
                </div>
                <div className="payment-radio">
                  <div className={`radio-circle ${paymentMode === "ONLINE" ? "active" : ""} ${!canUseOnline ? "disabled" : ""}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="checkout-section address-card">
            <div className="section-header">
              <h2><MapPin size={20} className="icon-mr"/> Shipping Address</h2>
              <button className="change-addr-btn" onClick={handleChooseAddress}>
                {selectedAddress ? "Change" : "Choose"}
              </button>
            </div>
            <div className="address-content">
              {selectedAddress ? (
                <div className="selected-addr-view">
                  <div className="user-info-row">
                    <UserIcon size={16} /> 
                    <strong>{selectedAddress.fullName}</strong>
                    <span className={`addr-tag ${selectedAddress.type.toLowerCase()}`}>
                      {selectedAddress.type}
                    </span>
                  </div>
                  <p>{selectedAddress.street}, {selectedAddress.area}</p>
                  <p>{selectedAddress.city}, {selectedAddress.state} - <strong>{selectedAddress.pincode}</strong></p>
                  <p className="addr-mobile">📞 {selectedAddress.phone}</p>
                </div>
              ) : (
                <div className="no-addr-selected" onClick={handleChooseAddress}>
                  <p>No address selected. Please select a shipping address.</p>
                  <button className="modern-btn">Select Address</button>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="checkout-order-items">
            <div className="section-header">
              <h2>Your Order ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</h2>
            </div>
            <div className="order-items-list">
              {cartItems.map((item: Item) => {
                const itemTotal = getItemTotalPrice(item);
                const { minQty } = getItemValues(item);
                const currentQty = item.quantity || 0;
                const meetsMinimum = currentQty >= minQty;
                
                const imgSrc = item.image?.startsWith("http") 
                  ? item.image 
                  : `${IMAGE_BASE_URL}${encodeURIComponent(item.image || "")}`;
                
                return (
                  <div key={item._id} className="order-item-card">
                    <div className="item-image-container">
                      <img src={imgSrc} className="item-image" 
                           onError={(e) => (e.currentTarget.src = "/placeholder.png")} 
                           alt={item.name} />
                    </div>
                    <div className="item-details">
                      <div className="item-header">
                        <h3>{item.name}</h3>
                        <button className="item-remove" onClick={() => removeFromCart(item._id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {/* Minimum Quantity Indicator */}
                      <div className="min-qty-indicator">
                        <small>Minimum: {minQty} piece{minQty !== 1 ? 's' : ''} (₹{item.price || 0} {item.price && item.price < 60 ? '< 60' : '≥ 60'})</small>
                      </div>

                      <div className="item-quantity-section">
                        <div className="quantity-controls">
                          <button 
                            className="quantity-btn"
                            onClick={() => handleDecrease(item)} 
                            disabled={currentQty <= minQty || !isApproved}
                            title={currentQty <= minQty ? `Minimum quantity is ${minQty}` : "Decrease quantity"}
                          >
                            <Minus size={14} />
                          </button>
                          <span className={`quantity-value ${!meetsMinimum ? 'warning' : ''}`}>
                            {item.quantity || 0}
                            {!meetsMinimum && <span className="min-badge">Min: {minQty}</span>}
                          </span>
                          <button 
                            className="quantity-btn" 
                            onClick={() => handleIncrease(item)} 
                            disabled={!isApproved || (item.stock !== undefined && currentQty >= item.stock)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        {/* Quantity Warning */}
                        {!meetsMinimum && (
                          <div className="quantity-warning">
                            ⚠️ Minimum {minQty} piece{minQty !== 1 ? 's' : ''} required
                          </div>
                        )}
                      </div>
                      
                      {isApproved && (
                        <div className="item-price-section">
                          <span className="unit-price">₹{(item.price || 0).toLocaleString()} per pc</span>
                          <span className="total-value">₹{itemTotal.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary-card">
          <div className="summary-header">
            <h2>Order Summary</h2>
          </div>
          <div className="summary-content">
            {/* Minimum Quantity Status */}
            <div className={`summary-row min-qty-status ${allItemsMeetMinQty ? 'success' : 'error'}`}>
              <span className="total-label">
                Minimum Quantity
                {!allItemsMeetMinQty && <AlertCircle size={14} />}
              </span>
              <span className="total-value">
                {allItemsMeetMinQty ? '✓ Met' : '✗ Not Met'}
              </span>
            </div>

            <div className="total-row">
              <span className="total-label">Items ({cartItems.length})</span>
              <span className="total-value">₹{isApproved ? grandTotal.toLocaleString() : "-"}</span>
            </div>
            
            <div className="total-row shipping-row">
              <span className="total-label">Shipping</span>
              <span className="total-value">Free</span>
            </div>
            
            <div className="divider" />
            
            {/* --- COD Advance Breakdown --- */}
            {showCodAdvance ? (
              <>
                 <div className="total-row">
                  <span className="total-label">Order Total</span>
                  <span className="total-value">₹{grandTotal.toLocaleString()}</span>
                </div>
                <div className="total-row" style={{ color: '#2c5aa0', fontWeight: 600 }}>
                  <span className="total-label">Advance Payable Now</span>
                  <span className="total-value">₹{applicableAdvance}</span>
                </div>
                <div className="total-row grand-total">
                  <span className="total-label">Pay on Delivery</span>
                  <span className="total-value">₹{payOnDeliveryAmount.toLocaleString()}</span>
                </div>
              </>
            ) : (
              <div className="total-row grand-total">
                <span className="total-label">Grand Total</span>
                <span className="total-value">₹{isApproved ? grandTotal.toLocaleString() : "-"}</span>
              </div>
            )}
            
            <div className="payment-mode-display">
              <small>Payment via: <strong>{paymentMode === "COD" ? "Cash on Delivery" : "Online Payment"}</strong></small>
            </div>
            
            <button 
              className={`place-order-btn ${placing ? "processing" : ""} ${!allItemsMeetMinQty ? "disabled" : ""}`} 
              onClick={handlePlaceOrder} 
              disabled={placing || !cartItems.length || !selectedAddress || !allItemsMeetMinQty}
              title={!allItemsMeetMinQty ? "Please meet minimum quantity requirements" : ""}
            >
              {placing ? (
                <>
                  <div className="spinner"></div> 
                  {/* Dynamic Button Text during processing */}
                  {paymentMode === "COD" && applicableAdvance > 0 
                     ? "Processing Advance..." 
                     : paymentMode === "COD" ? "Placing Order..." : "Processing Payment..."}
                </>
              ) : (
                // Dynamic Button Text based on mode
                paymentMode === "COD" 
                  ? (applicableAdvance > 0 ? `Pay ₹${applicableAdvance} Advance` : "Place COD Order")
                  : "Proceed to Payment"
              )}
            </button>
            
            {!allItemsMeetMinQty && (
              <div className="min-qty-alert">
                <AlertCircle size={14} />
                <small>Some items don't meet minimum quantity. Update in cart.</small>
              </div>
            )}
            
            <div className="terms-notice">
              <p>
                By placing this order, you agree to our 
                <a href="/terms" target="_blank"> Terms & Conditions</a> and 
                <a href="/privacy" target="_blank"> Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;