// src/components/Checkout.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import api, { MEDIA_URL } from "../utils/api";
import "../styles/Checkout.css";
import {
  FileText, MapPin, User as UserIcon, CreditCard,
  Package, AlertCircle, Truck, Tag, Plus, ChevronRight,
  ChevronDown, ChevronUp, Shield, CheckCircle2, ShoppingBag,
  Info,
} from "lucide-react";

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
  shopName?: string;
  fullName: string;
  phone: string;
  street: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  type: string;
  isDefault?: boolean;
  gstNumber?: string;
  isDifferentShipping?: boolean;
  shippingStreet?: string;
  shippingArea?: string;
  shippingPincode?: string;
  shippingCity?: string;
  shippingState?: string;
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
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Puducherry",
];

const getMinimumQuantity = (price: number): number => (price < 60 ? 3 : 2);

const getItemValues = (item: Item) => {
  const innerCount = item.quantity || 0;
  const unitPrice = item.price || 0;
  const minQty = getMinimumQuantity(unitPrice);
  const totalPrice = innerCount * unitPrice * (item.piecesPerInner || item.innerQty || 1);
  return { innerCount, unitPrice, totalPrice, minQty };
};

const loadRazorpay = () =>
  new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const normalizeWhatsApp91 = (raw?: string) => {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  const without91 = digits.startsWith("91") ? digits.slice(2) : digits;
  const last10 = without91.length > 10 ? without91.slice(-10) : without91;
  if (last10.length !== 10) return "";
  return `91${last10}`;
};

// ✅ Updated: ImageKit Helper for Checkout Thumbnails
const getThumbUrl = (url: string | undefined, baseUrl: string) => {
  if (!url) return "/images/placeholder.webp";
  if (url.includes("ik.imagekit.io")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}tr=w-150,h-150,cm-at_max,f-auto,q-80`;
  }
  if (url.startsWith("http")) return url;
  return `${baseUrl}${encodeURIComponent(url)}`;
};

const generateInvoicePDF = (orderData: OrderData, user: any): boolean => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("Popup blocked!"); return false; }

  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });
  
  const shippingAddr = orderData.shippingAddress;
  const wa = normalizeWhatsApp91(user?.whatsapp || user?.otpMobile);
  
  let shippingHtml = "No shipping address provided";
  if (shippingAddr) {
    shippingHtml = [
      shippingAddr.shopName ? `<strong>${shippingAddr.shopName}</strong>` : "",
      shippingAddr.fullName ? `Attn: ${shippingAddr.fullName}` : "",
      shippingAddr.isDifferentShipping ? shippingAddr.shippingStreet : shippingAddr.street,
      shippingAddr.isDifferentShipping ? shippingAddr.shippingArea : shippingAddr.area,
      `${shippingAddr.isDifferentShipping ? shippingAddr.shippingCity : shippingAddr.city}, ${shippingAddr.isDifferentShipping ? shippingAddr.shippingState : shippingAddr.state}`,
      shippingAddr.isDifferentShipping ? `PIN: ${shippingAddr.shippingPincode}` : `PIN: ${shippingAddr.pincode}`,
      shippingAddr.phone ? `Phone: ${shippingAddr.phone}` : "",
      shippingAddr.gstNumber ? `GST: ${shippingAddr.gstNumber}` : "",
    ].filter(Boolean).join("<br>");
  }
  
  const paymentText = orderData.paymentMode === "ONLINE" ? "Paid (Online)" : "Cash on Delivery";

  // ✅ Updated: Cloudinary Logo replaced with ImageKit Logo in Invoice
  const content = `<!DOCTYPE html><html><head><title>Invoice - ${orderData.orderNumber}</title><style>body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;background:#fff;color:#333}.invoice-container{max-width:850px;margin:0 auto;border:1px solid #ddd;padding:30px}.header{text-align:center;margin-bottom:25px;border-bottom:3px solid #2c5aa0;padding-bottom:15px}.header img{max-height:70px}.invoice-details{display:flex;justify-content:space-between;gap:14px;margin-bottom:25px}.detail-section{width:32%}.detail-section h3{font-size:15px;color:#2c5aa0;border-bottom:1px solid #ddd;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px}th{background:#2c5aa0;color:#fff;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #eee}.footer{margin-top:40px;text-align:center;font-size:12px;color:#777}@media print{.btn-hide{display:none}}</style></head><body><div class="invoice-container"><div class="header"><img src="https://ik.imagekit.io/rishii/bafnatoys/Copy%20of%20Super_Car___05_vrkphh.webp?updatedAt=1775309336739" alt="BafnaToys"/><p>1-12, Thondamuthur Road, Coimbatore - 641007<br>+91 9043347300 | bafnatoysphotos@gmail.com</p><h2>PRO FORMA INVOICE</h2></div><div class="invoice-details"><div class="detail-section"><h3>Bill To</h3><p><strong>${shippingAddr?.shopName || user?.shopName || "-"}</strong><br>Mobile: ${shippingAddr?.phone || user?.otpMobile || "-"}<br>WhatsApp: ${wa || "-"}</p></div><div class="detail-section"><h3>Ship To</h3><p>${shippingHtml}</p></div><div class="detail-section"><h3>Order Details</h3><p>Invoice: ${orderData.orderNumber}<br>Date: ${currentDate}<br>Payment: ${paymentText}</p></div></div><table><thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${orderData.items.map((it) => `<tr><td>${it.name}</td><td>${it.qty}</td><td>₹${it.price}</td><td>₹${it.qty * it.price}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="3" align="right"><strong>Total</strong></td><td><strong>₹${orderData.total}</strong></td></tr></tfoot></table><div class="footer"><p>Thank you for choosing BafnaToys! - https://bafnatoys.com</p></div></div><div style="text-align:center;margin-top:20px" class="btn-hide"><button onclick="window.print()" style="padding:10px 20px;background:#2c5aa0;color:white;border:none;cursor:pointer;margin-right:10px;">Print Invoice</button><button onclick="window.close()" style="padding:10px 20px;background:#64748b;color:white;border:none;cursor:pointer">Close</button></div></body></html>`;

  printWindow.document.write(content);
  printWindow.document.close();
  return true;
};

