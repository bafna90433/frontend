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
import { ThemeProvider } from "./context/ThemeContext";

// ✅ Shop hook
import { useShop } from "./context/ShopContext";

// ✅ Center Modal
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

const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const user = localStorage.getItem("user");

  // ✅ From YOUR ShopContext (already exists in your context)
  const { cartTotal, freeShippingThreshold } = useShop();

  const publicPaths = [
    "/",
    "/products",
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
      {/* ✅ Center Popup (not top bar) */}
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
  return (
    <ShopProvider>
      <ThemeProvider>
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

              {/* 🛍️ Public App Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetails />} />

              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />

              {/* 🔒 Protected Pages */}
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
      </ThemeProvider>
    </ShopProvider>
  );
};

export default App;
