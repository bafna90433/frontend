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
import ComingSoon from "./components/ComingSoon";
// We make Products static to improve LCP on the home page.
import Products from "./components/Products"; 

// --- LAZY LOADED COMPONENTS (Non-critical) ---
const WhatsAppButton = React.lazy(() => import("./components/WhatsAppButton"));
const FreeDeliveryModal = React.lazy(() => import("./components/FreeDeliveryModal"));
const NoInternet = React.lazy(() => import("./components/NoInternet"));
const Chatbot = React.lazy(() => import("./components/Chatbot")); // ✅ Added Chatbot
const MetaPixelLoader = React.lazy(() => import("./components/MetaPixelLoader"));

// --- LAZY LOADED PAGES ---
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
const OrderDetails = React.lazy(() => import("./components/OrderDetails"));
const ManageAddresses = React.lazy(() => import("./components/ManageAddresses"));
const PrivacyPolicy = React.lazy(() => import("./components/PrivacyPolicy"));
const TermsConditions = React.lazy(() => import("./components/TermsConditions"));
const ShippingDelivery = React.lazy(() => import("./components/ShippingDelivery"));
const CancellationRefund = React.lazy(() => import("./components/CancellationRefund"));
const ProtectedRoute = React.lazy(() => import("./components/ProtectedRoute"));
const PendingReviews = React.lazy(() => import("./pages/PendingReviews"));
const FAQ = React.lazy(() => import("./components/FAQ"));

// --- CONFIGURATION ---
const SOCKET_URL: string =
  (import.meta as any).env?.VITE_SOCKET_URL ||
  "https://api.bafnatoys.com";

const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://api.bafnatoys.com/api";

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
    />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

// --- PAGE TRACKER (Deferred) ---
const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Run tracking only when the browser is idle to not block main thread
    if (!navigator.onLine) return;
    
    const trackPage = async () => {
      try {
        await api.post("/analytics/track", {
          path: location.pathname,
          referrer: document.referrer,
        });
      } catch (error) {
        console.error("Analytics Error:", error);
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(trackPage);
    } else {
      setTimeout(trackPage, 2000);
    }
  }, [location]);

  return null;
};

// --- LAYOUT WRAPPER ---
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
    "/faq",
  ];

  const isPublicPage =
    publicPaths.includes(location.pathname) ||
    location.pathname.startsWith("/product/");

  if (!user && !isPublicPage) {
    return <Navigate to="/register" replace />;
  }

  return (
    <>
      <Header />
      <main 
        style={{ 
          paddingBottom: "60px", 
          minHeight: "100vh", 
          display: "flex", 
          flexDirection: "column", 
          flexGrow: 1, 
          position: "relative" 
        }}
      >
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>

      {/* Non-critical elements lazy loaded */}
      <Suspense fallback={null}>
        <FreeDeliveryModal cartTotal={cartTotal} limit={freeShippingThreshold} />
        <WhatsAppButton />
        <Chatbot /> {/* ✅ Added Chatbot here */}
        <BottomNav />
      </Suspense>
    </>
  );
};

const AppInner: React.FC = () => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);

  // Maintenance Check
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

  // Socket Connection (Deferred)
  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;
    
    // Connect socket later so it doesn't interrupt page load
    const timer = setTimeout(() => {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (socket) socket.disconnect();
    };
  }, []);

  if (loadingCheck) return <PageLoader />;
  if (isMaintenance) return <ComingSoon />;

  return (
    <Router>
      <Suspense fallback={null}>
         <NoInternet />
         <MetaPixelLoader />
      </Suspense>
      <PageTracker />

      <Routes>
        <Route path="/*" element={
          <LayoutWrapper>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Products />} />
              <Route path="/products" element={<Navigate to="/" replace />} />
              
              <Route path="/hot-deals" element={<HotDealsPage />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />

              {/* Auth Routes */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<LoginOTP />} />

              {/* Legal & Info Routes */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/shipping-delivery" element={<ShippingDelivery />} />
              <Route path="/cancellation-refund" element={<CancellationRefund />} />
              <Route path="/faq" element={<FAQ />} />

              {/* Protected Routes */}
              <Route
                path="/checkout"
                element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                }
              />
              <Route
                path="/my-account"
                element={
                    <ProtectedRoute>
                      <MyAccount />
                    </ProtectedRoute>
                }
              />
              <Route
                path="/edit-profile"
                element={
                    <ProtectedRoute>
                      <EditProfile />
                    </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:orderId"
                element={
                    <ProtectedRoute>
                      <OrderDetails />
                    </ProtectedRoute>
                }
              />
              <Route
                path="/addresses"
                element={
                    <ProtectedRoute>
                      <ManageAddresses />
                    </ProtectedRoute>
                }
              />
              <Route
                path="/pending-reviews"
                element={
                    <ProtectedRoute>
                      <PendingReviews />
                    </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LayoutWrapper>
        } />
      </Routes>
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