const Checkout: React.FC = () => {
  const { cartItems, clearCart, cartTotal, shippingFee, freeShippingThreshold } = useShop();
  const navigate = useNavigate();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMode, setPaymentMode] = useState<"ONLINE" | "COD">("ONLINE");
  
  const [codAdvance, setCodAdvance] = useState<number>(0);
  const [advanceType, setAdvanceType] = useState<"flat" | "percentage">("flat");
  const [isCodEnabled, setIsCodEnabled] = useState<boolean>(true);
  
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    shopName: "", fullName: "", phone: "", street: "", area: "", city: "", state: "", pincode: "", type: "Work", gstNumber: "", isDifferentShipping: false, shippingStreet: "", shippingArea: "", shippingPincode: "", shippingCity: "", shippingState: ""
  });
  
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<{ amount: number; percentage: number } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [minimumQtyError, setMinimumQtyError] = useState<string | null>(null);
  
  const [mobSummaryOpen, setMobSummaryOpen] = useState(true); 
  
  const [activeStep, setActiveStep] = useState(1);

  // ✅ Meta Pixel: fire InitiateCheckout when checkout opens with items
  useEffect(() => {
    if (cartItems && cartItems.length > 0 && typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        value: cartTotal,
        num_items: cartItems.length,
        currency: "INR",
        content_ids: cartItems.map((i: any) => i._id),
        content_type: "product",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [openPolicy, setOpenPolicy] = useState<"shipping" | "return" | null>(null);
  const addressRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  const IMAGE_BASE_URL = `${MEDIA_URL}/uploads/`;

  useEffect(() => {
    if (selectedAddress && !isAddingAddress) setActiveStep(2);
    if (selectedAddress && paymentMode) setActiveStep(3);
  }, [selectedAddress, paymentMode, isAddingAddress]);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) { navigate("/login"); return; }
    const userData = JSON.parse(userString);
    setUser(userData);
    const selectedStr = localStorage.getItem("temp_checkout_address");
    if (selectedStr) setSelectedAddress(JSON.parse(selectedStr));
    else fetchDefaultAddress();
    fetchCodSettings();
    fetchDiscountRules();
  }, []);

  const fetchCodSettings = async () => {
    try {
      const { data } = await api.get("/settings/cod");
      if (data) {
        if (data.advanceAmount !== undefined) setCodAdvance(Number(data.advanceAmount));
        if (data.advanceType !== undefined) setAdvanceType(data.advanceType);
        if (data.enabled !== undefined) {
          setIsCodEnabled(data.enabled);
          if (!data.enabled && paymentMode === "COD") setPaymentMode("ONLINE");
        }
      }
    } catch {}
  };

  const fetchDiscountRules = async () => {
    try {
      const { data } = await api.get("/discount-rules");
      if (Array.isArray(data)) setDiscountRules(data.sort((a, b) => b.minAmount - a.minAmount));
    } catch {}
  };

  useEffect(() => {
    if (discountRules.length > 0 && cartTotal > 0) {
      const rule = discountRules.find((r) => cartTotal >= r.minAmount);
      if (rule) {
        setAppliedDiscount({ amount: Math.floor((cartTotal * rule.discountPercentage) / 100), percentage: rule.discountPercentage });
      } else setAppliedDiscount(null);
    } else setAppliedDiscount(null);
  }, [cartTotal, discountRules]);

  useEffect(() => {
    const invalid = cartItems.filter((item) => {
      const { innerCount, minQty } = getItemValues(item);
      return innerCount < minQty;
    });
    if (invalid.length > 0) setMinimumQtyError(`Minimum qty not met: ${invalid.map((i) => i.name).join(", ")}`);
    else setMinimumQtyError(null);
  }, [cartItems]);

  const fetchDefaultAddress = async () => {
    try {
      const { data } = await api.get("/addresses");
      if (data?.length > 0) setSelectedAddress(data.find((a: Address) => a.isDefault) || data[0]);
    } catch {}
  };

  const handleAddAddressClick = () => {
    setAddressForm({ 
      shopName: user?.shopName || "", 
      fullName: user?.ownerName || user?.fullName || "", 
      phone: user?.otpMobile || "", 
      street: "", area: "", city: "", state: "", pincode: "", type: "Work", 
      gstNumber: user?.gstNumber || "", 
      isDifferentShipping: false, 
      shippingStreet: "", shippingArea: "", shippingCity: "", shippingState: "", shippingPincode: "" 
    });
    setIsAddingAddress(true);
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setAddressForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if ((name === "phone" || name === "pincode" || name === "shippingPincode") && !/^\d*$/.test(value)) return;
    
    const finalValue = name === "gstNumber" ? value.toUpperCase() : value;
    setAddressForm((prev) => ({ ...prev, [name]: finalValue }));

    if ((name === "pincode" || name === "shippingPincode") && value.length === 6) {
      fetchCityStateFromPincode(value, name === "shippingPincode");
    }
  };

  const fetchCityStateFromPincode = async (pincode: string, isShipping: boolean) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0].Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        setAddressForm(prev => ({
          ...prev,
          [isShipping ? 'shippingCity' : 'city']: postOffice.District,
          [isShipping ? 'shippingState' : 'state']: postOffice.State,
        }));
      }
    } catch (error) {
      console.error("Error fetching pincode data:", error);
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const { data } = await api.post("/addresses", { ...addressForm, isDefault: true });
      setSelectedAddress(data);
      setIsAddingAddress(false);
    } catch {
      const newAddr = { ...addressForm, _id: crypto.randomUUID(), isDefault: true } as Address;
      const list = JSON.parse(localStorage.getItem("bt.addresses") || "[]");
      localStorage.setItem("bt.addresses", JSON.stringify([...list, newAddr]));
      setSelectedAddress(newAddr);
      setIsAddingAddress(false);
    } finally {
      setSavingAddress(false);
    }
  };

  const discountAmt = appliedDiscount?.amount || 0;
  const finalTotalWithDiscount = Math.max(0, cartTotal + shippingFee - discountAmt);

  let calculatedAdvance = codAdvance;
  if (advanceType === "percentage") {
    calculatedAdvance = Math.floor((finalTotalWithDiscount * codAdvance) / 100);
  }

  const applicableAdvance = Math.min(calculatedAdvance, finalTotalWithDiscount);
  const showCodAdvance = paymentMode === "COD" && applicableAdvance > 0;
  const payOnDeliveryAmount = Math.max(finalTotalWithDiscount - applicableAdvance, 0);
  
  const allItemsMeetMinQty = cartItems.every((item) => {
    const { innerCount, minQty } = getItemValues(item);
    return innerCount >= minQty;
  });

  const getButtonText = () => {
    if (paymentMode === "COD" && applicableAdvance > 0) {
      return `Pay ₹${applicableAdvance.toLocaleString()} Advance`;
    }
    if (paymentMode === "COD") return "Place COD Order";
    return `Pay ₹${finalTotalWithDiscount.toLocaleString()}`;
  };

  const handlePlaceOrder = async () => {
    if (cartItems.some((item) => { const { innerCount, minQty } = getItemValues(item); return innerCount < minQty; })) {
      alert("Some items do not meet minimum quantity."); return;
    }
    if (!user || !selectedAddress || !cartItems.length) { alert("Please add address and items."); return; }

    const isCodDirect = paymentMode === "COD" && applicableAdvance <= 0;

    if (isCodDirect) {
      try {
        setPlacing(true);
        const items = cartItems.map((item: any) => ({ productId: item._id, name: item.name, qty: (item.quantity || 0) * (item.piecesPerInner || item.innerQty || 1), innerQty: item.piecesPerInner || item.innerQty || 1, inners: item.quantity || 0, price: item.price || 0, image: item.image || "" }));
        const { data } = await api.post("/orders", { customerId: user._id, items, itemsPrice: cartTotal, shippingPrice: shippingFee, discountAmount: discountAmt, total: finalTotalWithDiscount, shippingAddress: selectedAddress, paymentMode: "COD", paymentId: null, codAdvancePaid: 0, codRemainingAmount: finalTotalWithDiscount });
        const orderNum = data.order?.orderNumber || data.orderNumber;
        setOrderNumber(orderNum);
        setOrderDetails({ orderNumber: orderNum, items, total: finalTotalWithDiscount, itemsPrice: cartTotal, shippingPrice: shippingFee, discountAmount: discountAmt, date: new Date().toISOString(), paymentMode: "COD", shippingAddress: selectedAddress, advancePaid: 0 });
        
        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq('track', 'Purchase', { value: finalTotalWithDiscount, currency: 'INR', content_type: 'product', content_ids: items.map(item => item.productId) });
        }
        
        setOrderPlaced(true); clearCart(); localStorage.removeItem("temp_checkout_address");
        // ✅ Mark abandoned cart as recovered (silent — never break UX)
        api.post("/abandoned-cart/recovered", { orderId: data.order?._id }).catch(() => {});
      } catch { alert("Failed to place order."); } finally { setPlacing(false); }
      return;
    }

    try {
      setPlacing(true);
      const payAmount = paymentMode === "ONLINE" ? finalTotalWithDiscount : applicableAdvance;
      const res = await loadRazorpay();
      if (!res) { alert("Payment gateway failed."); setPlacing(false); return; }
      const { data: razorOrder } = await api.post("/payments/create-order", { amount: payAmount });
      const options = {
        key: (import.meta as any).env?.VITE_RAZORPAY_KEY || "rzp_test_YOUR_KEY_HERE",
        amount: razorOrder.amount, currency: "INR", name: "Bafna Toys",
        description: paymentMode === "COD" ? "Advance Payment" : "Order Payment",
        order_id: razorOrder.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post("/payments/verify", response);
            if (verifyRes.data?.success !== true) { alert("Payment verification failed."); setPlacing(false); return; }
            const items = cartItems.map((item: any) => ({ productId: item._id, name: item.name, qty: (item.quantity || 0) * (item.piecesPerInner || item.innerQty || 1), innerQty: item.piecesPerInner || item.innerQty || 1, inners: item.quantity || 0, price: item.price || 0, image: item.image || "" }));
            const advancePaid = paymentMode === "COD" ? applicableAdvance : 0;
            const { data } = await api.post("/orders", { customerId: user._id, items, itemsPrice: cartTotal, shippingPrice: shippingFee, discountAmount: discountAmt, total: finalTotalWithDiscount, shippingAddress: selectedAddress, paymentMode, paymentId: response.razorpay_payment_id, codAdvancePaid: advancePaid, codRemainingAmount: Math.max(finalTotalWithDiscount - advancePaid, 0) });
            const orderNum = data.order?.orderNumber || data.orderNumber;
            setOrderNumber(orderNum);
            setOrderDetails({ orderNumber: orderNum, items, total: finalTotalWithDiscount, itemsPrice: cartTotal, shippingPrice: shippingFee, discountAmount: discountAmt, date: new Date().toISOString(), paymentMode, paymentId: response.razorpay_payment_id, shippingAddress: selectedAddress, advancePaid });
            
            if (typeof window !== "undefined" && (window as any).fbq) {
              (window as any).fbq('track', 'Purchase', { value: finalTotalWithDiscount, currency: 'INR', content_type: 'product', content_ids: items.map(item => item.productId) });
            }

            setOrderPlaced(true); clearCart(); localStorage.removeItem("temp_checkout_address");
            // ✅ Mark abandoned cart as recovered (silent — never break UX)
            api.post("/abandoned-cart/recovered", { orderId: data.order?._id }).catch(() => {});
          } catch { alert("Order creation failed."); } finally { setPlacing(false); }
        },
        prefill: { name: selectedAddress.fullName, contact: selectedAddress.phone, email: user.email || "" },
        theme: { color: "#4f46e5" },
        modal: { ondismiss: () => setPlacing(false), escape: false },
      };
      const rzp = new (window as any).Razorpay(options); rzp.open();
    } catch { alert("Failed to initiate payment."); setPlacing(false); }
  };

  const neededForFree = freeShippingThreshold - cartTotal;
  const progressPercent = Math.min(100, (cartTotal / freeShippingThreshold) * 100);

  const gstValue = addressForm.gstNumber?.toUpperCase() || "";
  const isGstInvalid = gstValue.length > 0 && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/.test(gstValue);

  /* ── SUCCESS PAGE ── */
  if (orderPlaced) {
    const isCod = orderDetails?.paymentMode === "COD";
    const advPaid = orderDetails?.advancePaid || 0;
    const totalAmt = orderDetails?.total || 0;
    const balance = Math.max(totalAmt - advPaid, 0);

    return (
      <div className="co-success-wrap">
        <div className="co-success-card">
          <div className="co-success-anim">
            <div className="co-success-circle">
              <CheckCircle2 size={48} />
            </div>
          </div>

          <h2 className="co-success-title">Order Confirmed!</h2>
          <p className="co-success-subtitle">Thank you for your order</p>

          <div className="co-success-order-id">
            <span>Order ID</span>
            <strong>#{orderNumber}</strong>
          </div>

          <div className="co-success-details">
            <div className="co-success-row">
              <span>Payment Method</span>
              <strong>{isCod ? "Cash on Delivery" : "Online Payment"}</strong>
            </div>
            <div className="co-success-row">
              <span>Order Total</span>
              <strong>₹{totalAmt.toLocaleString()}</strong>
            </div>
            {isCod && advPaid > 0 && (
              <>
                <div className="co-success-row co-success-row--green">
                  <span>Advance Paid</span>
                  <strong>₹{advPaid.toLocaleString()}</strong>
                </div>
                <div className="co-success-row co-success-row--amber">
                  <span>Pay on Delivery</span>
                  <strong>₹{balance.toLocaleString()}</strong>
                </div>
              </>
            )}
          </div>

          <div className="co-success-actions">
            <button onClick={() => generateInvoicePDF(orderDetails!, user)} className="co-success-btn co-success-btn--primary">
              <FileText size={18} /> View Invoice
            </button>
            <button onClick={() => navigate("/orders")} className="co-success-btn co-success-btn--secondary">
              <ShoppingBag size={18} /> My Orders
            </button>
            <button onClick={() => navigate("/products")} className="co-success-btn co-success-btn--ghost">
              Continue Shopping <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="co-page">
        {/* ── Mobile Step Header ── */}
        <div className="co-mob-header">
          <button className="co-back-btn" onClick={() => navigate("/cart")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="co-mob-header-text">
            <h1>Checkout</h1>
            <span>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="co-mob-header-price">
            ₹{finalTotalWithDiscount.toLocaleString()}
          </div>
        </div>

        {/* ── Desktop Header ── */}
        <div className="co-desk-header">
          <h1>Checkout</h1>
          <p>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} · ₹{cartTotal.toLocaleString()}</p>
        </div>

        {/* Shipping Progress Bar */}
        {freeShippingThreshold > 0 && (
          <div className={`co-ship-bar ${neededForFree <= 0 ? "co-ship-bar--ok" : ""}`}>
            <div className="co-ship-text">
              <Truck size={16} />
              {neededForFree > 0
                ? <span>Add <strong>₹{neededForFree.toLocaleString()}</strong> more for <strong>FREE Shipping</strong></span>
                : <span>🎉 You've unlocked <strong>FREE Shipping!</strong></span>
              }
            </div>
            <div className="co-ship-track">
              <div className="co-ship-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        {/* Min Qty Alert */}
        {minimumQtyError && (
          <div className="co-alert-banner">
            <div className="co-alert-icon"><AlertCircle size={18} /></div>
            <div className="co-alert-body">
              <strong>Minimum Quantity</strong>
              <p>{minimumQtyError}</p>
            </div>
            <button className="co-alert-action" onClick={() => navigate("/cart")}>Fix Cart</button>
          </div>
        )}

        {/* ── Mobile Steps Indicator ── */}
        <div className="co-steps-mob">
          <div className={`co-step ${selectedAddress ? "co-step--done" : "co-step--active"}`}>
            <div className="co-step-dot">{selectedAddress ? <CheckCircle2 size={14} /> : "1"}</div>
            <span>Address</span>
          </div>
          <div className="co-step-line" />
          <div className={`co-step ${selectedAddress && paymentMode ? "co-step--done" : selectedAddress ? "co-step--active" : ""}`}>
            <div className="co-step-dot">{selectedAddress && paymentMode ? <CheckCircle2 size={14} /> : "2"}</div>
            <span>Payment</span>
          </div>
          <div className="co-step-line" />
          <div className={`co-step ${activeStep === 3 ? "co-step--active" : ""}`}>
            <div className="co-step-dot">3</div>
            <span>Review</span>
          </div>
        </div>

        <div className="co-grid">
          <div className="co-left">

            {/* ═══ ADDRESS SECTION ═══ */}
            <div className="co-card" ref={addressRef}>
              <div className="co-card-head">
                <div className="co-card-title">
                  <div className="co-card-icon co-card-icon--blue"><MapPin size={16} /></div>
                  <h2>BILLING & SHIPPING DETAILS</h2>
                </div>
                {!isAddingAddress && selectedAddress && (
                  <div className="co-card-actions">
                    <button className="co-chip-btn co-chip-btn--fill" onClick={handleAddAddressClick}>
                      <Plus size={12} /> New
                    </button>
                    <button className="co-chip-btn" onClick={() => navigate("/addresses?select=true")}>Change</button>
                  </div>
                )}
              </div>

              <div className="co-card-body">
                {isAddingAddress ? (
                  <form onSubmit={handleSaveNewAddress} className="co-addr-form">
                    <div className="co-form-grid">
                      <div className="co-field co-field--full">
                        <label>Shop Name - Compulsory</label>
                        <input required name="shopName" value={addressForm.shopName} onChange={handleAddressFormChange} placeholder="Enter your shop / business name" />
                      </div>
                      <div className="co-field">
                        <label>Contact Person Name - Compulsory</label>
                        <input required name="fullName" value={addressForm.fullName} onChange={handleAddressFormChange} placeholder="Enter contact person name" />
                      </div>
                      <div className="co-field">
                        <label>Phone - Compulsory</label>
                        <input required name="phone" maxLength={10} value={addressForm.phone} onChange={handleAddressFormChange} placeholder="10-digit number" />
                      </div>
                      <div className="co-field co-field--full">
                        <label>Shop Address - Compulsory</label>
                        <input required name="street" value={addressForm.street} onChange={handleAddressFormChange} placeholder="Billing street address" />
                      </div>
                      <div className="co-field co-field--full">
                        <label>Landmark - Optional</label>
                        <input name="area" value={addressForm.area} onChange={handleAddressFormChange} placeholder="Optional" />
                      </div>
                      <div className="co-field">
                        <label>Pincode - Compulsory</label>
                        <input required name="pincode" maxLength={6} value={addressForm.pincode} onChange={handleAddressFormChange} placeholder="6-digit pincode" />
                      </div>
                      <div className="co-field">
                        <label>City - Compulsory</label>
                        <input required name="city" value={addressForm.city} onChange={handleAddressFormChange} placeholder="City" />
                      </div>
                      <div className="co-field">
                        <label>State - Compulsory</label>
                        <select required name="state" value={addressForm.state} onChange={handleAddressFormChange}>
                          <option value="">Select</option>
                          {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </div>
                      <div className="co-field co-field--full" style={{ marginBottom: '10px' }}>
                        <label>GST - Optional</label>
                        <input name="gstNumber" value={addressForm.gstNumber?.toUpperCase() || ""} onChange={handleAddressFormChange} placeholder="Enter 15-digit GST Number" maxLength={15} style={{ marginBottom: '5px', textTransform: 'uppercase', borderColor: isGstInvalid ? '#dc2626' : '#e2e8f0' }} />
                        {isGstInvalid ? (
                          <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>❌ Please enter a valid 15-digit GST number.</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>(Please enter your GST number to claim TAX input credit on your purchase. If no GST Number, goods will be sent on personal name)</span>
                        )}
                      </div>

                      <div className="co-field co-field--full" style={{ marginTop: '10px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0, fontWeight: 600 }}>
                          <input type="checkbox" name="isDifferentShipping" checked={addressForm.isDifferentShipping} onChange={handleAddressFormChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                          Different Billing and Shipping address?
                        </label>
                      </div>

                      {addressForm.isDifferentShipping && (
                        <div style={{ gridColumn: "1 / -1", display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', padding: '20px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          <h4 style={{ gridColumn: '1 / -1', margin: '0 0 10px 0', color: '#16a34a' }}>Shipping Details</h4>
                          <div className="co-field co-field--full">
                            <label>Address - Compulsory</label>
                            <input required={addressForm.isDifferentShipping} name="shippingStreet" value={addressForm.shippingStreet} onChange={handleAddressFormChange} placeholder="Delivery address" />
                          </div>
                          <div className="co-field co-field--full">
                            <label>Landmark - Optional</label>
                            <input name="shippingArea" value={addressForm.shippingArea} onChange={handleAddressFormChange} placeholder="Optional" />
                          </div>
                          <div className="co-field">
                            <label>Pincode - Compulsory</label>
                            <input required={addressForm.isDifferentShipping} name="shippingPincode" maxLength={6} value={addressForm.shippingPincode} onChange={handleAddressFormChange} placeholder="6-digit pincode" />
                          </div>
                          <div className="co-field">
                            <label>City - Compulsory</label>
                            <input required={addressForm.isDifferentShipping} name="shippingCity" value={addressForm.shippingCity} onChange={handleAddressFormChange} placeholder="City" />
                          </div>
                          <div className="co-field">
                            <label>State - Compulsory</label>
                            <select required={addressForm.isDifferentShipping} name="shippingState" value={addressForm.shippingState} onChange={handleAddressFormChange}>
                              <option value="">Select</option>
                              {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="co-form-footer" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', width: '100%' }}>
                        <button type="button" onClick={() => setIsAddingAddress(false)} className="co-btn-ghost" style={{ padding: '12px 24px' }}>Cancel</button>
                        <button type="submit" disabled={savingAddress || isGstInvalid} className="co-btn-solid" style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 'bold' }}>
                          {savingAddress ? "Saving..." : "👉 Confirm Address & Continue"}
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px dashed #cbd5e1', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontSize: '13px', fontWeight: 600 }}><CheckCircle2 size={16} /> GST Invoice Available</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontSize: '13px', fontWeight: 600 }}><CheckCircle2 size={16} /> Secure Payments (Razorpay)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontSize: '13px', fontWeight: 600 }}><CheckCircle2 size={16} /> Trusted by 1000+ Retailers</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontSize: '13px', fontWeight: 600 }}><CheckCircle2 size={16} /> Fast Dispatch Across India</div>
                      </div>
                    </div>
                  </form>
                ) : selectedAddress ? (
                  <div className="co-addr-display">
                    <div className="co-addr-top">
                      <UserIcon size={15} />
                      <strong>{selectedAddress.shopName || selectedAddress.fullName}</strong>
                      <span className="co-addr-badge">{selectedAddress.type}</span>
                    </div>
                    {selectedAddress.gstNumber && (
                      <p style={{ margin: '5px 0', fontSize: '13px', color: '#475569', fontWeight: 600 }}>GST: {selectedAddress.gstNumber}</p>
                    )}
                    <p className="co-addr-line">{selectedAddress.street}{selectedAddress.area ? `, ${selectedAddress.area}` : ""}</p>
                    <p className="co-addr-line">{selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}</p>
                    <p className="co-addr-line">📞 {selectedAddress.phone}</p>
                    {selectedAddress.isDifferentShipping && (
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
                        <strong style={{ fontSize: '13px', color: '#16a34a' }}>Deliver To (Shipping Address):</strong>
                        <p className="co-addr-line" style={{ marginTop: '5px' }}>{selectedAddress.shippingStreet}{selectedAddress.shippingArea ? `, ${selectedAddress.shippingArea}` : ""}</p>
                        <p className="co-addr-line">{selectedAddress.shippingCity}, {selectedAddress.shippingState} — {selectedAddress.shippingPincode}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="co-addr-empty">
                    <MapPin size={28} strokeWidth={1.5} />
                    <p>No details provided</p>
                    <div className="co-addr-empty-btns">
                      <button className="co-btn-solid" onClick={handleAddAddressClick}><Plus size={14} /> Add Details</button>
                      <button className="co-btn-ghost" onClick={() => navigate("/addresses?select=true")}>Choose Saved</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ PAYMENT SECTION ═══ */}
            <div className="co-card" ref={paymentRef}>
              <div className="co-card-head">
                <div className="co-card-title">
                  <div className="co-card-icon co-card-icon--purple"><CreditCard size={16} /></div>
                  <h2>Payment Method</h2>
                </div>
              </div>
              <div className="co-card-body co-pay-body">
                <div className="co-pay-grid">
                  {isCodEnabled && (
                    <button
                      className={`co-pay-opt ${paymentMode === "COD" ? "co-pay-opt--active" : ""}`}
                      onClick={() => setPaymentMode("COD")}
                      type="button"
                    >
                      <div className="co-pay-opt-icon">
                        <Package size={20} />
                      </div>
                      <div className="co-pay-opt-info">
                        <strong>Cash on Delivery</strong>
                        <span>
                          {codAdvance > 0 && applicableAdvance > 0
                            ? advanceType === "percentage"
                              ? `${codAdvance}% (₹${applicableAdvance.toLocaleString()}) advance required`
                              : `₹${applicableAdvance.toLocaleString()} advance required`
                            : "Pay when you receive"
                          }
                        </span>
                      </div>
                      <div className={`co-pay-radio ${paymentMode === "COD" ? "co-pay-radio--on" : ""}`}>
                        <div className="co-pay-radio-dot" />
                      </div>
                    </button>
                  )}
                  <button
                    className={`co-pay-opt ${paymentMode === "ONLINE" ? "co-pay-opt--active" : ""}`}
                    onClick={() => setPaymentMode("ONLINE")}
                    type="button"
                  >
                    <div className="co-pay-opt-icon co-pay-opt-icon--green">
                      <CreditCard size={20} />
                    </div>
                    <div className="co-pay-opt-info">
                      <strong>Pay Online</strong>
                      <span>UPI · Cards · NetBanking</span>
                    </div>
                    <div className={`co-pay-radio ${paymentMode === "ONLINE" ? "co-pay-radio--on" : ""}`}>
                      <div className="co-pay-radio-dot" />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ ORDER ITEMS ═══ */}
            <div className="co-card">
              <div className="co-card-head">
                <div className="co-card-title">
                  <div className="co-card-icon co-card-icon--orange"><ShoppingBag size={16} /></div>
                  <h2>Order Items ({cartItems.length})</h2>
                </div>
              </div>
              <div className="co-card-body co-items-body">
                {cartItems.map((item: Item) => {
                  const { minQty, innerCount } = getItemValues(item);
                  const itemTotal = (item.quantity || 0) * (item.price || 0) * (item.piecesPerInner || item.innerQty || 1);
                  const imgSrc = getThumbUrl(item.image, IMAGE_BASE_URL);
                  const belowMin = innerCount < minQty;

                  return (
                    <div key={item._id} className={`co-item ${belowMin ? "co-item--warn" : ""}`}>
                      <div className="co-item-img" onClick={() => navigate(`/product/${item._id}`)}>
                        <img src={imgSrc} alt={item.name} />
                      </div>
                      <div className="co-item-info">
                        <h4 onClick={() => navigate(`/product/${item._id}`)}>{item.name}</h4>
                        <div className="co-item-meta">
                          <span className="co-item-qty">{innerCount} inner{innerCount !== 1 ? "s" : ""}</span>
                          {belowMin && <span className="co-item-warn-badge">Min {minQty}</span>}
                        </div>
                        <div className="co-item-prices">
                          <span className="co-item-unit">₹{(item.price || 0).toLocaleString()}/pc</span>
                          <span className="co-item-total">₹{itemTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ STORE POLICIES ═══ */}
            <div className="co-card">
              <div className="co-card-head">
                <div className="co-card-title">
                  <div className="co-card-icon co-card-icon--blue"><FileText size={16} /></div>
                  <h2>Store Policies</h2>
                </div>
              </div>
              <div className="co-card-body co-policies-body">
                <div className="co-policy-acc">
                  <button className="co-policy-toggle" onClick={() => setOpenPolicy(openPolicy === "shipping" ? null : "shipping")} type="button">
                    <span>Shipping & Delivery</span>
                    {openPolicy === "shipping" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openPolicy === "shipping" && (
                    <div className="co-policy-content">
                      <ul>
                        <li><strong>Processing:</strong> 1-2 business days.</li>
                        <li><strong>Metro Cities:</strong> 3-6 Business Days.</li>
                        <li><strong>Other Locations:</strong> 5-9 Business Days.</li>
                      </ul>
                      <Link to="/shipping-delivery" target="_blank" className="co-policy-link">Read Full Policy <ChevronRight size={12} /></Link>
                    </div>
                  )}
                </div>
                <div className="co-policy-divider" />
                <div className="co-policy-acc">
                  <button className="co-policy-toggle" onClick={() => setOpenPolicy(openPolicy === "return" ? null : "return")} type="button">
                    <span>Return & Refund</span>
                    {openPolicy === "return" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openPolicy === "return" && (
                    <div className="co-policy-content">
                      <ul>
                        <li><strong>Eligibility:</strong> Wrong, damaged, or defective items.</li>
                        <li><strong>Timeframe:</strong> Request within 2-4 days of delivery with photo/video proof.</li>
                        <li><strong>Refunds:</strong> Processed within 5-7 working days.</li>
                      </ul>
                      <Link to="/cancellation-refund" target="_blank" className="co-policy-link">Read Full Policy <ChevronRight size={12} /></Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="co-legal-text" style={{ display: 'none' }}>
              By placing your order, you agree to our <br />
              <Link to="/shipping-delivery" target="_blank">Shipping Policy</Link> and{" "}
              <Link to="/cancellation-refund" target="_blank">Return Policy</Link>.
            </div>

            {/* ═══ MOBILE PRICE BREAKDOWN ═══ */}
            <div className="co-mob-summary-card">
              <button className="co-mob-summary-toggle" onClick={() => setMobSummaryOpen(!mobSummaryOpen)} type="button">
                <span>Price Details</span>
                {mobSummaryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {mobSummaryOpen && (
                <div className="co-mob-summary-body">
                  <div className="co-sum-row">
                    <span>Items ({cartItems.length})</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="co-sum-row">
                    <span>Shipping</span>
                    <span className={shippingFee === 0 ? "co-sum-free" : ""}>
                      {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                    </span>
                  </div>
                  {appliedDiscount && (
                    <div className="co-sum-row co-sum-row--discount">
                      <span><Tag size={12} /> Discount ({appliedDiscount.percentage}%)</span>
                      <span>−₹{appliedDiscount.amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="co-sum-divider" />

                  {showCodAdvance ? (
                    <>
                      <div className="co-sum-row co-sum-row--bold">
                        <span>Order Total</span>
                        <span>₹{finalTotalWithDiscount.toLocaleString()}</span>
                      </div>

                      {/* ── Mobile COD Advance Box ── */}
                      <div className="co-mob-cod-box">
                        <div className="co-mob-cod-header">
                          <Info size={14} />
                          <span>COD Advance Payment Required</span>
                        </div>
                        <div className="co-mob-cod-rows">
                          <div className="co-mob-cod-row co-mob-cod-row--advance">
                            <span>⚡ Pay Now (Advance {advanceType === "percentage" ? `${codAdvance}%` : ""})</span>
                            <span>₹{applicableAdvance.toLocaleString()}</span>
                          </div>
                          <div style={{ height: '1px', background: 'rgba(217,119,6,.15)', margin: '4px 0' }} />
                          <div className="co-mob-cod-row co-mob-cod-row--delivery">
                            <span>Pay on Delivery</span>
                            <span>₹{payOnDeliveryAmount.toLocaleString()}</span>
                          </div>
                          <div className="co-mob-cod-note">
                            💡 Pay ₹{applicableAdvance.toLocaleString()} advance now. Rest ₹{payOnDeliveryAmount.toLocaleString()} at delivery.
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="co-sum-row co-sum-row--grand">
                      <span>Total Amount</span>
                      <span>₹{finalTotalWithDiscount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
              
              {(!selectedAddress || isAddingAddress) && (
                <div style={{ padding: '12px 14px', background: '#fff7ed', borderTop: '1px solid #ffedd5', color: '#ea580c', fontSize: '13px', textAlign: 'center', fontWeight: 600 }}>
                  ⚠ Please add your address to continue
                </div>
              )}
            </div>
          </div>

          {/* ═══ DESKTOP SUMMARY SIDEBAR — REDESIGNED ═══ */}
          <div className="co-sidebar">
            <div className="co-sidebar-inner">
              <h3 className="co-sidebar-title">
                <ShoppingBag size={18} />
                Order Summary
              </h3>

              {/* Payment Method Tag */}
              <div className={`co-side-pay-method ${paymentMode === "ONLINE" ? "co-side-pay-method--online" : "co-side-pay-method--cod"}`}>
                {paymentMode === "ONLINE" ? <CreditCard size={16} /> : <Package size={16} />}
                <span>{paymentMode === "ONLINE" ? "Pay Online (Full Payment)" : "Cash on Delivery"}</span>
              </div>

              <div className="co-side-rows">
                <div className="co-side-row">
                  <span>Items Total ({cartItems.length})</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="co-side-row">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? "co-side-free" : ""}>
                    {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                  </span>
                </div>
                {appliedDiscount && (
                  <div className="co-side-row co-side-row--discount">
                    <span><Tag size={13} /> Discount ({appliedDiscount.percentage}%)</span>
                    <span>−₹{appliedDiscount.amount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="co-side-divider" />

              {/* ── Grand Total ── */}
              <div className="co-side-grand">
                <span>Order Total</span>
                <span>₹{finalTotalWithDiscount.toLocaleString()}</span>
              </div>

              {/* ── COD Advance Payment Box — PROMINENT, shown BEFORE button ── */}
              {showCodAdvance && (
                <div className="co-side-cod-box">
                  <div className="co-side-cod-header">
                    <div className="co-side-cod-header-icon">
                      <Info size={14} />
                    </div>
                    <div className="co-side-cod-header-text">
                      <strong>COD Advance Required</strong>
                      <span>Pay advance to confirm your order</span>
                    </div>
                  </div>
                  <div className="co-side-cod-rows">
                    <div className="co-side-cod-row co-side-cod-row--advance">
                      <span>⚡ Advance Now {advanceType === "percentage" ? `(${codAdvance}%)` : ""}</span>
                      <span>₹{applicableAdvance.toLocaleString()}</span>
                    </div>
                    <div className="co-side-cod-divider" />
                    <div className="co-side-cod-row co-side-cod-row--delivery">
                      <span>Pay on Delivery</span>
                      <span>₹{payOnDeliveryAmount.toLocaleString()}</span>
                    </div>
                    <div className="co-side-cod-note">
                      <Info size={12} />
                      <span>Pay ₹{applicableAdvance.toLocaleString()} advance now. Remaining ₹{payOnDeliveryAmount.toLocaleString()} will be collected when the product is delivered to you.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Place Order Button ── */}
              <div className="co-place-btn-wrap">
                <button
                  className={`co-place-btn ${placing ? "co-place-btn--loading" : ""} ${showCodAdvance ? "co-place-btn--cod-advance" : ""}`}
                  onClick={handlePlaceOrder}
                  disabled={placing || !cartItems.length || !selectedAddress || !allItemsMeetMinQty || isAddingAddress}
                >
                  {placing ? (
                    <><span className="co-spinner" /> Processing...</>
                  ) : (
                    <>
                      <Shield size={16} />
                      {getButtonText()}
                    </>
                  )}
                </button>
                {showCodAdvance && (
                  <p className="co-place-btn-sub">
                    Remaining ₹{payOnDeliveryAmount.toLocaleString()} payable at delivery
                  </p>
                )}
              </div>

              {(!selectedAddress || isAddingAddress) && (
                <p className="co-side-warn" style={{ color: '#ea580c', fontSize: '13px', textAlign: 'center', margin: '0 20px 14px', fontWeight: 600 }}>
                  ⚠ Please add your address to continue
                </p>
              )}

              <div className="co-side-trust">
                <span>🔒 Secure Checkout</span>
                <span>🛡️ Safe Payments</span>
                <span>✓ Genuine Products</span>
              </div>

              <div className="co-legal-text">
                By placing your order, you agree to our <br />
                <Link to="/shipping-delivery" target="_blank">Shipping Policy</Link> and{" "}
                <Link to="/cancellation-refund" target="_blank">Return Policy</Link>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM BAR ═══ */}
      {!orderPlaced && cartItems.length > 0 && (
        <div className="co-bottom-bar">
          <div className="co-bottom-left">
            <div className="co-bottom-price">
              {showCodAdvance ? `₹${applicableAdvance.toLocaleString()}` : `₹${finalTotalWithDiscount.toLocaleString()}`}
            </div>
            <div className="co-bottom-detail">
              {showCodAdvance && (
                <>
                  <span className="co-bottom-adv">Advance Now</span>
                  <span style={{ fontSize: '10px', color: 'var(--co-muted)' }}>
                    | ₹{payOnDeliveryAmount.toLocaleString()} later
                  </span>
                </>
              )}
              {!showCodAdvance && shippingFee === 0 && <span className="co-bottom-free">Free Delivery</span>}
              {appliedDiscount && <span className="co-bottom-save">Save ₹{discountAmt}</span>}
            </div>
          </div>
          <button
            className={`co-bottom-btn ${placing ? "co-bottom-btn--busy" : ""} ${showCodAdvance ? "co-bottom-btn--cod-advance" : ""}`}
            onClick={handlePlaceOrder}
            disabled={placing || !cartItems.length || !selectedAddress || !allItemsMeetMinQty || isAddingAddress}
          >
            {placing ? (
              <><span className="co-bottom-spin" /> Wait...</>
            ) : (
              <>
                {showCodAdvance ? `Pay ₹${applicableAdvance.toLocaleString()}` : paymentMode === "COD" ? "Place Order" : "Pay Now"}
                <ChevronRight size={16} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};

export default Checkout;