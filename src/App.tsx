// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ShopProvider } from "./context/ShopContext";

import Header from "./components/Header";
import Home from "./components/Home";
import ProductDetails from "./components/ProductDetails";
import Cart from "./components/Cart";
import Wishlist from "./components/Wishlist";
import Checkout from "./components/Checkout";
import BottomNav from "./components/BottomNav";

// auth / account
import { Register } from "./components/Register";
import MyAccount from "./components/MyAccount";
import LoginOTP from "./components/LoginOTP";
import EditProfile from "./components/EditProfile";
import Orders from "./components/Orders";
import ProtectedRoute from "./components/ProtectedRoute";

// products listing / search results
import Products from "./components/Products"; // ⬅️ added

// floating WhatsApp
import WhatsAppButton from "./components/WhatsAppButton";

// Manage addresses
import ManageAddresses from "./components/ManageAddresses";

const App: React.FC = () => {
  return (
    <ShopProvider>
      <Router>
        <Header />

        {/* leave bottom padding so content doesn't sit under BottomNav */}
        <main style={{ paddingBottom: "60px" }}>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* products */}
            <Route path="/products" element={<Products />} /> {/* ⬅️ added */}
            <Route path="/product/:id" element={<ProductDetails />} />

            {/* cart / checkout */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* auth */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<LoginOTP />} />

            {/* protected */}
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

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav />
        <WhatsAppButton />
      </Router>
    </ShopProvider>
  );
};

export default App;
