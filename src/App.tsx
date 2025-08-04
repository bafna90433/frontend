import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Home from './components/Home';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import Checkout from './components/Checkout';
import Register from './components/Register';
import BottomNav from './components/BottomNav'; // नया Bottom Sticky Menu
import { ShopProvider } from './context/ShopContext';

const App = () => (
  <ShopProvider>
    <Router>
      <Header />
      <main style={{ paddingBottom: '60px' }}> {/* paddingBottom ताकि BottomNav overlap न करे */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/register" element={<Register />} />
          {/* ध्यान दें: /categories और /orders रूट अगर हैं तो Routes में भी एड करें */}
          <Route path="/categories" element={<Home />} /> {/* या Categories Component */}
          <Route path="/orders" element={<Home />} /> {/* या Orders Component */}
          <Route path="/account" element={<Home />} /> {/* या Account Component */}
        </Routes>
      </main>
      <BottomNav />
    </Router>
  </ShopProvider>
);

export default App;
