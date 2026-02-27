import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import api, { MEDIA_URL } from "../utils/api";
import "../styles/Checkout.css";
import { Trash2, Plus, Minus, FileText, MapPin, User as UserIcon, CreditCard, Package, AlertCircle, Truck, Tag } from "lucide-react";

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
  advancePaid?: number;
  itemsPrice?: number;
  shippingPrice?: number;
  discountAmount?: number;
}

interface DiscountRule {
  minAmount: number;
  discountPercentage: number;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

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

  return { innerCount, unitPrice, totalPrice, minQty };
};

// --- Razorpay Script Loader ---
const loadRazorpay = () => {
  return new Promise((resolve) => {
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

// --- Invoice Generator ---
const generateInvoicePDF = (orderData: OrderData, user: any): boolean => {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Popup blocked! Please allow popups to generate invoice.");
    return false;
  }

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-IN", {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const addr = orderData.shippingAddress;
  const shopName = user?.shopName || addr?.fullName || "Customer";
  const mobile = addr?.phone || user?.otpMobile || "N/A";
  const whatsapp = mobile;

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

  const logoUrl = "https://res.cloudinary.com/dpdecxqb9/image/upload/v1758783697/bafnatoys/lwccljc9kkosfv9wnnrq.png";

  const invoiceItems = orderData.items.map(item => {
    const totalPieces = item.qty || 0;
    const inners = item.inners || Math.floor(totalPieces / (item.innerQty || 1));

    return {
      name: item.name,
      quantity: `${totalPieces} pcs (${inners} inner${inners !== 1 ? 's' : ''})`,
      rate: `₹${(item.price || 0).toFixed(2)}`,
      amount: `₹${((item.price || 0) * totalPieces).toFixed(2)}`
    };
  });

  const totalAmount = orderData.total;
  const advancePaid = orderData.advancePaid || 0;
  const balanceAmount = Math.max(totalAmount - advancePaid, 0);
  const discount = orderData.discountAmount || 0;
  const subTotal = orderData.itemsPrice || (totalAmount + discount - (orderData.shippingPrice || 0));


  const invoiceContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Invoice - ${orderData.orderNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      body { padding: 30px; color: #333; background: #f8f9fa; }
      .invoice-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; }
      .invoice-header { background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 25px 35px; text-align: center; }
      .logo-container { margin-bottom: 15px; }
      .company-logo { height: 60px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
      .company-name { font-size: 28px; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px; }
      .invoice-title { text-align: center; padding: 25px 35px 20px; border-bottom: 2px dashed #e5e7eb; }
      .invoice-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 25px 35px; border-bottom: 2px dashed #e5e7eb; }
      .products-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
      .products-table th, .products-table td { padding: 14px 12px; text-align: left; }
      .total-section { padding: 25px 35px; background: #f8fafc; border-top: 2px dashed #e5e7eb; }
      .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .print-controls { display: flex; justify-content: center; gap: 15px; margin-top: 25px; padding: 20px; }
      .print-btn { padding: 12px 30px; background: #2c5aa0; color: white; border: none; border-radius: 8px; cursor: pointer; }
      @media print { .print-controls { display: none; } }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="logo-container"><img src="${logoUrl}" alt="Bafna Toys" class="company-logo" /></div>
        <div class="company-name">Bafna Toys</div>
        <div>1-12, Sundapalayam Rd, Coimbatore, Tamil Nadu 641007</div>
        <div>Phone: +91 9043347300</div>
      </div>
      
      <div class="invoice-title">
        <h1>PRO FORMA INVOICE</h1>
        <div class="subtitle">Order #${orderData.orderNumber}</div>
      </div>
      
      <div class="invoice-info-grid">
        <div><h3>Bill To</h3><p>${shopName}<br>${mobile}<br>${whatsapp}</p></div>
        <div><h3>Ship To</h3><p>${shipToAddress || "Address not provided"}<br>${mobile}</p></div>
      </div>
      
      <div style="padding: 25px 35px;">
        <table class="products-table">
          <thead><tr><th>Product</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>
            ${invoiceItems.map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.rate}</td><td>${item.amount}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="total-section">
        <div class="total-row"><span>Subtotal</span><span>₹${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
        ${orderData.shippingPrice ? `<div class="total-row"><span>Shipping</span><span>₹${orderData.shippingPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>` : ''}
        ${discount > 0 ? `<div class="total-row" style="color: #ea580c;"><span>Discount</span><span>- ₹${discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>` : ''}
        <div class="total-row" style="margin-top: 10px; border-top: 1px solid #ddd; paddingTop: 10px; font-weight: bold;"><span>Total</span><span>₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
        ${advancePaid > 0 ? `<div class="total-row" style="color: #059669;"><span>Advance Paid</span><span>- ₹${advancePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>` : ''}
        <div class="total-row" style="margin-top: 15px; font-weight: 800; font-size: 24px; color: #2c5aa0;">
          <span>${advancePaid > 0 && orderData.paymentMode === 'COD' ? 'Balance to Pay' : 'Grand Total'}</span>
          <span>₹${balanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
    
    <div class="print-controls">
      <button class="print-btn" onclick="window.print()">Print Invoice</button>
      <button class="print-btn" style="background:#64748b" onclick="window.close()">Close</button>
    </div>
  </body>
  </html>`;

  printWindow.document.write(invoiceContent);
  printWindow.document.close();
  return true;
};

const Checkout: React.FC = () => {
  const {
    cartItems,
    clearCart,
    cartTotal,
    shippingFee,
    freeShippingThreshold
  } = useShop();

  const navigate = useNavigate();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMode, setPaymentMode] = useState<"ONLINE" | "COD">("ONLINE");
  const [codAdvance, setCodAdvance] = useState<number>(0);
  
  // Inline Address States
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    fullName: "", phone: "", street: "", area: "", city: "", state: "", pincode: "", type: "Home"
  });

  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<{ amount: number, percentage: number } | null>(null);

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

    const selectedStr = localStorage.getItem("temp_checkout_address");
    if (selectedStr) {
      setSelectedAddress(JSON.parse(selectedStr));
    } else {
      fetchDefaultAddress();
    }

    fetchCodSettings();
    fetchDiscountRules();
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

  const fetchDiscountRules = async () => {
    try {
      const { data } = await api.get("/discount-rules");
      if (Array.isArray(data)) {
        setDiscountRules(data.sort((a, b) => b.minAmount - a.minAmount));
      }
    } catch (error) {
      console.error("Failed to fetch Discount Rules", error);
    }
  };

  useEffect(() => {
    if (discountRules.length > 0 && cartTotal > 0) {
      const rule = discountRules.find(r => cartTotal >= r.minAmount);
      if (rule) {
        const discountVal = (cartTotal * rule.discountPercentage) / 100;
        setAppliedDiscount({ 
          amount: Math.floor(discountVal),
          percentage: rule.discountPercentage 
        });
      } else {
        setAppliedDiscount(null);
      }
    } else {
        setAppliedDiscount(null);
    }
  }, [cartTotal, discountRules]);

  useEffect(() => {
    const invalidItems = cartItems.filter(item => {
      const { innerCount, minQty } = getItemValues(item);
      return innerCount < minQty;
    });

    if (invalidItems.length > 0) {
      const itemNames = invalidItems.map(item => item.name).join(", ");
      setMinimumQtyError(`Minimum quantity not met for: ${itemNames}`);
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

  // --- Inline Address Handlers ---
  const handleAddAddressClick = () => {
    setAddressForm({
      fullName: user?.shopName || "",
      phone: user?.otpMobile || "",
      street: "", area: "", city: "", state: "", pincode: "", type: "Home"
    });
    setIsAddingAddress(true);
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if ((name === "phone" || name === "pincode") && !/^\d*$/.test(value)) return;
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const { data } = await api.post("/addresses", { ...addressForm, isDefault: true });
      setSelectedAddress(data);
      setIsAddingAddress(false);
    } catch (error) {
      // Fallback for local storage
      const newAddr = { ...addressForm, _id: crypto.randomUUID(), isDefault: true } as Address;
      const raw = localStorage.getItem("bt.addresses");
      const list = raw ? JSON.parse(raw) : [];
      localStorage.setItem("bt.addresses", JSON.stringify([...list, newAddr]));
      setSelectedAddress(newAddr);
      setIsAddingAddress(false);
    } finally {
      setSavingAddress(false);
    }
  };

  const discountAmt = appliedDiscount ? appliedDiscount.amount : 0;
  const finalTotalWithDiscount = Math.max(0, cartTotal + shippingFee - discountAmt);

  const handlePlaceOrder = async () => {
    const invalidItems = cartItems.filter(item => {
      const { innerCount, minQty } = getItemValues(item);
      return innerCount < minQty;
    });

    if (invalidItems.length > 0) {
      alert("Some items do not meet the minimum quantity requirement.");
      return;
    }

    if (!user || !selectedAddress || !cartItems.length) {
      alert("Please ensure items are in cart and address is selected.");
      return;
    }

    const applicableAdvance = paymentMode === "COD" ? Math.min(codAdvance, finalTotalWithDiscount) : 0;
    const isCodDirect = paymentMode === "COD" && applicableAdvance <= 0;

    if (isCodDirect) {
      try {
        setPlacing(true);
        const items = cartItems.map((item: any) => ({
          productId: item._id, name: item.name, qty: (item.quantity || 0) * (item.piecesPerInner || item.innerQty || 1), innerQty: item.piecesPerInner || item.innerQty || 1, inners: item.quantity || 0, price: item.price || 0, image: item.image || "",
        }));

        const { data } = await api.post("/orders", {
          customerId: user._id, items, itemsPrice: cartTotal, shippingPrice: shippingFee, discountAmount: discountAmt, total: finalTotalWithDiscount, shippingAddress: selectedAddress, paymentMode: "COD", paymentId: null, codAdvancePaid: 0, codRemainingAmount: finalTotalWithDiscount
        });

        const orderNum = data.order?.orderNumber || data.orderNumber;
        setOrderNumber(orderNum);
        setOrderDetails({
          orderNumber: orderNum, items, total: finalTotalWithDiscount, itemsPrice: cartTotal, shippingPrice: shippingFee, discountAmount: discountAmt, date: new Date().toISOString(), paymentMode: "COD", shippingAddress: selectedAddress, advancePaid: 0
        });

        setOrderPlaced(true); clearCart(); localStorage.removeItem("temp_checkout_address"); setPlacing(false);
      } catch (err: any) {
        console.error(err); alert("Failed to place COD order."); setPlacing(false);
      }
      return;
    }

    try {
      setPlacing(true);
      const payAmount = paymentMode === "ONLINE" ? finalTotalWithDiscount : applicableAdvance;
      const res = await loadRazorpay();
      if (!res) { alert("Payment gateway failed to load."); setPlacing(false); return; }

      const { data: razorOrder } = await api.post("/payments/create-order", { amount: payAmount });

      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY || "rzp_test_YOUR_KEY_HERE",
        amount: razorOrder.amount, currency: "INR", name: "Bafna Toys",
        description: paymentMode === "COD" ? `Advance Payment` : `Order Payment`,
        order_id: razorOrder.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.post("/payments/verify", response);
            if (verifyRes.data?.success !== true) { alert("Payment verification failed."); setPlacing(false); return; }

            const items = cartItems.map((item: any) => ({
              productId: item._id, name: item.name, qty: (item.quantity || 0) * (item.piecesPerInner || item.innerQty || 1), innerQty: item.piecesPerInner || item.innerQty || 1, inners: item.quantity || 0, price: item.price || 0, image: item.image || "",
            }));

            const advancePaid = paymentMode === "COD" ? applicableAdvance : 0;
            const remaining = Math.max(finalTotalWithDiscount - advancePaid, 0);

            const { data } = await api.post("/orders", {
              customerId: user._id, items, itemsPrice: cartTotal, shippingPrice: shippingFee, discountAmount: discountAmt, total: finalTotalWithDiscount, shippingAddress: selectedAddress, paymentMode: paymentMode, paymentId: response.razorpay_payment_id, codAdvancePaid: advancePaid, codRemainingAmount: remaining
            });

            const orderNum = data.order?.orderNumber || data.orderNumber;
            setOrderNumber(orderNum);
            setOrderDetails({
              orderNumber: orderNum, items, total: finalTotalWithDiscount, itemsPrice: cartTotal, shippingPrice: shippingFee, discountAmount: discountAmt, date: new Date().toISOString(), paymentMode: paymentMode, paymentId: response.razorpay_payment_id, shippingAddress: selectedAddress, advancePaid: advancePaid
            });

            setOrderPlaced(true); clearCart(); localStorage.removeItem("temp_checkout_address");
          } catch (err) { console.error(err); alert("Order creation failed after payment."); } finally { setPlacing(false); }
        },
        prefill: { name: selectedAddress.fullName, contact: selectedAddress.phone, email: user.email || "" },
        theme: { color: "#2c5aa0" },
        modal: { ondismiss: function() { setPlacing(false); }, escape: false }
      };

      const rzp = new (window as any).Razorpay(options); rzp.open();
    } catch (err: any) { console.error(err); alert("Failed to initiate payment."); setPlacing(false); }
  };

  if (orderPlaced) {
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
             <p>Payment Mode: <strong>{isCod ? "Cash on Delivery" : "Online Payment"}</strong></p>
             <p>Total Amount: <strong>₹{totalAmt.toLocaleString()}</strong></p>
             {isCod && advPaid > 0 && (
               <>
                 <p style={{color: 'green'}}>Advance Paid: ₹{advPaid}</p>
                 <p style={{color: 'orange'}}>Balance Due: ₹{balance}</p>
               </>
             )}
          </div>

          <div className="invoice-buttons" style={{ marginTop: '20px' }}>
            <button onClick={() => generateInvoicePDF(orderDetails!, user)} className="invoice-btn primary">
              <FileText size={18} /> View & Print Invoice
            </button>
            <button onClick={() => navigate("/orders")} className="invoice-btn secondary">View All Orders</button>
            <button onClick={() => navigate("/products")} className="invoice-btn outline">Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  const applicableAdvance = Math.min(codAdvance, finalTotalWithDiscount);
  const showCodAdvance = paymentMode === "COD" && applicableAdvance > 0;
  const payOnDeliveryAmount = Math.max(finalTotalWithDiscount - applicableAdvance, 0);

  const allItemsMeetMinQty = cartItems.every(item => {
    const { innerCount, minQty } = getItemValues(item);
    return innerCount >= minQty;
  });

  const neededForFree = freeShippingThreshold - cartTotal;
  const progressPercent = Math.min(100, (cartTotal / freeShippingThreshold) * 100);

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Complete your purchase</p>
      </div>

      {freeShippingThreshold > 0 && (
        <div style={{
            maxWidth: '1200px', margin: '0 auto 20px', padding: '15px 20px',
            background: neededForFree > 0 ? '#eff6ff' : '#f0fdf4',
            borderRadius: '12px', border: neededForFree > 0 ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '15px', fontWeight: '600', color: neededForFree > 0 ? '#1e40af' : '#15803d'}}>
             <Truck size={20} />
             {neededForFree > 0
               ? <span>Add <strong>₹{neededForFree.toLocaleString()}</strong> more for <strong>FREE Shipping!</strong></span>
               : <span>🎉 Congratulations! You've unlocked <strong>FREE Shipping!</strong></span>
             }
          </div>
          <div style={{width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden'}}>
             <div style={{
                width: `${progressPercent}%`, height: '100%',
                background: neededForFree > 0 ? '#3b82f6' : '#22c55e', transition: 'width 0.5s ease', borderRadius: '4px'
             }} />
          </div>
        </div>
      )}

      {minimumQtyError && (
        <div className="minimum-qty-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Minimum Quantity Alert</strong>
            <p>{minimumQtyError}</p>
          </div>
          <button className="go-to-cart-btn" onClick={() => navigate("/cart")}>Update Cart</button>
        </div>
      )}

      <div className="checkout-grid">
        <div className="checkout-left">
          {/* Payment Mode */}
          <div className="checkout-section payment-mode-card">
            <div className="section-header"><h2>📦 Select Payment Method</h2></div>
            <div className="payment-options">
              <div className={`payment-option ${paymentMode === "COD" ? "selected" : ""}`} onClick={() => setPaymentMode("COD")}>
                <div className="payment-icon"><Package size={24} /></div>
                <div className="payment-info">
                  <h3>Cash on Delivery</h3>
                  {codAdvance > 0 && applicableAdvance > 0 ? (
                    <p style={{color: '#d97706'}}>Pay ₹{applicableAdvance} advance</p>
                  ) : (<p>Pay on delivery</p>)}
                </div>
                <div className="payment-radio"><div className={`radio-circle ${paymentMode === "COD" ? "active" : ""}`} /></div>
              </div>

              <div className={`payment-option ${paymentMode === "ONLINE" ? "selected" : ""}`} onClick={() => setPaymentMode("ONLINE")}>
                <div className="payment-icon"><CreditCard size={24} /></div>
                <div className="payment-info">
                  <h3>Online Payment</h3>
                  <p>Pay securely</p>
                </div>
                <div className="payment-radio"><div className={`radio-circle ${paymentMode === "ONLINE" ? "active" : ""}`} /></div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="checkout-section address-card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2><MapPin size={20} className="icon-mr"/> Shipping Address</h2>
              
              {/* ✅ FIX: Yahan "Add New" aur "Change Address" dono show honge jab address select ho chuka ho */}
              {!isAddingAddress && selectedAddress && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleAddAddressClick} style={{ background: '#2c5aa0', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <Plus size={14} /> Add New
                  </button>
                  <button onClick={() => navigate("/addresses?select=true")} style={{ background: 'transparent', color: '#2c5aa0', border: '1px solid #2c5aa0', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    Change Address
                  </button>
                </div>
              )}
            </div>
            
            <div className="address-content">
              {isAddingAddress ? (
                /* Inline Address Form */
                <form onSubmit={handleSaveNewAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '15px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input required placeholder="Full Name *" name="fullName" value={addressForm.fullName} onChange={handleAddressFormChange} style={{...inputStyle, gridColumn: 'span 2'}} />
                      <input required placeholder="Phone *" name="phone" maxLength={10} value={addressForm.phone} onChange={handleAddressFormChange} style={inputStyle} />
                      <input required placeholder="Pincode *" name="pincode" maxLength={6} value={addressForm.pincode} onChange={handleAddressFormChange} style={inputStyle} />
                      <input required placeholder="Street / Shop No. *" name="street" value={addressForm.street} onChange={handleAddressFormChange} style={{...inputStyle, gridColumn: 'span 2'}} />
                      <input placeholder="Area / Landmark" name="area" value={addressForm.area} onChange={handleAddressFormChange} style={{...inputStyle, gridColumn: 'span 2'}} />
                      <input required placeholder="City *" name="city" value={addressForm.city} onChange={handleAddressFormChange} style={inputStyle} />
                      <select required name="state" value={addressForm.state} onChange={handleAddressFormChange} style={inputStyle}>
                          <option value="">Select State *</option>
                          {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                      <select name="type" value={addressForm.type} onChange={handleAddressFormChange} style={{...inputStyle, gridColumn: 'span 2'}}>
                          <option>Home</option><option>Office</option><option>Other</option>
                      </select>
                   </div>
                   <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="button" onClick={() => setIsAddingAddress(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                      <button type="submit" disabled={savingAddress} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2c5aa0', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                          {savingAddress ? "Saving..." : "Save & Deliver Here"}
                      </button>
                   </div>
                </form>
              ) : selectedAddress ? (
                /* Selected Address Detail View */
                <div className="selected-addr-view" style={{ marginTop: '10px' }}>
                  <div className="user-info-row">
                    <UserIcon size={16} /> <strong>{selectedAddress.fullName}</strong>
                    <span className={`addr-tag`}>{selectedAddress.type}</span>
                  </div>
                  <p>{selectedAddress.street}, {selectedAddress.area}</p>
                  <p>{selectedAddress.city} - <strong>{selectedAddress.pincode}</strong></p>
                  <p>📞 {selectedAddress.phone}</p>
                </div>
              ) : (
                /* NO Address Selected State */
                <div className="no-addr-selected" style={{ padding: '30px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', marginTop: '10px', border: '1.5px dashed #cbd5e1' }}>
                  <p style={{ marginBottom: '20px', color: '#64748b', fontSize: '15px' }}>No address selected.</p>
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={handleAddAddressClick} style={{ background: '#2c5aa0', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16} /> Add New Address
                      </button>
                      
                      {/* ✅ FIX: popup hatane ke liye `redirect=checkout` url se nikal diya */}
                      <button onClick={() => navigate("/addresses?select=true")} style={{ background: 'transparent', color: '#2c5aa0', border: '1.5px solid #2c5aa0', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Choose Saved Address
                      </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="checkout-order-items">
            <div className="section-header"><h2>Your Order ({cartItems.length})</h2></div>
            <div className="order-items-list">
              {cartItems.map((item: Item) => {
                const { minQty, innerCount } = getItemValues(item);
                const itemTotal = (item.quantity || 0) * (item.price || 0) * (item.piecesPerInner || item.innerQty || 1);
                const imgSrc = item.image?.startsWith("http") ? item.image : `${IMAGE_BASE_URL}${encodeURIComponent(item.image || "")}`;

                return (
                  <div key={item._id} className="order-item-card">
                    <div className="item-image-container"><img src={imgSrc} className="item-image" alt={item.name} /></div>
                    <div className="item-details">
                      <div className="item-header"><h3>{item.name}</h3></div>
                      <div className="min-qty-indicator"><small>Min: {minQty} (Ordered: {innerCount})</small></div>
                      <div className="item-price-section">
                        <span className="unit-price">₹{(item.price || 0).toLocaleString()} per pc</span>
                        <span className="total-value">₹{itemTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Side */}
        <div className="checkout-summary-card">
          <div className="summary-header"><h2>Order Summary</h2></div>
          <div className="summary-content">
            <div className="total-row"><span>Items Total</span><span>₹{cartTotal.toLocaleString()}</span></div>
            <div className="total-row">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "Free" : `₹${shippingFee}`}</span>
            </div>

            {/* ✅ DISCOUNT DISPLAY */}
            {appliedDiscount && (
                <div className="total-row" style={{ color: '#ea580c', fontWeight: 500 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Tag size={16} /> Bulk Discount ({appliedDiscount.percentage}%)
                    </span>
                    <span>- ₹{appliedDiscount.amount.toLocaleString()}</span>
                </div>
            )}

            <div className="divider" />

            {showCodAdvance ? (
              <>
                <div className="total-row"><span>Order Total</span><span>₹{finalTotalWithDiscount.toLocaleString()}</span></div>
                <div className="total-row" style={{color: '#2c5aa0'}}><span>Advance</span><span>₹{applicableAdvance}</span></div>
                <div className="total-row grand-total"><span>Due on Delivery</span><span>₹{payOnDeliveryAmount.toLocaleString()}</span></div>
              </>
            ) : (
              <div className="total-row grand-total"><span>Grand Total</span><span>₹{finalTotalWithDiscount.toLocaleString()}</span></div>
            )}

            <button
              className={`place-order-btn ${placing ? "processing" : ""} ${!allItemsMeetMinQty ? "disabled" : ""}`}
              onClick={handlePlaceOrder}
              disabled={placing || !cartItems.length || !selectedAddress || !allItemsMeetMinQty || isAddingAddress}
            >
              {placing ? "Processing..." : (paymentMode === "COD" ? "Place COD Order" : "Pay Now")}
            </button>
            {isAddingAddress && <p style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center', marginTop: '10px', fontWeight: 500 }}>Please save your address first.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;