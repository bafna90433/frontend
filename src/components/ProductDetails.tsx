import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/ProductDetails.css';
import BulkPricingTable, { Tier } from './BulkPricingTable';
import { FiChevronDown, FiChevronUp, FiShoppingCart } from 'react-icons/fi';
import { FaPercentage, FaBoxOpen, FaTag } from 'react-icons/fa';
import { useShop } from '../context/ShopContext';

// ✅ floating checkout button
import FloatingCheckoutButton from '../components/FloatingCheckoutButton';

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
  const [expandedDescription, setExpandedDescription] = useState(false);

  const { cartItems, addToCart, setCartItemQuantity, removeFromCart } = useShop();
  const navigate = useNavigate();

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

  if (loading)
    return (
      <div className="loading-container">
        <p>Loading product details…</p>
      </div>
    );
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return <div className="error-message">Product not found</div>;

  const productInCart = cartItems.find((item) => item._id === product._id);

  // Robust image code
  let baseImage = '';
  if (product.images && product.images.length > 0) {
    baseImage = product.images[selectedImage] || product.image || '';
  } else {
    baseImage = product.image || '';
  }
  const imageUrl = baseImage
    ? baseImage.startsWith('http')
      ? baseImage
      : `http://localhost:5000${baseImage}`
    : 'https://via.placeholder.com/200x200?text=No+Image';

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
  const totalQty = (productInCart?.quantity || quantity) * piecesPerInner;
  const discount = product.price - unitPrice;
  const showDiscount = discount > 0;
  const discountPercentage =
    product.price > 0 ? Math.round((discount / product.price) * 100) : 0;

  const tiersForTable: Tier[] = sortedTiers.map((t) => ({
    inner: parseInt(t.inner),
    price: t.price,
    qty: t.qty,
  }));

  const toggleDescription = () => setExpandedDescription((v) => !v);

  // For mobile: Scroll to top when changing image to avoid layout jumps
  const handleSelectImage = (index: number) => {
    setSelectedImage(index);
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="product-details-container">
        <div className="product-gallery">
          <div className="main-image-container">
            <img src={imageUrl} alt={product.name} className="main-image" />
            {showDiscount && (
              <div className="discount-badge">
                <FaTag className="discount-icon" />
                Save ₹{discount.toFixed(2)}
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-container">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                  alt={`${product.name} thumbnail ${i + 1}`}
                  className={`thumbnail ${selectedImage === i ? 'active' : ''}`}
                  onClick={() => handleSelectImage(i)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-header">
            <h1 className="product-title">{product.name}</h1>
            <div className="price-section">
              <div className="price-row">
                {showDiscount && (
                  <span className="original-price">₹{product.price.toFixed(2)}</span>
                )}
                <span className={`current-price ${showDiscount ? 'discounted' : ''}`}>
                  ₹{unitPrice.toFixed(2)}
                </span>
                {showDiscount && (
                  <span className="discount-percentage mobile">
                    <FaPercentage className="percentage-icon" />
                    {discountPercentage}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {product.description && (
            <div className="description-section">
              <div className="section-header">
                <h3 className="section-title">
                  <span role="img" aria-label="Description">📋</span> Product Description
                </h3>
                <button onClick={toggleDescription} className="toggle-description">
                  {expandedDescription ? (
                    <>
                      Show Less <FiChevronUp className="toggle-icon" />
                    </>
                  ) : (
                    <>
                      Read More <FiChevronDown className="toggle-icon" />
                    </>
                  )}
                </button>
              </div>
              <div className={`description-content ${expandedDescription ? 'expanded' : ''}`}>
                {product.description}
              </div>
            </div>
          )}

          <div className="bulk-pricing-section">
            <div className="section-header">
              <h3 className="section-title">
                <span role="img" aria-label="Bulk Pricing">📊</span> Bulk Pricing
              </h3>
              <div className="pieces-info">
                <FaBoxOpen className="box-icon" />
                {piecesPerInner} pieces per inner
              </div>
            </div>
            {tiersForTable.length > 0 ? (
              <div className="table-responsive">
                <BulkPricingTable
                  innerQty={piecesPerInner}
                  tiers={tiersForTable}
                  selectedInner={productInCart?.quantity || quantity}
                />
              </div>
            ) : (
              <div className="no-bulk-pricing" style={{ margin: '10px 0', color: '#555' }}>
                No bulk pricing tiers available.
              </div>
            )}
          </div>

          <div className="quantity-section">
            <h3 className="section-title">
              <span role="img" aria-label="Quantity">🔢</span> Quantity (Inners)
            </h3>
            {productInCart ? (
              <>
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
                <div className="total-pieces">
                  Total: {productInCart.quantity * piecesPerInner} pieces
                </div>
              </>
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
        </div>
      </div>

      {/* spacer so content doesn't sit under the floating button */}
      <div style={{ height: 84 }} />

      {/* ✅ floating checkout button (left side, shows count via ShopContext) */}
      <FloatingCheckoutButton />
    </>
  );
};

export default ProductDetails;
