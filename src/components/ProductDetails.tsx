// src/components/ProductDetails.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import '../styles/ProductDetails.css';
import BulkPricingTable, { Tier } from './BulkPricingTable';
import { FiChevronDown, FiChevronUp, FiShoppingCart } from 'react-icons/fi';
import { FaPercentage, FaBoxOpen, FaTag } from 'react-icons/fa';

interface BulkTier {
  inner: string;   // comes as string from API
  qty: number;     // total pieces for this tier
  price: number;   // per-piece price
}

interface Product {
  _id: string;
  name: string;
  image: string;
  images?: string[];
  price: number;
  bulkPricing: BulkTier[];
  description?: string;
  innerQty?: number;  // pieces per inner
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedDescription, setExpandedDescription] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading product details...</p>
    </div>
  );
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return <div className="error-message">Product not found</div>;

  // --- image gallery ---
  const baseImage = product.images?.[selectedImage] || product.image;
  const imageUrl = baseImage.startsWith('http')
    ? baseImage
    : `http://localhost:5000${baseImage}`;

  const handleImageClick = (index: number) => setSelectedImage(index);

  // --- pricing logic ---
  const sortedTiers = [...product.bulkPricing]
    .sort((a, b) => parseInt(a.inner) - parseInt(b.inner));

  const activeTier = sortedTiers.reduce(
    (prev, tier) =>
      quantity >= parseInt(tier.inner) ? tier : prev,
    sortedTiers[0]
  );

  // fallback piecesPerInner if not provided:
  const piecesPerInner = product.innerQty && product.innerQty > 0
    ? product.innerQty
    : sortedTiers.length > 0
      ? sortedTiers[0].qty / parseInt(sortedTiers[0].inner)
      : 1;

  const unitPrice = activeTier
    ? activeTier.price
    : product.price;

  const totalQty   = quantity * piecesPerInner;
  const totalPrice = totalQty * unitPrice;
  const discount   = product.price - unitPrice;
  const showDiscount = discount > 0;
  const discountPercentage = Math.round((discount / product.price * 100));

  // prepare data for the reusable table
  const tiersForTable: Tier[] = product.bulkPricing.map(t => ({
    inner: parseInt(t.inner),
    price: t.price,
    qty: t.qty
  }));

  const toggleDescription = () => setExpandedDescription(!expandedDescription);

  return (
    <div className="product-details-container">
      <div className="product-gallery">
        <div className="main-image-container">
          <img src={imageUrl} alt={product.name} className="main-image" />
          {showDiscount && (
            <div className="discount-badge">
              <FaTag className="discount-icon" />
              Save ₹{(discount).toFixed(2)}
            </div>
          )}
        </div>

        {product.images && product.images.length > 1 && (
          <div className="thumbnail-container">
            {product.images.map((img, i) => (
              <img
                key={i}
                src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                alt={`${product.name} thumbnail ${i+1}`}
                className={`thumbnail ${selectedImage === i ? 'active' : ''}`}
                onClick={() => handleImageClick(i)}
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
                <span className="discount-percentage">
                  <FaPercentage className="percentage-icon" />
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
            {showDiscount && (
              <div className="savings">
                You save ₹{(discount * totalQty).toFixed(2)} on this order
              </div>
            )}
          </div>
        </div>

        {/* Product Description Section */}
        {product.description && (
          <div className="description-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">📋</span>
                Product Description
              </h3>
              <button 
                onClick={toggleDescription}
                className="toggle-description"
              >
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

        {/* Bulk Pricing Table */}
        <div className="bulk-pricing-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">📊</span>
              Bulk Pricing
            </h3>
            <div className="pieces-info">
              <FaBoxOpen className="box-icon" />
              {piecesPerInner} pieces per inner
            </div>
          </div>
          <BulkPricingTable
            innerQty={piecesPerInner}
            tiers={tiersForTable}
            selectedInner={quantity}
          />
        </div>

        <div className="quantity-section">
          <h3 className="section-title">
            <span className="section-icon">🔢</span>
            Quantity (Inners)
          </h3>
          <div className="quantity-controls-container">
            <div className="quantity-controls">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q-1))}
                aria-label="Decrease quantity"
                className="quantity-button"
              >
                −
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => q+1)}
                aria-label="Increase quantity"
                className="quantity-button"
              >
                +
              </button>
            </div>
            <div className="total-pieces">
              Total: {totalQty} pieces
            </div>
          </div>
        </div>

        <div className="order-summary">
          <div className="summary-row">
            <span>Subtotal ({totalQty} units):</span>
            <span className="summary-price">₹{totalPrice.toFixed(2)}</span>
          </div>
          {showDiscount && (
            <div className="summary-row savings-row">
              <span>Your Savings:</span>
              <span className="summary-savings">
                ₹{(discount * totalQty).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <button className="add-to-cart-button">
          <FiShoppingCart className="cart-icon" />
          Add to Cart – ₹{totalPrice.toFixed(2)}
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;