// src/App.tsx
import React, { useEffect, useState, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import api from "./utils/api";
import { io } from "socket.io-client";
import axios from "axios";

import { ShopProvider, useShop } from "./context/ShopContext";
import { ThemeProvider } from "./context/ThemeContext";

// --- STATIC COMPONENTS (Important for First Paint) ---
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import BackFooter from "./components/BackFooter";
import WhatsAppButton from "./components/WhatsAppButton";
import FreeDeliveryModal from "./components/FreeDeliveryModal";
import ComingSoon from "./components/ComingSoon";

// --- LAZY LOADED PAGES (Improves Initial Load Speed) ---
const Home = React.lazy(() => import("./components/Home"));
const Products = React.lazy(() => import("./components/Products"));
const ProductDetails = React.lazy(() => import("./components/ProductDetails"));
const Cart = React.lazy(() => import("./components/Cart"));
const Wishlist = React.lazy(() => import("./components/Wishlist"));
const Checkout = React.lazy(() => import("./components/Checkout"));
const HotDealsPage = React.lazy(() => import("./pages/HotDealsPage"));
const Register = React.lazy(() => import("./components/Register"));
const LoginOTP = React.lazy(() => import("./components/LoginOTP"));
const MyAccount = React.lazy(() => import("./components/MyAccount"));
const EditProfile = React.lazy(() => import("./components/EditProfile"));
const Orders = React.lazy(() => import("./components/Orders"));
const ManageAddresses = React.lazy(() => import("./components/ManageAddresses"));
const PrivacyPolicy = React.lazy(() => import("./components/PrivacyPolicy"));
const TermsConditions = React.lazy(() => import("./components/TermsConditions"));
const ShippingDelivery = React.lazy(() => import("./components/ShippingDelivery"));
const CancellationRefund = React.lazy(() => import("./components/CancellationRefund"));
const ProtectedRoute = React.lazy(() => import("./components/ProtectedRoute")); // Lazy load wrapper too

// --- CONFIGURATION ---
const SOCKET_URL = "https://bafnatoys-backend-production.up.railway.app";
const API_BASE_URL = "https://bafnatoys-backend-production.up.railway.app/api";

// --- LOADER COMPONENT ---
const PageLoader = () => (
  <div
    style={{
      height: "60vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      gap: "15px",
    }}
  >
    <div
      className="loader"
      style={{
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #3498db",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        animation: "spin 1s linear infinite",
      }}
    ></div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

// --- LAYOUT WRAPPER ---
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
        {/* Suspense handles the loading state while lazy chunk is fetched */}
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>

      <WhatsAppButton />
      <BottomNav />
      <BackFooter />
    </>
  );
};

const AppInner: React.FC = () => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);

  // 1. MAINTENANCE CHECK (Optimized)
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/settings/maintenance`);
        const isLocal =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        if (res.data && res.data.enabled && !isLocal) {
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

  // 2. ANALYTICS & SOCKET (Deferred Load)
  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;

    const initAnalyticsAndSocket = async () => {
      try {
        if (!sessionStorage.getItem("visited")) {
          await api.post("/analytics/track");
          sessionStorage.setItem("visited", "true");
        }
      } catch (e) {
        console.error(e);
      }

      // Connect Socket AFTER initial render to unblock main thread
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });
    };

    // Small delay to prioritize UI painting
    const timer = setTimeout(initAnalyticsAndSocket, 1500);

    return () => {
      clearTimeout(timer);
      if (socket) socket.disconnect();
    };
  }, []);

  if (loadingCheck) return <PageLoader />;
  if (isMaintenance) return <ComingSoon />;

  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/hot-deals" element={<HotDealsPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<LoginOTP />} />

          {/* Legal Routes */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/shipping-delivery" element={<ShippingDelivery />} />
          <Route
            path="/cancellation-refund"
            element={<CancellationRefund />}
          />

          {/* Protected Routes */}
          <Route
            path="/checkout"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="/my-account"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute>
                  <MyAccount />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="/orders"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="/addresses"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute>
                  <ManageAddresses />
                </ProtectedRoute>
              </Suspense>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ShopProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </ShopProvider>
  );
};

export default App;
