// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ShopProvider } from "./context/ShopContext";

import Header from "./components/Header";
import Home from "./components/Home";
import ProductDetails from "./components/ProductDetails";
import Cart from "./components/Cart";
import Wishlist from "./components/Wishlist";
import Checkout from "./components/Checkout";
import BottomNav from "./components/BottomNav";
import BackFooter from "./components/BackFooter";

import Register from "./components/Register";
import MyAccount from "./components/MyAccount";
import LoginOTP from "./components/LoginOTP";
import EditProfile from "./components/EditProfile";
import Orders from "./components/Orders";
import ProtectedRoute from "./components/ProtectedRoute";
import Products from "./components/Products";
import WhatsAppButton from "./components/WhatsAppButton";
import ManageAddresses from "./components/ManageAddresses";

// ✅ Wrapper for auth check
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const user = localStorage.getItem("user");

  const isAuthPage = location.pathname === "/register" || location.pathname === "/login";

  // Agar user login nahi hai to hamesha register pe bhejna
  if (!user && !isAuthPage) {
    return <Navigate to="/register" replace />;
  }

  return (
    <>
      {/* ✅ Header sirf login hone ke baad show hoga */}
      {user && <Header />}
      <main style={{ paddingBottom: user ? "60px" : "0" }}>{children}</main>
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
            {/* Auth pages → Always open */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<LoginOTP />} />

            {/* Normal pages → Only when logged in */}
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutWrapper>
      </Router>
    </ShopProvider>
  );
};

export default App;