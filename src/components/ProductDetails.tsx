import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
  FiShare2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { FaTag, FaRegHeart, FaHeart } from "react-icons/fa";
import { useShop } from "../context/ShopContext";
import FloatingCheckoutButton from "../components/FloatingCheckoutButton";
import { getImageUrl } from "../utils/image";
import ProductSEO from "./ProductSEO";
import ProductCard from "./ProductCard";
import ReviewSection from "../components/ReviewSection";

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
  hotDealType?: "PERCENT" | "FLAT" | "NONE";
  hotDealValue?: number;
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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  
  // Touch handling refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();

  const toggleDescription = () => setIsDescriptionExpanded((prev) => !prev);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    
    // Optional: Add visual feedback during swipe
    const container = imageContainerRef.current;
    if (container && product?.images && product.images.length > 1) {
      const diffX = touchStartX.current - e.touches[0].clientX;
      container.style.transform = `translateX(${-diffX * 0.2}px)`;
      container.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    const container = imageContainerRef.current;
    if (container) {
      container.style.transform = '';
      container.style.transition = '';
    }

    if (!product?.images || product.images.length <= 1) return;

    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        // Swipe left - next image
        setSelectedImage((prev) => 
          prev === product.images!.length - 1 ? 0 : prev + 1
        );
      } else {
        // Swipe right - previous image
        setSelectedImage((prev) => 
          prev === 0 ? product.images!.length - 1 : prev - 1
        );
      }
      setImgLoaded(false);
    }
  };

  const handleImageChange = useCallback((direction: 'next' | 'prev') => {
    if (!product?.images || product.images.length <= 1) return;
    
    setSelectedImage(prev => {
      if (direction === 'next') {
        return prev === product.images!.length - 1 ? 0 : prev + 1;
      } else {
        return prev === 0 ? product.images!.length - 1 : prev - 1;
      }
    });
    setImgLoaded(false);
  }, [product?.images]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleImageChange('prev');
      if (e.key === 'ArrowRight') handleImageChange('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleImageChange]);

  // Fetch product data
  useEffect(() => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setSelectedImage(0);
    setImgLoaded(false);
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        const [productRes, configRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/home-config").catch(() => ({ data: {} }))
        ]);

        let fetchedProduct = productRes.data;
        const configData = configRes.data;

        // Apply deals
        const items = configData?.hotDealsItemsResolved || configData?.hotDealsItems || [];
        const activeDeals = items.map((it: any) => ({
          productId: it.productId || it.product?._id,
          discountType: it.discountType || "NONE",
          discountValue: Number(it.discountValue || 0),
          endsAt: it.endsAt || null,
        }));

        const mainDeal = activeDeals.find((d: any) => d.productId === fetchedProduct._id);
        if (mainDeal) {
          fetchedProduct.hotDealType = mainDeal.discountType;
          fetchedProduct.hotDealValue = mainDeal.discountValue;
          fetchedProduct.sale_end_time = mainDeal.endsAt || fetchedProduct.sale_end_time;
        }

        if (fetchedProduct.relatedProducts?.length) {
          fetchedProduct.relatedProducts = fetchedProduct.relatedProducts.map((rel: any) => {
            const relDeal = activeDeals.find((d: any) => d.productId === rel._id);
            if (relDeal) {
              return {
                ...rel,
                hotDealType: relDeal.discountType,
                hotDealValue: relDeal.discountValue,
                sale_end_time: relDeal.endsAt || rel.sale_end_time,
              };
            }
            return rel;
          });
        }

        setProduct(fetchedProduct);
      } catch (err) {
        console.error("Failed loading product", err);
        setError("Failed to load product. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Timer effect
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
        return days > 0 
          ? `${days}D ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
          : `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const t = calculateTimeLeft();
      setTimeLeft(t);
      if (!t) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [product?.sale_end_time]);

  // Share handler
  const handleShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.name,
      text: `Check out ${product.name} at Bafna Toys! ${product.tagline || ""}`,
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

  // Memoized computed values
  const {
    itemCount,
    minQty,
    unitPrice,
    discountPercent,
    hasDiscount,
    imageUrl,
    thumbnails,
  } = useMemo(() => {
    if (!product) {
      return {
        itemCount: 0,
        minQty: 1,
        unitPrice: 0,
        discountPercent: 0,
        hasDiscount: false,
        imageUrl: "",
        thumbnails: [],
      };
    }

    const cartItem = cartItems.find((item) => item._id === product._id);
    const itemCount = cartItem?.quantity ?? 0;
    const minQty = product.price < 60 ? 3 : 2;
    const unitPrice = product.price;

    const hasDiscount = !!(product.mrp && product.mrp > unitPrice) || product.hotDealType !== "NONE";
    
    const discountPercent = product.hotDealType === "PERCENT" && product.hotDealValue
      ? product.hotDealValue
      : (product.mrp && product.mrp > unitPrice)
      ? Math.round(((product.mrp - unitPrice) / product.mrp) * 100)
      : 0;

    const images = product.images?.length ? product.images : [product.image].filter(Boolean);
    const baseImage = images[selectedImage] || "";
    const imageUrl = getImageUrl(baseImage, 800);
    
    const thumbnails = images.map(img => getImageUrl(img, 150));

    return {
      itemCount,
      minQty,
      unitPrice,
      discountPercent,
      hasDiscount,
      imageUrl,
      thumbnails,
    };
  }, [product, cartItems, selectedImage]);

  const handleAdd = () => {
    if (product) setCartItemQuantity(product, minQty);
  };

  const handleInc = () => {
    if (product) setCartItemQuantity(product, itemCount + 1);
  };

  const handleDec = () => {
    if (product) {
      const nextQty = itemCount <= minQty ? 0 : itemCount - 1;
      setCartItemQuantity(product, nextQty);
    }
  };

  const handleSelectImage = (index: number) => {
    setSelectedImage(index);
    setImgLoaded(false);
    
    // Smooth scroll thumbnail into view
    if (thumbnailRef.current) {
      const thumbElement = thumbnailRef.current.children[index] as HTMLElement;
      if (thumbElement) {
        thumbElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="pd-loading">
        <div className="pd-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) return <div className="pd-error">{error}</div>;
  if (!product) return <div className="pd-error">Product not found</div>;

  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const isOutOfStock = product.stock === 0;

  return (
    <>
      <ProductSEO
        name={product.name}
        description={product.description}
        price={product.price}
        image={imageUrl}
        url={window.location.href}
        sku={product.sku}
        category={product.category?.name}
        stock={product.stock}
        rating={product.rating}
        reviews={product.reviews}
      />

      <div className="pd-container">
        {/* Gallery Section */}
        <div className="pd-gallery">
          <div className="pd-main-image-wrapper">
            <div 
              className="pd-main-image-frame"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => setShowZoom(true)}
              ref={imageContainerRef}
            >
              {!imgLoaded && <div className="pd-skeleton-loader" />}

              <img
                src={imageUrl}
                alt={product.name}
                className={`pd-main-image ${imgLoaded ? "loaded" : ""}`}
                onLoad={() => setImgLoaded(true)}
                fetchPriority="high"
                loading="eager"
                width="600"
                height="600"
              />

              {/* Navigation Arrows (Desktop) */}
              {images.length > 1 && (
                <>
                  <button 
                    className="pd-nav-arrow prev"
                    onClick={(e) => { e.stopPropagation(); handleImageChange('prev'); }}
                    aria-label="Previous image"
                  >
                    <FiChevronLeft />
                  </button>
                  <button 
                    className="pd-nav-arrow next"
                    onClick={(e) => { e.stopPropagation(); handleImageChange('next'); }}
                    aria-label="Next image"
                  >
                    <FiChevronRight />
                  </button>
                </>
              )}

              {/* MRP Badge */}
              {product.mrp && product.mrp > unitPrice && (
                <div className="pd-mrp-circle">
                  <span className="pd-mrp-text">MRP</span>
                  <span className="pd-mrp-price">₹{product.mrp.toLocaleString()}</span>
                </div>
              )}

              {/* Deal Badge */}
              {hasDiscount && (
                <div className="pd-image-badge">
                  <FaTag size={10} />
                  {product.hotDealType === "FLAT" 
                    ? `₹${product.hotDealValue} OFF` 
                    : `${discountPercent}% OFF`}
                </div>
              )}

              {/* Wishlist Button */}
              <button 
                className="pd-wishlist-btn"
                onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isWishlisted ? <FaHeart color="#ff5a6b" /> : <FaRegHeart />}
              </button>
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="pd-image-counter">
                {selectedImage + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="pd-thumbnails" ref={thumbnailRef}>
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`pd-thumb ${selectedImage === i ? "active" : ""}`}
                  onClick={() => handleSelectImage(i)}
                >
                  <img
                    src={getImageUrl(img, 150)}
                    alt={`${product.name} - view ${i + 1}`}
                    loading="lazy"
                    width="60"
                    height="60"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="pd-info">
          <div className="pd-header">
            <div className="pd-title-wrapper">
              <h1 className="pd-title">{product.name}</h1>
              <button
                onClick={handleShare}
                className="pd-share-button"
                title="Share Product"
              >
                <FiShare2 size={20} />
              </button>
            </div>

            {timeLeft && (
              <div className="pd-timer-badge">
                <FiClock className="pd-timer-icon" />
                <div className="pd-timer-text">
                  <span>Deal Ends in:</span>
                  <strong>{timeLeft}</strong>
                </div>
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
                  {product.reviews && (
                    <span className="pd-review-count">({product.reviews})</span>
                  )}
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
              {isOutOfStock ? (
                <span className="pd-stock pd-stock--out">
                  <FiAlertCircle /> Out of Stock
                </span>
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

          {/* Price Block */}
          <div className="pd-price-block">
            <div className="pd-price-wrapper">
              <div className="pd-prices">
                <span className="pd-current-price">₹{unitPrice.toFixed(0)}</span>
                {product.mrp && product.mrp > unitPrice && (
                  <span className="pd-original-price">₹{product.mrp.toFixed(0)}</span>
                )}
              </div>

              {hasDiscount && product.mrp && (
                <div className="pd-savings-bubble">
                  Save ₹{(product.mrp - unitPrice).toFixed(0)}
                </div>
              )}
            </div>

            <div className="pd-min-qty">
              <FiInfo size={12} />
              <span>Minimum Order: <strong>{minQty} units</strong></span>
            </div>

            {/* BULK PRICING SECTION REMOVED */}
          </div>

          {/* Action Buttons */}
          <div className="pd-actions-area">
            {itemCount === 0 ? (
              <button
                className="pd-btn-cart"
                onClick={handleAdd}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? (
                  <>
                    <FiShield /> Notify Me
                  </>
                ) : (
                  <>
                    <FiShoppingCart /> Add to Cart
                  </>
                )}
              </button>
            ) : (
              <div className="pd-qty-wrapper">
                <button
                  onClick={handleDec}
                  className="pd-qty-btn decrease"
                  aria-label={itemCount === minQty ? "Remove from cart" : "Decrease quantity"}
                >
                  {itemCount === minQty ? "Del" : <FiMinus />}
                </button>

                <span className="pd-qty-val">{itemCount}</span>

                <button
                  onClick={handleInc}
                  className="pd-qty-btn increase"
                  disabled={product.stock !== undefined && itemCount >= product.stock}
                  aria-label="Increase quantity"
                >
                  <FiPlus />
                </button>
              </div>
            )}
          </div>

          {/* Description Accordion */}
          {product.description && (
            <div className={`pd-desc-accordion ${isDescriptionExpanded ? "open" : ""}`}>
              <div className="pd-desc-header" onClick={toggleDescription}>
                <h3>Product Description</h3>
                <span className="pd-chevron">
                  {isDescriptionExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </div>

              <div className="pd-desc-body">
                <div className="pd-desc-content">
                  {product.description.split("\n").filter(l => l.trim()).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Key Features / Highlights */}
          <div className="pd-highlights">
            <div className="pd-highlight-item">
              <FiShield className="pd-highlight-icon" />
              <div className="pd-highlight-text">
                <strong>Secure Payment</strong>
                <span>100% secure transactions</span>
              </div>
            </div>
            <div className="pd-highlight-item">
              <FiClock className="pd-highlight-icon" />
              <div className="pd-highlight-text">
                <strong>Fast Delivery</strong>
                <span>2-4 business days</span>
              </div>
            </div>
            <div className="pd-highlight-item">
              <FiCheckCircle className="pd-highlight-icon" />
              <div className="pd-highlight-text">
                <strong>Quality Assured</strong>
                <span>Premium products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pd-reviews-wrapper">
        <ReviewSection productId={product._id} />
      </div>

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="pd-related-section">
          <h3 className="pd-section-title">You May Also Like</h3>
          <div className="pd-related-scroll">
            {product.relatedProducts.map((rel, i) => (
              <div key={rel._id} className="pd-related-item">
                <ProductCard product={rel} userRole="customer" index={i + 4} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {showZoom && (
        <div className="pd-zoom-modal" onClick={() => setShowZoom(false)}>
          <div className="pd-zoom-content" onClick={(e) => e.stopPropagation()}>
            <img src={imageUrl} alt={product.name} />
            <button className="pd-zoom-close" onClick={() => setShowZoom(false)}>×</button>
          </div>
        </div>
      )}

      <FloatingCheckoutButton />
    </>
  );
};

export default ProductDetails;