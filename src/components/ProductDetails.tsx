// src/components/ProductDetails.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/ProductDetails.css';
import BulkPricingTable, { Tier } from './BulkPricingTable';
import { FiShoppingCart } from 'react-icons/fi';
import { FaBoxOpen, FaTag } from 'react-icons/fa';
import { useShop } from '../context/ShopContext';
import FloatingCheckoutButton from '../components/FloatingCheckoutButton';
import { getImageUrl } from '../utils/image';

interface BulkTier {
  inner: string;
  qty: number;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  image?: string;
  images?: string[];
  price: number;
  bulkPricing: BulkTier[];
  description?: string;
  innerQty?: number;
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  // Swipe detection
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { cartItems, addToCart, setCartItemQuantity, removeFromCart } = useShop();
  const navigate = useNavigate();

  // ✅ user approval check
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isApproved = user?.isApproved;

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setSelectedImage(0);

    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error('Failed loading product', err);
        setError('Failed to load product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!product?.images || product.images.length <= 1) return;
    const diffX = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50;
    if (Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0) {
        setSelectedImage(prev => prev === product.images!.length - 1 ? 0 : prev + 1);
      } else {
        setSelectedImage(prev => prev === 0 ? product.images!.length - 1 : prev - 1);
      }
    }
  };

  if (loading) return <div className="loading-container"><p>Loading product details…</p></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return <div className="error-message">Product not found</div>;

  const productInCart = cartItems.find((item) => item._id === product._id);

  // ✅ Image resolver
  let baseImage = '';
  if (product.images && product.images.length > 0) {
    baseImage = product.images[selectedImage] || product.image || '';
  } else {
    baseImage = product.image || '';
  }
  const imageUrl = getImageUrl(baseImage);

  // Bulk pricing logic
  const sortedTiers = Array.isArray(product.bulkPricing)
    ? [...product.bulkPricing].sort((a, b) => parseInt(a.inner) - parseInt(b.inner))
    : [];

  const activeTier =
    sortedTiers.length > 0
      ? sortedTiers.reduce(
          (prev, tier) =>
            (productInCart?.quantity || quantity) >= parseInt(tier.inner) ? tier : prev,
          sortedTiers[0]
        )
      : undefined;

  const piecesPerInner =
    product.innerQty && product.innerQty > 0
      ? product.innerQty
      : sortedTiers.length > 0 && parseInt(sortedTiers[0].inner) > 0
      ? sortedTiers[0].qty / parseInt(sortedTiers[0].inner)
      : 1;

  const unitPrice = activeTier ? activeTier.price : product.price;

  const tiersForTable: Tier[] = sortedTiers.map((t) => ({
    inner: parseInt(t.inner),
    price: t.price,
    qty: t.qty,
  }));

  const handleSelectImage = (index: number) => {
    setSelectedImage(index);
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="product-details-container">
        {/* Product Gallery */}
        <div className="product-gallery">
          <div
            className="main-image-container"
            ref={imageContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img src={imageUrl} alt={product.name} className="main-image" />

            {isApproved && product.price && (
              <div className="discount-badge">
                <FaTag className="discount-icon" />
                ₹{unitPrice.toFixed(2)}
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="thumbnail-container">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  alt={`${product.name} thumbnail ${i + 1}`}
                  className={`thumbnail ${selectedImage === i ? 'active' : ''}`}
                  onClick={() => handleSelectImage(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-header">
            <h1 className="product-title">{product.name}</h1>
            <div className="price-section">
              {isApproved ? (
                <span className="current-price">₹{unitPrice.toFixed(2)}</span>
              ) : (
                <span className="locked-message">🔒 Price visible after admin approval</span>
              )}
            </div>
          </div>

          {/* Bulk Pricing */}
          <div className="bulk-pricing-section">
            <div className="section-header">
              <h3 className="section-title">📊 Bulk Pricing</h3>
              <div className="pieces-info">
                <FaBoxOpen className="box-icon" />
                {piecesPerInner} pieces per inner
              </div>
            </div>

            {isApproved ? (
              tiersForTable.length > 0 ? (
                <div className="table-responsive">
                  <BulkPricingTable
                    innerQty={piecesPerInner}
                    tiers={tiersForTable}
                    selectedInner={productInCart?.quantity || quantity}
                  />
                </div>
              ) : (
                <div className="no-bulk-pricing">No bulk pricing tiers available.</div>
              )
            ) : (
              <p className="locked-message">🔒 Bulk pricing available after admin approval</p>
            )}
          </div>

          {/* Quantity Section */}
          {isApproved && (
            <div className="quantity-section">
              <h3 className="section-title">🔢 Quantity (Inners)</h3>
              {productInCart ? (
                <div className="quantity-controls">
                  <button
                    onClick={() => {
                      const newQty = productInCart.quantity - 1;
                      if (newQty <= 0) {
                        removeFromCart(product._id);
                      } else {
                        setCartItemQuantity(productInCart, newQty);
                      }
                    }}
                    className="quantity-button"
                  >
                    −
                  </button>
                  <span className="quantity-display">{productInCart.quantity}</span>
                  <button
                    onClick={() =>
                      setCartItemQuantity(productInCart, productInCart.quantity + 1)
                    }
                    className="quantity-button"
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="action-buttons-row">
                  <button
                    className="add-to-cart-button"
                    onClick={() => {
                      addToCart(
                        {
                          ...product,
                          bulkPricing: product.bulkPricing.map((t) => ({
                            inner: parseInt(t.inner),
                            qty: t.qty,
                            price: t.price,
                          })),
                        },
                        quantity
                      );
                    }}
                  >
                    <FiShoppingCart className="cart-icon" />
                    Add to Cart
                  </button>
                  <button
                    className="buy-now-button"
                    onClick={() => {
                      addToCart(
                        {
                          ...product,
                          bulkPricing: product.bulkPricing.map((t) => ({
                            inner: parseInt(t.inner),
                            qty: t.qty,
                            price: t.price,
                          })),
                        },
                        quantity
                      );
                      navigate('/cart');
                    }}
                  >
                    🛒 Buy Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Product Description */}
          {product.description && (
            <div className="description-section" style={{ marginTop: '1.5rem' }}>
              <div className="section-header">
                <h3 className="section-title">📋 Product Description</h3>
              </div>
              <div className="description-content expanded">
                <ul className="description-list">
                  {product.description
                    .split('\n')
                    .filter((line) => line.trim() !== '')
                    .map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 84 }} />
      <FloatingCheckoutButton />
    </>
  );
};

export default ProductDetails;
