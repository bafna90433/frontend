import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import api from "./utils/api";
import { io } from "socket.io-client";
import axios from "axios"; // ✅ Make sure axios is imported

import { ShopProvider } from "./context/ShopContext";
import { ThemeProvider } from "./context/ThemeContext";

// Shop hook
import { useShop } from "./context/ShopContext";

// ✅ Import Coming Soon Component
import ComingSoon from "./components/ComingSoon";

// Center Modal
import FreeDeliveryModal from "./components/FreeDeliveryModal";

// Layout Components
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import BackFooter from "./components/BackFooter";
import WhatsAppButton from "./components/WhatsAppButton";

// Pages / Components
import Home from "./components/Home";
import Products from "./components/Products";
import ProductDetails from "./components/ProductDetails";
import Cart from "./components/Cart";
import Wishlist from "./components/Wishlist";
import Checkout from "./components/Checkout";

import HotDealsPage from "./pages/HotDealsPage";

import Register from "./components/Register";
import LoginOTP from "./components/LoginOTP";
import MyAccount from "./components/MyAccount";
import EditProfile from "./components/EditProfile";
import Orders from "./components/Orders";
import ManageAddresses from "./components/ManageAddresses";
import ProtectedRoute from "./components/ProtectedRoute";

// Legal Pages
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsConditions from "./components/TermsConditions";
import ShippingDelivery from "./components/ShippingDelivery";
import CancellationRefund from "./components/CancellationRefund";

// --- SOCKET CONFIGURATION ---
const SOCKET_URL = "https://bafnatoys-backend-production.up.railway.app";
// --- API BASE URL FOR MAINTENANCE CHECK ---
const API_BASE_URL = "https://bafnatoys-backend-production.up.railway.app/api";

const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const user = localStorage.getItem("user");

  const { cartTotal, freeShippingThreshold } = useShop();

  const publicPaths = [
    "/",
    "/products",
    "/hot-deals",
    "/register",
    "/login",
    "/privacy-policy",
    "/terms-conditions",
    "/shipping-delivery",
    "/cancellation-refund",
  ];

  const isPublicPage =
    publicPaths.includes(location.pathname) ||
    location.pathname.startsWith("/product/");

  if (!user && !isPublicPage) {
    return <Navigate to="/register" replace />;
  }

  return (
    <>
      <FreeDeliveryModal cartTotal={cartTotal} limit={freeShippingThreshold} />
      <Header />
      <main style={{ paddingBottom: "60px", minHeight: "80vh" }}>
        {children}
      </main>
      <WhatsAppButton />
      <BottomNav />
      <BackFooter />
    </>
  );
};

const App: React.FC = () => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);

  // ✅ CHECK MAINTENANCE MODE ON LOAD
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/settings/maintenance`);
        if (res.data && res.data.enabled) {
          setIsMaintenance(true);
        }
      } catch (error) {
        console.error("Maintenance check failed", error);
      } finally {
        setLoadingCheck(false);
      }
    };
    checkMaintenance();
  }, []);

  // VISITOR TRACKING & SOCKET LOGIC
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        const hasVisited = sessionStorage.getItem("visited");
        if (!hasVisited) {
          await api.post("/analytics/track");
          sessionStorage.setItem("visited", "true");
        }
      } catch (e) {
        console.error("Visitor tracking failed", e);
      }
    };
    trackVisitor();

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true
    });

    socket.on("connect", () => {
      // console.log("Connected to Real-time analytics server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loadingCheck) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Loading...
      </div>
    );
  }

  // 🔴 BLOCK ACCESS IF MAINTENANCE IS ON
  if (isMaintenance) {
    return <ComingSoon />;
  }

  return (
    <ShopProvider>
      <ThemeProvider>
        <Router>
          <LayoutWrapper>
            <Routes>
              {/* 🔐 Auth Pages */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<LoginOTP />} />

              {/* 🛍️ Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/hot-deals" element={<HotDealsPage />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />

              {/* 📜 Legal Pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/shipping-delivery" element={<ShippingDelivery />} />
              <Route path="/cancellation-refund" element={<CancellationRefund />} />

              {/* 🔒 Protected Pages */}
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/my-account" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
              <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/addresses" element={<ProtectedRoute><ManageAddresses /></ProtectedRoute>} />

              {/* 🔁 Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LayoutWrapper>
        </Router>
      </ThemeProvider>
    </ShopProvider>
  );
};

export default App;