// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ShopProvider } from "./context/ShopContext";

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

import Register from "./components/Register";
import LoginOTP from "./components/LoginOTP";
import MyAccount from "./components/MyAccount";
import EditProfile from "./components/EditProfile";
import Orders from "./components/Orders";
import ManageAddresses from "./components/ManageAddresses";
import ProtectedRoute from "./components/ProtectedRoute";

// ✅ Razorpay Required Legal Pages (ALL are in components folder)
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsConditions from "./components/TermsConditions";
import ShippingDelivery from "./components/ShippingDelivery";
import CancellationRefund from "./components/CancellationRefund";

// ✅ Wrapper for auth + layout handling
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const user = localStorage.getItem("user");

  // ✅ Pages that should be accessible WITHOUT login
  const publicPaths = [
    "/register",
    "/login",
    "/privacy-policy",
    "/terms-conditions",
    "/shipping-delivery",
    "/cancellation-refund",
  ];

  const isPublicPage = publicPaths.includes(location.pathname);

  // ❌ Agar login nahi hai aur public page nahi hai → register
  if (!user && !isPublicPage) {
    return <Navigate to="/register" replace />;
  }

  return (
    <>
      {/* Header sirf login ke baad */}
      {user && <Header />}

      <main style={{ paddingBottom: user ? "60px" : "0" }}>
        {children}
      </main>

      {/* Footer / BottomNav sirf login ke baad */}
      {user && (
        <>
          <BottomNav />
          <BackFooter />
          <WhatsAppButton />
        </>
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ShopProvider>
      <Router>
        <LayoutWrapper>
          <Routes>
            {/* 🔐 Auth Pages */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<LoginOTP />} />

            {/* 📜 Legal / Razorpay Mandatory Pages (Public) */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/shipping-delivery" element={<ShippingDelivery />} />
            <Route
              path="/cancellation-refund"
              element={<CancellationRefund />}
            />

            {/* 🛍️ App Pages (Login required) */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />

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
              path="/addresses"
              element={
                <ProtectedRoute>
                  <ManageAddresses />
                </ProtectedRoute>
              }
            />

            {/* 🔁 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutWrapper>
      </Router>
    </ShopProvider>
  );
};

export default App;
