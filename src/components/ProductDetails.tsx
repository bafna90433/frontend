import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/ProductDetails.css";
import { 
  FiChevronDown, 
  FiChevronUp, 
  FiInfo, 
  FiStar, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiBox, 
  FiTag, 
  FiHash, 
  FiShoppingCart, 
  FiMinus, 
  FiPlus, 
  FiShield,
  FiClock,
  FiShare2 
} from "react-icons/fi";
import { FaTag } from "react-icons/fa";
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
  mrp?: number;
  price: number;
  bulkPricing: BulkTier[];
  description?: string;
  innerQty?: number;
  relatedProducts?: Product[];
  sku?: string;
  category?: { _id: string; name: string };
  stock?: number;
  rating?: number;
  reviews?: number;
  tagline?: string;
  packSize?: string;
  sale_end_time?: string;
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();

  const toggleDescription = () => setIsDescriptionExpanded((prev) => !prev);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setSelectedImage(0);
    setImgLoaded(false);
    
    // Scroll to top when product changes
    window.scrollTo(0, 0);

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

  useEffect(() => {
    if (!product?.sale_end_time) {
        setTimeLeft(null);
        return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(product.sale_end_time!).getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return `${days}D ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return null;
      }
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const t = calculateTimeLeft();
      setTimeLeft(t);
      if (!t) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [product?.sale_end_time]); // Optimised dependency

  // --- Share Functionality ---
  const handleShare = async () => {
    if (!product) return;
    
    const shareData = {
      title: product.name,
      text: `Hey! Check out this ${product.name} at Bafna Toys: ${product.tagline || ''}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.log("Error sharing:", err);
    }
  };

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

  // Memoize heavy calculations
  const { itemCount, minQty, unitPrice, discountPercent, hasDiscount, baseImage, imageUrl } = useMemo(() => {
    if (!product) return { itemCount: 0, minQty: 1, unitPrice: 0, discountPercent: 0, hasDiscount: false, baseImage: "", imageUrl: "" };

    const cartItem = cartItems.find((item) => item._id === product._id);
    const itemCount = cartItem?.quantity ?? 0;
    const minQty = product.price < 60 ? 3 : 2;
    const unitPrice = product.price;

    const hasDiscount = product.mrp && product.mrp > unitPrice;
    const discountPercent = hasDiscount 
      ? Math.round(((product.mrp! - unitPrice) / product.mrp!) * 100) 
      : 0;

    const baseImage = product.images?.[selectedImage] || product.image || "";
    // OPTIMIZATION: Request exact size needed (800w for main view)
    const imageUrl = getImageUrl(baseImage, 800); 

    return { itemCount, minQty, unitPrice, discountPercent, hasDiscount, baseImage, imageUrl };
  }, [product, cartItems, selectedImage]);

  const handleAdd = () => { if (product) setCartItemQuantity(product, minQty); };
  const handleInc = () => { if (product) setCartItemQuantity(product, itemCount + 1); };
  const handleDec = () => { if (product) { const nextQty = itemCount <= minQty ? 0 : itemCount - 1; setCartItemQuantity(product, nextQty); } };
  const handleSelectImage = (index: number) => { setSelectedImage(index); setImgLoaded(false); };

  if (loading) return <div className="pd-loading"><div className="pd-spinner"></div><p>Loading fun stuff...</p></div>;
  if (error) return <div className="pd-error">{error}</div>;
  if (!product) return <div className="pd-error">Product not found</div>;

  return (
    <>
      <ProductSEO 
        name={product.name} 
        description={product.description} 
        price={product.price} 
        image={imageUrl} 
        url={window.location.href} 
      />

      <div className="pd-container">
        
        <div className="pd-gallery">
          <div className="pd-main-image-frame" ref={imageContainerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            {/* OPTIMIZATION: Skeleton loader prevents layout shift */}
            {!imgLoaded && <div className="pd-skeleton-loader" style={{position: 'absolute', inset: 0, background: '#f0f0f0'}} />}
            
            <img 
              src={imageUrl} 
              alt={product.name} 
              className={`pd-main-image ${imgLoaded ? "loaded" : ""}`} 
              onLoad={() => setImgLoaded(true)} 
              // OPTIMIZATION: High Priority for LCP
              fetchPriority="high"
              loading="eager"
              width="600" // Explicit width/height to reduce CLS
              height="600"
            />
            {product.images && product.images.length > 1 && (
              <div className="pd-swipe-dots">
                {product.images.map((_, i) => (
                  <div key={i} className={`pd-dot ${selectedImage === i ? "active" : ""}`} />
                ))}
              </div>
            )}
            
            {hasDiscount && (
              <div className="pd-image-badge">
                 <FaTag size={10} /> {discountPercent}% OFF
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="pd-thumbnails">
              {product.images.map((img, i) => (
                <div 
                  key={i} 
                  className={`pd-thumb ${selectedImage === i ? "active" : ""}`} 
                  onClick={() => handleSelectImage(i)}
                >
                  <img 
                    src={getImageUrl(img, 150)} // Small thumbnail size
                    alt={`thumb-${i}`} 
                    loading="lazy" 
                    width="60"
                    height="60"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          
          <div className="pd-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <h1 className="pd-title">{product.name}</h1>
              {/* --- SHARE BUTTON --- */}
              <button 
                onClick={handleShare}
                className="pd-share-button"
                title="Share Product"
                aria-label="Share this product"
              >
                <FiShare2 size={20} />
              </button>
            </div>
            
            {timeLeft && (
               <div className="pd-timer-badge">
                   <FiClock /> Deal Ends in: {timeLeft}
               </div>
            )}

            <div className="pd-meta-chips">
              {product.sku && (
                <span className="pd-chip pd-chip--sku">
                  <FiHash /> {product.sku}
                </span>
              )}
              {(product.rating || product.reviews) && (
                 <span className="pd-chip pd-chip--rating">
                   <FiStar fill="#FBC02D" stroke="none" /> 
                   <strong>{product.rating || 4.5}</strong>
                   {product.reviews && <span className="pd-review-count">({product.reviews})</span>}
                 </span>
              )}
              {product.tagline && (
                <span className="pd-chip pd-chip--tag">
                  <FiTag /> {product.tagline}
                </span>
              )}
              {product.packSize && (
                <span className="pd-chip pd-chip--box">
                  <FiBox /> {product.packSize}
                </span>
              )}
            </div>

            <div className="pd-stock-row">
                {product.stock === 0 ? (
                  <span className="pd-stock pd-stock--out">Out of Stock</span>
                ) : product.stock && product.stock <= 10 ? (
                  <span className="pd-stock pd-stock--low">
                    <FiAlertCircle /> Only {product.stock} left!
                  </span>
                ) : (
                  <span className="pd-stock pd-stock--in">
                    <FiCheckCircle /> In Stock
                  </span>
                )}
            </div>
          </div>

          <div className="pd-price-block">
             <div className="pd-prices">
                <span className="pd-current-price">₹{unitPrice.toFixed(0)}</span>
                {product.mrp && product.mrp > unitPrice && (
                  <span className="pd-mrp">MRP ₹{product.mrp.toLocaleString()}</span>
                )}
             </div>
             {hasDiscount && (
                <div className="pd-savings-bubble">
                  You Save ₹{(product.mrp! - unitPrice).toFixed(0)}
                </div>
             )}
             <div className="pd-min-qty">
                <FiInfo size={12} /> Minimum Order: {minQty} units
             </div>
          </div>

          <div className="pd-actions-area">
             {itemCount === 0 ? (
                <button 
                  className="pd-btn-cart" 
                  onClick={handleAdd}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? (
                    <> <FiShield /> Notify Me </>
                  ) : (
                    <> <FiShoppingCart /> Add to Cart </>
                  )}
                </button>
             ) : (
                <div className="pd-qty-wrapper">
                   <button 
                     onClick={handleDec} 
                     className="pd-qty-btn decrease"
                     title={itemCount === minQty ? "Remove" : "Decrease"}
                   >
                     {itemCount === minQty ? "Del" : <FiMinus />}
                   </button>
                   
                   <span className="pd-qty-val">{itemCount}</span>
                   
                   <button 
                     onClick={handleInc} 
                     className="pd-qty-btn increase"
                     disabled={product.stock !== undefined && itemCount >= product.stock}
                   >
                     <FiPlus />
                   </button>
                </div>
             )}
          </div>

          {product.description && (
            <div className={`pd-desc-accordion ${isDescriptionExpanded ? "open" : ""}`}>
              <div className="pd-desc-header" onClick={toggleDescription}>
                <h3>Product Description</h3>
                <span className="pd-chevron">
                   {isDescriptionExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </div>
              <div className="pd-desc-body">
                <ul>
                  {product.description.split("\n").filter(l => l.trim()).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="pd-related-section">
          <h3 className="pd-section-title">🧸 You May Also Like</h3>
          <div className="pd-related-scroll">
            {product.relatedProducts.map((rel, i) => (
              <div key={rel._id} className="pd-related-item">
                {/* OPTIMIZATION: Related items are low priority, so lazy load everything */}
                <ProductCard product={rel} userRole="customer" index={i + 4} />
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