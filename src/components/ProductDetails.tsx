import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/ProductDetails.css";
import { FiShoppingCart, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FaBoxOpen, FaTag } from "react-icons/fa";
import { useShop } from "../context/ShopContext";
import FloatingCheckoutButton from "../components/FloatingCheckoutButton";
import { getImageUrl } from "../utils/image";
import ProductSEO from "./ProductSEO";
import ProductCard from "./ProductCard";

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
  mrp?: number; // ✅ Added MRP
  price: number; // Base selling price
  bulkPricing: BulkTier[];
  description?: string;
  innerQty?: number;
  relatedProducts?: Product[];
  sku?: string;
  category?: { _id: string; name: string };
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { cartItems, addToCart, setCartItemQuantity, removeFromCart } = useShop();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isApproved = user?.isApproved;

  const toggleDescription = () => setIsDescriptionExpanded((prev) => !prev);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setSelectedImage(0);
    setImgLoaded(false);

    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("❌ Failed loading product", err);
        setError("Failed to load product. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Gallery Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    if (!product?.images || product.images.length <= 1) return;
    const diffX = touchStartX.current - touchEndX.current;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) setSelectedImage((p) => p === product.images!.length - 1 ? 0 : p + 1);
      else setSelectedImage((p) => p === 0 ? product.images!.length - 1 : p - 1);
      setImgLoaded(false);
    }
  };

  if (loading) return <div className="loading-container"><p>Loading product details…</p></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return <div className="error-message">Product not found</div>;

  const productInCart = cartItems.find((item) => item._id === product._id);

  // Price Calculation logic (Active tier still used for dynamic selling price)
  const sortedTiers = Array.isArray(product.bulkPricing)
    ? [...product.bulkPricing].sort((a, b) => parseInt(a.inner) - parseInt(b.inner))
    : [];

  const activeTier = sortedTiers.length > 0
    ? sortedTiers.reduce((prev, tier) =>
        (productInCart?.quantity || quantity) >= parseInt(tier.inner) ? tier : prev,
        sortedTiers[0]
      ) : undefined;

  const unitPrice = activeTier ? activeTier.price : product.price;

  // ✅ Discount Logic
  const hasDiscount = product.mrp && product.mrp > unitPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((product.mrp! - unitPrice) / product.mrp!) * 100) 
    : 0;

  const baseImage = product.images?.[selectedImage] || product.image || "";
  const imageUrl = getImageUrl(baseImage, 800);
  const handleSelectImage = (index: number) => { setSelectedImage(index); setImgLoaded(false); };

  return (
    <>
      <ProductSEO name={product.name} description={product.description} price={product.price} image={imageUrl} url={`https://bafnatoys.com/product/${product._id}`} />

      <div className="product-details-container">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="main-image-wrapper" ref={imageContainerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <img src={imageUrl} alt={product.name} className={`main-image blur-up ${imgLoaded ? "loaded" : ""}`} onLoad={() => setImgLoaded(true)} />
            {product.images && product.images.length > 1 && (
              <div className="swipe-indicators">
                {product.images.map((_, i) => (
                  <div key={i} className={`swipe-dot ${selectedImage === i ? "active" : ""}`} />
                ))}
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-container">
              {product.images.map((img, i) => (
                <img key={i} src={getImageUrl(img, 150)} alt="thumb" className={`thumbnail ${selectedImage === i ? "active" : ""}`} onClick={() => handleSelectImage(i)} />
              ))}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="product-info-panel">
          <div className="product-info-content">
            <div className="product-header">
              <h1 className="product-title">{product.name}</h1>
              
              <div className="price-section">
                {isApproved ? (
                  <div className="price-display-box">
                    {/* ✅ MRP Strikethrough Display */}
                    {product.mrp && (
                      <div className="details-mrp-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span className="details-mrp-label" style={{ color: '#666' }}>MRP: </span>
                        <span className="details-mrp-value" style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.2rem' }}>
                            ₹{product.mrp.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span className="details-discount-tag" style={{ background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaTag /> {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="details-selling-price" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span className="current-price-value" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1a202c' }}>
                        ₹{unitPrice.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="details-savings" style={{ color: '#27ae60', fontWeight: '600', background: '#f0fff4', padding: '4px 10px', borderRadius: '6px', fontSize: '1rem', border: '1px dashed #27ae60' }}>
                          You save ₹{(product.mrp! - unitPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="locked-message">🔒 Price visible after admin approval</span>
                )}
              </div>
            </div>

            {/* Quantity and Action Buttons */}
            {isApproved && (
              <div className="quantity-section" style={{ display: 'block', marginTop: '20px' }}>
                <h3 className="section-title">🔢 Quantity (Inners)</h3>
                <div className="action-row" style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <div className="quantity-controls">
                    <button onClick={() => {
                        const current = productInCart?.quantity || quantity;
                        const newQ = Math.max(1, current - 1);
                        if(productInCart) setCartItemQuantity(productInCart, newQ);
                        else setQuantity(newQ);
                    }} className="quantity-button">−</button>
                    <span className="quantity-display">{productInCart?.quantity || quantity}</span>
                    <button onClick={() => {
                        const current = productInCart?.quantity || quantity;
                        if(productInCart) setCartItemQuantity(productInCart, current + 1);
                        else setQuantity(current + 1);
                    }} className="quantity-button">+</button>
                  </div>
                  
                  {!productInCart && (
                    <button className="add-to-cart-button" onClick={() => addToCart(product, quantity)} style={{ flex: 1 }}>
                       Add to Cart
                    </button>
                  )}
                </div>
                {!productInCart && (
                   <button className="buy-now-button" style={{marginTop: '15px', width: '100%', display: 'block'}} onClick={() => { addToCart(product, quantity); navigate("/cart"); }}>
                     🛒 Buy Now
                   </button>
                )}
              </div>
            )}

            {/* Description Accordion */}
            {product.description && (
              <div className="description-accordion" style={{ marginTop: '30px' }}>
                <div className="description-toggle-header" onClick={toggleDescription}>
                  <h3 className="description-title">Description</h3>
                  <span>{isDescriptionExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                </div>
                <div className={`description-content ${isDescriptionExpanded ? "expanded" : ""}`}>
                  <ul className="description-list">
                    {product.description.split("\n").filter(l => l.trim()).map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="related-products-wrapper">
          <h3 className="section-title">🧸 Related Products</h3>
          <div className="related-products-scroll">
            {product.relatedProducts.map((rel, i) => (
              <div key={rel._id} className="related-product-item">
                <ProductCard product={rel} userRole="customer" index={i} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 100 }} />
      <FloatingCheckoutButton />
    </>
  );
};

export default ProductDetails;