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

// ✅ Razorpay Required Legal Pages
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

  // ✅ 1. Pages jo BINA LOGIN ke dikhni chahiye (Home, Products, etc.)
  const publicPaths = [
    "/",                // Home ab public hai
    "/products",        // Products browsing public hai
    "/register",
    "/login",
    "/privacy-policy",
    "/terms-conditions",
    "/shipping-delivery",
    "/cancellation-refund",
  ];

  // Check karein ki kya current path public list mein hai
  // OR agar path "/product/" se shuru hota hai (Dynamic details page)
  const isPublicPage = 
    publicPaths.includes(location.pathname) || 
    location.pathname.startsWith("/product/");

  // ❌ 2. Redirect Logic: Sirf tab redirect karo agar page public nahi hai aur user login nahi hai
  // (Jaise: Checkout, My Account, Orders)
  if (!user && !isPublicPage) {
    return <Navigate to="/register" replace />;
  }

  return (
    <>
      {/* ✅ Header sabko dikhna chahiye taaki wo navigate kar sakein */}
      <Header />

      <main style={{ paddingBottom: "60px" }}>
        {children}
      </main>

      {/* ✅ Footer / BottomNav bhi sabko dikhna chahiye */}
      <BottomNav />
      <BackFooter />
      <WhatsAppButton />
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

            {/* 📜 Legal Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/shipping-delivery" element={<ShippingDelivery />} />
            <Route path="/cancellation-refund" element={<CancellationRefund />} />

            {/* 🛍️ Public App Pages (Ab bina login ke dikhenge) */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            
            {/* ⚠️ Cart logic: Agar aap chahte hain cart sirf login wale dekhe, toh isse Protected mein daal de */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />

            {/* 🔒 Protected Pages (Login Zaroori Hai) */}
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