import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import '../styles/ProductDetails.css';

interface BulkTier {
  inner: string;
  qty: number;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  image: string;
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        setError('Failed to load product. Please try again later.');
        console.error(err);
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

  const baseImage = product.images?.[selectedImage] || product.image;
  const imageUrl = baseImage.startsWith('http') ? baseImage : `http://localhost:5000${baseImage}`;

  const getActiveTier = () => {
    const sortedTiers = [...(product.bulkPricing || [])]
      .sort((a, b) => parseInt(a.inner) - parseInt(b.inner));
    return sortedTiers.reduce((match, tier) =>
      quantity >= parseInt(tier.inner) ? tier : match, sortedTiers[0]);
  };

  const activeTier = getActiveTier();
  const unitPrice = activeTier ? Number(activeTier.price) : Number(product.price);
  const innerQty = parseInt(activeTier?.inner || '1') || 1;
  const totalQty = quantity * innerQty;
  const totalPrice = totalQty * unitPrice;
  const discount = product.price - unitPrice;
  const showDiscount = discount > 0;

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  return (
    <div className="product-details-container">
      <div className="product-gallery">
        <div className="main-image-container">
          <img src={imageUrl} alt={product.name} className="main-image" />
          {showDiscount && (
            <div className="discount-badge">
              Save ₹{discount.toFixed(2)} per unit
            </div>
          )}
        </div>
        
        {product.images && product.images.length > 1 && (
          <div className="thumbnail-container">
            {product.images.map((img, index) => (
              <img
                key={index}
                src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                alt={`${product.name} thumbnail ${index + 1}`}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => handleImageClick(index)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="product-info">
        <h1 className="product-title">{product.name}</h1>
        
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}

        <div className="price-section">
          <div className="price-row">
            <span className="original-price">₹{product.price.toFixed(2)}</span>
            {showDiscount && (
              <span className="discounted-price">₹{unitPrice.toFixed(2)}</span>
            )}
          </div>
          {showDiscount && (
            <div className="savings">
              You save ₹{(discount * totalQty).toFixed(2)} on this order
            </div>
          )}
        </div>

        <div className="bulk-pricing-section">
          <h3>Bulk Pricing</h3>
          <table className="bulk-table">
            <thead>
              <tr>
                <th>Min Qty</th>
                <th>Total Qty</th>
                <th>Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {[...(product.bulkPricing || [])]
                .sort((a, b) => parseInt(a.inner) - parseInt(b.inner))
                .map((tier, i, sortedTiers) => {
                  const minQty = parseInt(tier.inner);
                  const totalQty = minQty * (product.innerQty || 1);
                  const isActive = quantity >= minQty && 
                    (i === sortedTiers.length - 1 || quantity < parseInt(sortedTiers[i + 1].inner));
                  
                  return (
                    <tr 
                      key={i} 
                      className={isActive ? 'highlight' : ''}
                    >
                      <td>{minQty}+</td>
                      <td>{totalQty}</td>
                      <td>₹{tier.price.toFixed(2)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="quantity-section">
          <h3>Quantity</h3>
          <div className="quantity-controls">
            <button 
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="quantity-display">{quantity}</span>
            <button 
              onClick={() => setQuantity(q => q + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
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
              <span className="summary-savings">₹{(discount * totalQty).toFixed(2)}</span>
            </div>
          )}
        </div>

        <button className="add-to-cart-button">
          Add to Cart - ₹{totalPrice.toFixed(2)}
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;