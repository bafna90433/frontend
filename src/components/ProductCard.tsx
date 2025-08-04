import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProductCard.css';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useShop } from '../context/ShopContext';
import BulkPricingTable, { Tier } from './BulkPricingTable';

interface BulkTier {
  inner: number;
  qty: number;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  images?: string[];
  price: number;
  innerQty?: number;
  bulkPricing: BulkTier[];
}

const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const {
    cartItems,
    wishlistItems,
    setCartItemQuantity,
    addToWishlist,
    removeFromWishlist
  } = useShop();

  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const cartItem = cartItems.find(item => item._id === product._id);
  const innerCount = cartItem?.quantity ?? 0;

  const sortedTiers = [...product.bulkPricing].sort((a, b) => a.inner - b.inner);
  const activeTier = sortedTiers.reduce(
    (prev, tier) => innerCount >= tier.inner ? tier : prev,
    sortedTiers[0]
  );
  const piecesPerInner = product.innerQty && product.innerQty > 0
    ? product.innerQty
    : sortedTiers.length > 0 && sortedTiers[0].qty > 0
      ? sortedTiers[0].qty / sortedTiers[0].inner
      : 1;
  const totalPieces = innerCount * piecesPerInner;
  const unitPrice = activeTier.price;
  const totalPrice = totalPieces * unitPrice;

  const tiersForTable: Tier[] = product.bulkPricing.map(t => ({
    inner: t.inner,
    price: t.price,
    qty: t.qty
  }));

  const toggleDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  const inWishlist = wishlistItems.some(item => item._id === product._id);
  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inWishlist ? removeFromWishlist(product._id) : addToWishlist(product);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCartItemQuantity(product, 1);
  };

  const increase = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCartItemQuantity(product, innerCount + 1);
  };

  const decrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCartItemQuantity(product, Math.max(0, innerCount - 1));
  };

  const imageFile = product.images?.[0] ?? null;
  const imageSrc = imageFile
    ? (imageFile.startsWith('http')
        ? imageFile
        : imageFile.includes('/uploads/')
          ? `http://localhost:5000${imageFile}`
          : `${IMAGE_BASE_URL}${encodeURIComponent(imageFile)}`)
    : null;

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
      <div className="product-image-center-container">
        {imageSrc ? (
          <img src={imageSrc} alt={product.name} className="product-image-center hd-img" />
        ) : (
          <div className="no-image">No Image</div>
        )}
        <button
          onClick={toggleWishlist}
          className="wishlist-btn"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          {inWishlist ? (
            <FavoriteIcon color="error" />
          ) : (
            <FavoriteBorderIcon />
          )}
        </button>
        <div className="product-badge">BESTSELLER</div>
      </div>
      <div className="product-card-body">
        <div className="product-header">
          <h3 className="product-name">
            {product.name.length > 35
              ? `${product.name.substring(0, 35)}...`
              : product.name}
          </h3>
        </div>
        <div className="price-section">
          <span className={`price ${unitPrice < product.price ? 'original-price' : ''}`}>
            ₹{unitPrice.toLocaleString()}
          </span>
          {unitPrice < product.price && (
            <>
              <span className="discounted-price">
                ₹{product.price.toLocaleString()}
              </span>
              <span className="discount-percent">
                {Math.round((1 - unitPrice / product.price) * 100)}% OFF
              </span>
            </>
          )}
        </div>
        <div className="view-bulk-btn-container">
          <button
            onClick={toggleDetails}
            className="view-bulk-btn"
          >
            {showDetails ? 'Hide Details' : 'View Bulk Price'}
          </button>
        </div>
        {showDetails && (
          <div className="expanded-content">
            <div className="bulk-pricing-wrapper" onClick={e => e.stopPropagation()}>
              <BulkPricingTable
                innerQty={piecesPerInner}
                tiers={tiersForTable}
                selectedInner={innerCount}
              />
            </div>
            <div className="cart-controls" onClick={e => e.stopPropagation()}>
              {innerCount === 0 ? (
                <button
                  onClick={handleAdd}
                  className="add-to-cart-btn"
                >
                  Add to Cart
                </button>
              ) : (
                <div className="quantity-selector">
                  <button onClick={decrease} className="qty-btn">-</button>
                  <span className="qty-count">{innerCount}</span>
                  <button onClick={increase} className="qty-btn">+</button>
                  <div className="final-total-price">
                    Total: <span className="total-highlight">₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
