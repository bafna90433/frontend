import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProductCard.css';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useShop } from '../context/ShopContext';

interface BulkTier { inner: number; qty: number; price: number; }

interface Product {
  _id: string;
  name: string;
  images?: string[];
  price: number;
  innerQty: number;
  bulkPricing: BulkTier[];
}

const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { cartItems, wishlistItems, setCartItemQuantity, addToWishlist, removeFromWishlist } = useShop();
  const navigate = useNavigate();

  const cartItem = cartItems.find(item => item._id === product._id);
  const innerCount = cartItem ? cartItem.quantity : 0;

  const totalQty = innerCount * (product.innerQty || 1);
  const sortedTiers = [...product.bulkPricing].sort((a, b) => a.inner - b.inner);
  const activeTier = sortedTiers.reduce((match, tier) =>
    innerCount >= tier.inner ? tier : match, sortedTiers[0]);
  const unitPrice = activeTier ? Number(activeTier.price) : Number(product.price);
  const totalPrice = totalQty * unitPrice;

  // Wishlist logic
  const inWishlist = wishlistItems.some(item => item._id === product._id);

  // Add to Cart, Increase, Decrease
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCartItemQuantity(product, 1);
  };

  const increase = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCartItemQuantity(product, innerCount + 1);
  };

  const decrease = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const newQty = innerCount - 1;
    setCartItemQuantity(product, newQty < 1 ? 0 : newQty);
  };

  // Image logic
  const imageFile =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null;
  const imageSrc = imageFile
    ? imageFile.startsWith('http')
      ? imageFile
      : imageFile.includes('/uploads/')
        ? `http://localhost:5000${imageFile}`
        : `${IMAGE_BASE_URL}${encodeURIComponent(imageFile)}`
    : null;

  // Wishlist handler
  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product._id}`)} style={{ cursor: 'pointer' }}>
      <div className="product-image-container big">
        {imageSrc ? (
          <img className="product-img" src={imageSrc} alt={product.name} />
        ) : (
          <span style={{ color: '#ccc', fontSize: 14 }}>No image</span>
        )}
      </div>

      <div className="product-card-body">
        <div className="wishlist-btn">
          <button onClick={toggleWishlist} className="wishlist-icon-btn" tabIndex={-1}>
            {inWishlist ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          </button>
        </div>

        <h3 className="product-name" title={product.name}>
          {product.name.length > 30 ? `${product.name.substring(0, 30)}...` : product.name}
        </h3>

        <div className="price-section">
          <span className="regular-price">₹{product.price}</span>
          {activeTier && activeTier.price < product.price && (
            <span className="discounted-price">₹{activeTier.price}</span>
          )}
        </div>

        <table className="bulk-table" onClick={e => e.stopPropagation()}>
          <thead>
            <tr>
              <th>Inner Qty</th>
              <th>Total Qty</th>
              <th>Unit Price</th>
            </tr>
          </thead>
          <tbody>
            {sortedTiers.map((tier, i) => (
              <tr
                key={i}
                className={
                  innerCount >= tier.inner &&
                  innerCount < (sortedTiers[i + 1]?.inner || Infinity)
                    ? 'highlight' : ''
                }
              >
                <td>{tier.inner}+</td>
                <td>{tier.qty}</td>
                <td>₹{tier.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="selector-container" onClick={e => e.stopPropagation()}>
          {innerCount === 0 ? (
            <button className="add-cart-btn" onClick={handleAdd}>
              Add to Cart
            </button>
          ) : (
            <div className="qty-selector">
              <button className="qty-btn" onClick={decrease} aria-label="Decrease">
                –
              </button>
              <span className="qty-count">{innerCount}</span>
              <button className="qty-btn" onClick={increase} aria-label="Increase">
                +
              </button>
              <span className="total-label" style={{ marginLeft: 12, fontSize: 14, color: '#333' }}>
                Total: <span style={{ fontWeight: 600 }}>₹{totalPrice.toLocaleString()}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
 