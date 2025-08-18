import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProductCard.css';
import { useShop } from '../context/ShopContext';

interface BulkTier {
  inner: number;
  qty: number;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  sku?: string;
  images?: string[];
  price: number;
  innerQty?: number;
  bulkPricing: BulkTier[];
  category?: { _id: string; name: string } | string;
  taxFields?: string[];
}

interface ProductCardProps {
  product: Product;
  userRole: 'admin' | 'customer';
}

const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

const ProductCard: React.FC<ProductCardProps> = ({ product, userRole }) => {
  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();

  const cartItem = cartItems.find(item => item._id === product._id);
  const innerCount = cartItem?.quantity ?? 0;

  const sortedTiers = [...product.bulkPricing].sort((a, b) => a.inner - b.inner);

  const activeTier: BulkTier | undefined = sortedTiers.length > 0
    ? sortedTiers.reduce((prev, tier) => (innerCount >= tier.inner ? tier : prev), sortedTiers[0])
    : undefined;

  const piecesPerInner = product.innerQty && product.innerQty > 0
    ? product.innerQty
    : sortedTiers.length > 0 && sortedTiers[0].qty > 0
      ? sortedTiers[0].qty / sortedTiers[0].inner
      : 1;

  const totalPieces = innerCount * piecesPerInner;
  const totalPrice = totalPieces * (activeTier ? activeTier.price : product.price);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItemQuantity(product, 1);
  };
  const increase = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItemQuantity(product, innerCount + 1);
  };
  const decrease = (e: React.MouseEvent) => {
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
    <div className="product-card-item">
      <div
        className="product-image-container"
        onClick={() => navigate(`/product/${product._id}`)}
      >
        {imageSrc
          ? <img src={imageSrc} alt={product.name} className="product-image" />
          : <div className="no-image">No Image</div>
        }
      </div>

      <div className="product-details">
        <h3 className="product-name">{product.name}</h3>

        <div className="product-meta">
          {product.sku && <span className="product-sku">SKU: {product.sku}</span>}
          {product.category && (
            <span className="product-category">
              {typeof product.category === 'string'
                ? product.category
                : product.category?.name}
            </span>
          )}
        </div>

        {product.taxFields && product.taxFields.length > 0 && (
          <div className="product-tax-fields">
            {product.taxFields.map((tax, idx) => (
              <span key={idx} className="tax-field">{tax}</span>
            ))}
          </div>
        )}

        <div className="packing-section">
          <h4 className="packing-title">
            <span className="packing-icon">P</span> Packing & Pricing
          </h4>
          <ul className="pricing-list">
            {sortedTiers.map(tier => (
              <li
                key={tier.inner}
                className={activeTier && tier.inner === activeTier.inner ? 'active-tier-row' : ''}
              >
                {tier.inner} inner ({tier.qty} pcs) ₹{tier.price}/pc
              </li>
            ))}
          </ul>
        </div>

        <div className="cart-controls">
          {innerCount === 0 ? (
            <button onClick={handleAdd} className="add-to-cart-btn">
              ADD TO CART
            </button>
          ) : (
            <div className="quantity-selector-wrapper">
              <div className="quantity-selector">
                <button onClick={decrease} className="qty-btn">-</button>
                <span className="qty-count">{innerCount}</span>
                <button onClick={increase} className="qty-btn">+</button>
              </div>
              {userRole === 'admin' && (
                <div className="admin-total-price">
                  Total: ₹{totalPrice.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
