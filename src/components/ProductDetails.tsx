import React, { useEffect, useState, useRef, useMemo, useCallback, Suspense, lazy } from "react";
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
  FiTruck,
  FiRefreshCw,
} from "react-icons/fi";
import { FaTag, FaRegHeart, FaHeart } from "react-icons/fa";
import { useShop } from "../context/ShopContext";
import { getImageUrl } from "../utils/image";
import ProductSEO from "./ProductSEO";

// --- LAZY LOADED COMPONENTS (Below the fold) ---
const FloatingCheckoutButton = lazy(() => import("../components/FloatingCheckoutButton"));
const ProductCard = lazy(() => import("./ProductCard"));
const ReviewSection = lazy(() => import("../components/ReviewSection"));

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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  
  // Touch Swiping Refs (Optimized without React State for performance)
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement>(null);
  const isSwipingRef = useRef(false);
  const swipeOffsetRef = useRef(0);
  
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();

  const toggleDescription = () => setIsDescriptionExpanded((prev) => !prev);

  const images = useMemo(() => {
    if (!product) return [];
    return product.images?.length
      ? product.images
      : [product.image].filter(Boolean) as string[];
  }, [product]);

  // Simplified Image Preloading (Browser handles this efficiently natively if rendered)
  const [imgLoaded, setImgLoaded] = useState<boolean[]>([]);
  useEffect(() => {
    if (images.length > 0) {
      setImgLoaded(new Array(images.length).fill(false));
    }
  }, [images.length]);

  const handleImageLoad = useCallback((index: number) => {
    setImgLoaded(prev => {
        if(prev[index]) return prev;
        const next = [...prev];
        next[index] = true;
        return next;
    });
  }, []);

  // Autoplay carousel
  const startAutoplay = useCallback(() => {
    if (images.length <= 1) return;
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    
    autoplayRef.current = setInterval(() => {
      setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
  }, [images.length]);

  const pauseAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoplay();
    return pauseAutoplay;
  }, [startAutoplay, pauseAutoplay]);

  // Touch handlers for native-like swipe (Optimized with requestAnimationFrame)
  const updateTrackTransform = useCallback((offset: number, animate: boolean = false) => {
      if(!carouselTrackRef.current) return;
      const el = carouselTrackRef.current;
      el.style.transition = animate ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none";
      el.style.transform = `translateX(calc(-${selectedImage * 100}% + ${offset}px))`;
  }, [selectedImage]);

  useEffect(() => {
      // Reset track position when selectedImage changes normally
      if(!isSwipingRef.current) {
          updateTrackTransform(0, true);
      }
  }, [selectedImage, updateTrackTransform]);

  const handleTouchStart = (e: React.TouchEvent) => {
    pauseAutoplay();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
    isHorizontalSwipe.current = null;
    isSwipingRef.current = true;
    swipeOffsetRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingRef.current || images.length <= 1) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
      return;
    }

    if (!isHorizontalSwipe.current) return;

    e.preventDefault();
    touchCurrentX.current = currentX;

    let offset = diffX;
    if (
      (selectedImage === 0 && offset > 0) ||
      (selectedImage === images.length - 1 && offset < 0)
    ) {
      offset = offset * 0.3; // Resistance
    }

    swipeOffsetRef.current = offset;
    
    // Direct DOM manipulation to avoid React state batching delays
    requestAnimationFrame(() => {
        updateTrackTransform(offset, false);
    });
  };

  const handleTouchEnd = () => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;

    // Fast check to avoid forced reflow from offsetWidth read
    const containerWidth = window.innerWidth > 768 ? 400 : window.innerWidth;
    const threshold = containerWidth * 0.2;
    const velocity = touchCurrentX.current - touchStartX.current;
    const offset = swipeOffsetRef.current;

    let nextImage = selectedImage;

    if (Math.abs(offset) > threshold || Math.abs(velocity) > 80) {
      if (offset < 0 && selectedImage < images.length - 1) {
        nextImage = selectedImage + 1;
      } else if (offset > 0 && selectedImage > 0) {
        nextImage = selectedImage - 1;
      }
    }

    swipeOffsetRef.current = 0;
    isHorizontalSwipe.current = null;
    
    if (nextImage !== selectedImage) {
        setSelectedImage(nextImage); // This will trigger the useEffect to animate to new pos
    } else {
        updateTrackTransform(0, true); // Snap back to current
    }

    startAutoplay();
  };

  const handleImageChange = useCallback(
    (direction: "next" | "prev") => {
      if (!images.length || images.length <= 1) return;
      pauseAutoplay();

      setSelectedImage((prev) => {
        if (direction === "next") {
          return prev === images.length - 1 ? 0 : prev + 1;
        } else {
          return prev === 0 ? images.length - 1 : prev - 1;
        }
      });

      startAutoplay();
    },
    [images.length, pauseAutoplay, startAutoplay]
  );

  const handleSelectImage = useCallback((index: number) => {
    pauseAutoplay();
    setSelectedImage(index);

    if (thumbnailRef.current) {
      const thumbElement = thumbnailRef.current.children[index] as HTMLElement;
      if (thumbElement) {
        thumbElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
    startAutoplay();
  }, [pauseAutoplay, startAutoplay]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleImageChange("prev");
      if (e.key === "ArrowRight") handleImageChange("next");
      if (e.key === "Escape" && showZoom) setShowZoom(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleImageChange, showZoom]);

  // Fetch product
  useEffect(() => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setSelectedImage(0);
    setImgLoaded([]);
    swipeOffsetRef.current = 0;
    window.scrollTo(0, 0);

    let isMounted = true;

    const fetchData = async () => {
      try {
        const [productRes, configRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/home-config").catch(() => ({ data: {} })),
        ]);

        if (!isMounted) return;

        let fetchedProduct = productRes.data;
        const configData = configRes.data;

        const items =
          configData?.hotDealsItemsResolved ||
          configData?.hotDealsItems ||
          [];
        const activeDeals = items.map((it: any) => ({
          productId: it.productId || it.product?._id,
          discountType: it.discountType || "NONE",
          discountValue: Number(it.discountValue || 0),
          endsAt: it.endsAt || null,
        }));

        const mainDeal = activeDeals.find(
          (d: any) => d.productId === fetchedProduct._id
        );
        if (mainDeal) {
          fetchedProduct.hotDealType = mainDeal.discountType;
          fetchedProduct.hotDealValue = mainDeal.discountValue;
          fetchedProduct.sale_end_time =
            mainDeal.endsAt || fetchedProduct.sale_end_time;
        }

        if (fetchedProduct.relatedProducts?.length) {
          fetchedProduct.relatedProducts =
            fetchedProduct.relatedProducts.map((rel: any) => {
              const relDeal = activeDeals.find(
                (d: any) => d.productId === rel._id
              );
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

        // --- META PIXEL: VIEW CONTENT EVENT ---
        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq('track', 'ViewContent', {
            content_name: fetchedProduct.name,
            content_ids: [fetchedProduct._id],
            content_type: 'product',
            value: fetchedProduct.price,
            currency: 'INR'
          });
        }

      } catch (err) {
        if (!isMounted) return;
        console.error("Failed loading product", err);
        setError("Failed to load product. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    return () => {
        isMounted = false;
    }
  }, [id]);

  // Timer
  useEffect(() => {
    if (!product?.sale_end_time) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference =
        new Date(product.sale_end_time!).getTime() - new Date().getTime();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return days > 0
          ? `${days}D ${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}`
          : `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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

  const {
    itemCount,
    minQty,
    unitPrice,
    discountPercent,
    hasDiscount,
  } = useMemo(() => {
    if (!product) {
      return {
        itemCount: 0,
        minQty: 1,
        unitPrice: 0,
        discountPercent: 0,
        hasDiscount: false,
      };
    }

    const cartItem = cartItems.find((item) => item._id === product._id);
    const itemCount = cartItem?.quantity ?? 0;
    const minQty = product.price < 60 ? 3 : 2;
    const unitPrice = product.price;

    const hasDiscount =
      !!(product.mrp && product.mrp > unitPrice) ||
      product.hotDealType !== "NONE";

    const discountPercent =
      product.hotDealType === "PERCENT" && product.hotDealValue
        ? product.hotDealValue
        : product.mrp && product.mrp > unitPrice
        ? Math.round(((product.mrp - unitPrice) / product.mrp) * 100)
        : 0;

    return { itemCount, minQty, unitPrice, discountPercent, hasDiscount };
  }, [product, cartItems]);

  const handleAdd = useCallback(() => {
    if (product) {
      setCartItemQuantity(product, minQty);
      
      // --- META PIXEL: ADD TO CART EVENT ---
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq('track', 'AddToCart', {
          content_name: product.name,
          content_ids: [product._id],
          content_type: 'product',
          value: unitPrice * minQty, // Total value of items added
          currency: 'INR'
        });
      }
    }
  }, [product, minQty, setCartItemQuantity, unitPrice]);

  const handleInc = useCallback(() => {
    if (product) setCartItemQuantity(product, itemCount + 1);
  }, [product, itemCount, setCartItemQuantity]);

  const handleDec = useCallback(() => {
    if (product) {
      const nextQty = itemCount <= minQty ? 0 : itemCount - 1;
      setCartItemQuantity(product, nextQty);
    }
  }, [product, itemCount, minQty, setCartItemQuantity]);

  if (loading) {
    return (
      <div className="pd-loading">
        <div className="pd-spinner" />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) return <div className="pd-error">{error}</div>;
  if (!product) return <div className="pd-error">Product not found</div>;

  const isOutOfStock = product.stock === 0;
  const currentImageUrl = getImageUrl(
    images[selectedImage] || "",
    800
  );

  return (
    <>
      <ProductSEO
        name={product.name}
        description={product.description}
        price={product.price}
        image={currentImageUrl}
        url={window.location.href}
        sku={product.sku}
        category={product.category?.name}
        stock={product.stock}
        rating={product.rating}
        reviews={product.reviews}
      />

      <div className="pd-page">
        <div className="pd-container">
          {/* ===== GALLERY ===== */}
          <div className="pd-gallery">
            <div className="pd-carousel-wrapper">
              {/* Top Badges Row */}
              <div className="pd-badge-row-top">
                {hasDiscount && (
                  <div className="pd-discount-tag">
                    <FaTag size={10} />
                    {product.hotDealType === "FLAT"
                      ? `₹${product.hotDealValue} OFF`
                      : `${discountPercent}% OFF`}
                  </div>
                )}
                <button
                  className={`pd-wishlist-btn ${isWishlisted ? "active" : ""}`}
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  aria-label={
                    isWishlisted
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                >
                  {isWishlisted ? (
                    <FaHeart size={18} />
                  ) : (
                    <FaRegHeart size={18} />
                  )}
                </button>
              </div>

              {/* MRP Circle */}
              {product.mrp && product.mrp > unitPrice && (
                <div className="pd-mrp-badge">
                  <span className="pd-mrp-label">MRP</span>
                  <span className="pd-mrp-val">
                    ₹{product.mrp.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Carousel Track */}
              <div
                className="pd-carousel"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="pd-carousel-track"
                  ref={carouselTrackRef}
                  style={{
                    transform: `translateX(calc(-${selectedImage * 100}%))`,
                    transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                >
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="pd-carousel-slide"
                      onClick={() => setShowZoom(true)}
                    >
                      {!imgLoaded[i] && (
                        <div className="pd-skeleton-loader" />
                      )}
                      <img
                        src={getImageUrl(img, 800)}
                        alt={`${product.name} - ${i + 1}`}
                        className={`pd-carousel-img ${
                          imgLoaded[i] ? "loaded" : ""
                        }`}
                        draggable={false}
                        loading={i === 0 ? "eager" : "lazy"}
                        fetchPriority={i === 0 ? "high" : "auto"}
                        onLoad={() => handleImageLoad(i)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    className="pd-arrow pd-arrow--prev"
                    onClick={() => handleImageChange("prev")}
                    aria-label="Previous image"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <button
                    className="pd-arrow pd-arrow--next"
                    onClick={() => handleImageChange("next")}
                    aria-label="Next image"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Dot Indicators */}
              {images.length > 1 && (
                <div className="pd-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`pd-dot ${
                        selectedImage === i ? "active" : ""
                      }`}
                      onClick={() => handleSelectImage(i)}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails (Desktop) */}
            {images.length > 1 && (
              <div className="pd-thumbs-row" ref={thumbnailRef}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`pd-thumb ${
                      selectedImage === i ? "active" : ""
                    }`}
                    onClick={() => handleSelectImage(i)}
                  >
                    <img
                      src={getImageUrl(img, 150)}
                      alt={`Thumbnail ${i + 1}`}
                      loading="lazy"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== INFO SECTION ===== */}
          <div className="pd-info">
            {/* Title + Share */}
            <div className="pd-info-card pd-header-card">
              <div className="pd-title-row">
                <h1 className="pd-title">{product.name}</h1>
                <button
                  onClick={handleShare}
                  className="pd-icon-btn"
                  title="Share Product"
                >
                  <FiShare2 size={18} />
                </button>
              </div>

              {/* Timer */}
              {timeLeft && (
                <div className="pd-timer">
                  <FiClock className="pd-timer-pulse" />
                  <span>Deal Ends in</span>
                  <strong>{timeLeft}</strong>
                </div>
              )}

              {/* Meta Chips */}
              <div className="pd-chips">
                {product.sku && (
                  <span className="pd-chip sku">
                    <FiHash size={12} /> {product.sku}
                  </span>
                )}
                {(product.rating || product.reviews) && (
                  <span className="pd-chip rating">
                    <FiStar size={12} fill="#FBC02D" stroke="none" />
                    <strong>{product.rating || 4.5}</strong>
                    {product.reviews && (
                      <span className="pd-chip-sub">
                        ({product.reviews})
                      </span>
                    )}
                  </span>
                )}
                {product.tagline && (
                  <span className="pd-chip tag">
                    <FiTag size={12} /> {product.tagline}
                  </span>
                )}
                {product.packSize && (
                  <span className="pd-chip box">
                    <FiBox size={12} /> {product.packSize}
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="pd-stock-row">
                {isOutOfStock ? (
                  <span className="pd-stock out">
                    <FiAlertCircle size={14} /> Out of Stock
                  </span>
                ) : product.stock && product.stock <= 10 ? (
                  <span className="pd-stock low">
                    <FiAlertCircle size={14} /> Only {product.stock} left!
                  </span>
                ) : (
                  <span className="pd-stock in">
                    <FiCheckCircle size={14} /> In Stock
                  </span>
                )}
              </div>
            </div>

            {/* Price Block */}
            <div className="pd-info-card pd-price-card">
              <div className="pd-price-top">
                <div className="pd-price-main">
                  <span className="pd-price-now">
                    ₹{unitPrice.toFixed(0)}
                  </span>
                  {product.mrp && product.mrp > unitPrice && (
                    <span className="pd-price-was">
                      ₹{product.mrp.toFixed(0)}
                    </span>
                  )}
                </div>
                {hasDiscount && product.mrp && (
                  <div className="pd-save-pill">
                    You Save ₹{(product.mrp - unitPrice).toFixed(0)}
                  </div>
                )}
              </div>
              <div className="pd-moq-notice">
                <FiInfo size={13} />
                <span>
                  Minimum Order: <strong>{minQty} units</strong>
                </span>
              </div>
            </div>

            {/* Cart Actions */}
            <div className="pd-info-card pd-actions-card">
              {itemCount === 0 ? (
                <button
                  className="pd-add-btn"
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? (
                    <>
                      <FiShield size={18} /> Notify When Available
                    </>
                  ) : (
                    <>
                      <FiShoppingCart size={18} /> Add to Cart
                    </>
                  )}
                </button>
              ) : (
                <div className="pd-qty-controls">
                  <button
                    onClick={handleDec}
                    className="pd-qty-btn dec"
                    aria-label="Decrease"
                  >
                    {itemCount === minQty ? "✕" : <FiMinus size={18} />}
                  </button>
                  <div className="pd-qty-display">
                    <span className="pd-qty-num">{itemCount}</span>
                    <span className="pd-qty-label">in cart</span>
                  </div>
                  <button
                    onClick={handleInc}
                    className="pd-qty-btn inc"
                    disabled={
                      product.stock !== undefined &&
                      itemCount >= product.stock
                    }
                    aria-label="Increase"
                  >
                    <FiPlus size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Description Accordion */}
            {product.description && (
              <div
                className={`pd-info-card pd-accordion ${
                  isDescriptionExpanded ? "open" : ""
                }`}
              >
                <button
                  className="pd-accordion-header"
                  onClick={toggleDescription}
                >
                  <h3>Product Description</h3>
                  <span className="pd-accordion-icon">
                    {isDescriptionExpanded ? (
                      <FiChevronUp size={20} />
                    ) : (
                      <FiChevronDown size={20} />
                    )}
                  </span>
                </button>
                <div className="pd-accordion-body">
                  <div className="pd-accordion-content">
                    {product.description
                      .split("\n")
                      .filter((l) => l.trim())
                      .map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trust Badges */}
            <div className="pd-trust-grid">
              <div className="pd-trust-item">
                <div className="pd-trust-icon">
                  <FiShield size={20} />
                </div>
                <div className="pd-trust-text">
                  <strong>Secure Payment</strong>
                  <span>100% safe checkout</span>
                </div>
              </div>
              <div className="pd-trust-item">
                <div className="pd-trust-icon">
                  <FiTruck size={20} />
                </div>
                <div className="pd-trust-text">
                  <strong>Fast Delivery</strong>
                  <span>2-4 business days</span>
                </div>
              </div>
              <div className="pd-trust-item">
                <div className="pd-trust-icon">
                  <FiRefreshCw size={20} />
                </div>
                <div className="pd-trust-text">
                  <strong>Easy Returns</strong>
                  <span>Hassle-free policy</span>
                </div>
              </div>
              <div className="pd-trust-item">
                <div className="pd-trust-icon">
                  <FiCheckCircle size={20} />
                </div>
                <div className="pd-trust-text">
                  <strong>Quality Assured</strong>
                  <span>Premium products</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="pd-section-wrap">
          <Suspense fallback={<div className="pd-loading" style={{ minHeight: "200px" }} />}>
            <ReviewSection productId={product._id} />
          </Suspense>
        </div>

        {/* Related Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="pd-section-wrap">
            <h3 className="pd-section-heading">You May Also Like</h3>
            <div className="pd-related-grid">
              {product.relatedProducts.map((rel, i) => (
                <div key={rel._id} className="pd-related-cell">
                  <Suspense fallback={<div className="pd-loading" style={{ minHeight: "250px" }} />}>
                    <ProductCard
                      product={rel}
                      userRole="customer"
                      index={i + 4}
                    />
                  </Suspense>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {showZoom && (
        <div
          className="pd-zoom-overlay"
          onClick={() => setShowZoom(false)}
        >
          <div
            className="pd-zoom-body"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={currentImageUrl} alt={product.name} />
            <button
              className="pd-zoom-x"
              onClick={() => setShowZoom(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <div className="pd-mobile-bar">
        <div className="pd-mobile-price-col">
          <span className="pd-mobile-price">₹{unitPrice.toFixed(0)}</span>
          {product.mrp && product.mrp > unitPrice && (
            <span className="pd-mobile-mrp">₹{product.mrp.toFixed(0)}</span>
          )}
        </div>
        {itemCount === 0 ? (
          <button
            className="pd-mobile-cart-btn"
            onClick={handleAdd}
            disabled={isOutOfStock}
          >
            <FiShoppingCart size={16} />
            {isOutOfStock ? "Notify Me" : "Add to Cart"}
          </button>
        ) : (
          <div className="pd-mobile-qty">
            <button onClick={handleDec} className="pd-mq-btn dec">
              {itemCount === minQty ? "✕" : <FiMinus size={16} />}
            </button>
            <span className="pd-mq-val">{itemCount}</span>
            <button
              onClick={handleInc}
              className="pd-mq-btn inc"
              disabled={
                product.stock !== undefined && itemCount >= product.stock
              }
            >
              <FiPlus size={16} />
            </button>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <FloatingCheckoutButton />
      </Suspense>
    </>
  );
};

export default ProductDetails;