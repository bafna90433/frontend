import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import axios from "axios";

// ✅ API Base URL
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Types
type Product = {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  innerQty?: number;
  bulkPricing?: { inner: number; qty: number; price: number }[];
  [key: string]: any;
};

type CartItem = Product & { quantity: number; image?: string };

interface ShopContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  setCartItemQuantity: (product: Product, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;

  // ✅ New Shipping & Total Fields
  shippingFee: number;
  freeShippingThreshold: number;
  cartTotal: number;  // Subtotal (Product Price * Qty)
  finalTotal: number; // Subtotal + Shipping
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  // --- Cart State ---
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });


  // --- Shipping Rules State ---
  const [shippingCharge, setShippingCharge] = useState(0);
  const [freeThreshold, setFreeThreshold] = useState(0);

  // ✅ 1. Fetch Shipping Rules from Backend on Load
  useEffect(() => {
    const fetchShippingRules = async () => {
      try {
        const res = await axios.get(`${API_BASE}/settings/shipping`);
        if (res.data) {
          setShippingCharge(res.data.shippingCharge || 0);
          setFreeThreshold(res.data.freeShippingThreshold || 0);
        }
      } catch (err) {
        console.error("Error fetching shipping rules:", err);
      }
    };
    fetchShippingRules();
  }, []);

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ ABANDONED CART SYNC: push snapshot to backend (debounced 2s)
  // Only runs for logged-in users (token present). Fails silently on error
  // so cart UX never breaks.
  const abandonSyncTimer = useRef<number | null>(null);
  const abandonFirstRun = useRef(true);
  useEffect(() => {
    // Skip the very first render — avoids double-sync on page load
    if (abandonFirstRun.current) {
      abandonFirstRun.current = false;
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return; // guest — nothing to sync

    if (abandonSyncTimer.current) {
      window.clearTimeout(abandonSyncTimer.current);
    }
    abandonSyncTimer.current = window.setTimeout(() => {
      const payload = {
        items: cartItems.map((it) => ({
          productId: it._id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          image: it.image || it.images?.[0] || "",
          slug: (it as any).slug || "",
        })),
      };
      axios
        .post(`${API_BASE}/abandoned-cart/sync`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {
          /* silent — never break UX */
        });
    }, 2000);

    return () => {
      if (abandonSyncTimer.current) {
        window.clearTimeout(abandonSyncTimer.current);
      }
    };
  }, [cartItems]);


  // --- Cart Actions ---
  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item._id === product._id);
      if (idx !== -1) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          image: product.images?.[0] || "", // ✅ Store image explicitly
          quantity,
        },
      ];
    });
  };

  const setCartItemQuantity = (product: Product, quantity: number) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item._id !== product._id);
      }
      const idx = prev.findIndex((item) => item._id === product._id);
      if (idx !== -1) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity } : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          image: product.images?.[0] || "",
          quantity,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };


  // --- Calculations ---
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // ✅ Calculate Totals
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Logic: If cart empty or total > threshold, shipping is 0. Else, apply charge.
  const shippingFee = (cartItems.length === 0 || cartTotal >= freeThreshold) ? 0 : shippingCharge;
  
  const finalTotal = cartTotal + shippingFee;

  return (
    <ShopContext.Provider
      value={{
        cartItems,
        addToCart,
        setCartItemQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        
        // ✅ Exposed Values
        shippingFee,
        freeShippingThreshold: freeThreshold,
        cartTotal,
        finalTotal,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
};