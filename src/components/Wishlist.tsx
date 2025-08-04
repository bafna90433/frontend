import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import '../styles/Wishlist.css';
import { IconButton } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BulkPricingTable from './BulkPricingTable';
import type { Tier } from './BulkPricingTable';

const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

const Wishlist: React.FC = () => {
  const { wishlistItems, removeFromWishlist, cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();

  const getCartQty = (productId: string) => {
    const cartItem = cartItems.find(item => item._id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <div className="toy-store-wishlist">
      <div className="wishlist-header">
        <h1 className="wishlist-title">
          <FavoriteBorderIcon className="title-icon" />
          My Toy Wishlist
        </h1>
        <div className="wishlist-count">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <div className="empty-content">
            <FavoriteBorderIcon className="empty-icon" />
            <h3>Your toy box is empty!</h3>
            <p>Start adding your favorite toys to your wishlist</p>
            <button className="shop-btn" onClick={() => navigate('/')}>
              Explore Toys
            </button>
          </div>
        </div>
      ) : (
        <div className="wishlist-grid-container">
          <div className="wishlist-grid">
            {wishlistItems.map(product => {
              const innerCount = getCartQty(product._id);
              const sortedTiers: Tier[] = Array.isArray(product.bulkPricing)
                ? [...product.bulkPricing].sort((a, b) => a.inner - b.inner)
                : [];

              const activeTier = sortedTiers.reduce((match, tier) =>
                innerCount >= tier.inner ? tier : match, sortedTiers[0]);

              const unitPrice = activeTier ? Number(activeTier.price) : Number(product.price);
              const piecesPerInner = product.innerQty || (sortedTiers[0]?.qty && sortedTiers[0]?.inner
                ? sortedTiers[0].qty / sortedTiers[0].inner
                : 1);

              const totalQty = innerCount * piecesPerInner;
              const totalPrice = unitPrice * totalQty;

              const imageFile = Array.isArray(product.images) && product.images.length > 0
                ? product.images[0]
                : null;
              const imageSrc = imageFile
                ? imageFile.startsWith('http')
                  ? imageFile
                  : imageFile.includes('/uploads/')
                    ? `http://localhost:5000${imageFile}`
                    : `${IMAGE_BASE_URL}${encodeURIComponent(imageFile)}`
                : null;

              const handleAdd = () => setCartItemQuantity(product, 1);
              const increase = () => setCartItemQuantity(product, innerCount + 1);
              const decrease = () => setCartItemQuantity(product, Math.max(0, innerCount - 1));

              return (
                <div className="toy-card" key={product._id}>
                  <div className="card-image-container" onClick={() => navigate(`/product/${product._id}`)}>
                    <img
                      src={imageSrc || '/toy-placeholder.png'}
                      alt={product.name}
                      className="toy-image"
                    />
                    <button
                      className="wishlist-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(product._id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                    {activeTier && activeTier.price < product.price && (
                      <div className="discount-badge">
                        <LocalOfferIcon fontSize="small" />
                        <span>Deal!</span>
                      </div>
                    )}
                  </div>

                  <div className="toy-card-body">
                    <h3 className="toy-name" onClick={() => navigate(`/product/${product._id}`)}>
                      {product.name}
                    </h3>

                    <div className="toy-price">
                      <span className="current-price">₹{unitPrice.toFixed(2)}</span>
                      {activeTier && activeTier.price < product.price && (
                        <span className="original-price">₹{product.price.toFixed(2)}</span>
                      )}
                    </div>

                    {/* ✅ Bulk Pricing Table */}
                    {Array.isArray(product.bulkPricing) && product.bulkPricing.length > 0 && (
                      <div className="toy-bulk-pricing" onClick={e => e.stopPropagation()}>
                        <BulkPricingTable
                          innerQty={piecesPerInner}
                          tiers={product.bulkPricing}
                          selectedInner={innerCount}
                        />
                      </div>
                    )}

                    <div className="toy-actions">
                      {innerCount === 0 ? (
                        <button className="add-to-cart-btn" onClick={handleAdd}>
                          <AddShoppingCartIcon fontSize="small" />
                          Add to Cart
                        </button>
                      ) : (
                        <div className="toy-quantity-controls">
                          <button className="qty-btn minus" onClick={decrease}>
                            <RemoveIcon fontSize="small" />
                          </button>
                          <span className="qty-display">{innerCount}</span>
                          <button className="qty-btn plus" onClick={increase}>
                            <AddIcon fontSize="small" />
                          </button>
                          <span className="qty-total">₹{totalPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
