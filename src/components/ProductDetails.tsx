import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/ProductDetails.css";
import BulkPricingTable, { Tier } from "./BulkPricingTable";
import { FiShoppingCart } from "react-icons/fi";
import { FaBoxOpen, FaTag } from "react-icons/fa";
import { useShop } from "../context/ShopContext";
import FloatingCheckoutButton from "../components/FloatingCheckoutButton";
import { getImageUrl } from "../utils/image";
import ProductSEO from "./ProductSEO"; // ✅ SEO Component

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
  const [imgLoaded, setImgLoaded] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { cartItems, addToCart, setCartItemQuantity, removeFromCart } = useShop();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isApproved = user?.isApproved;

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
        console.error("Failed loading product", err);
        setError("Failed to load product. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!product?.images || product.images.length <= 1) return;
    const diffX = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50;
    if (Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0) {
        setSelectedImage((prev) =>
          prev === product.images!.length - 1 ? 0 : prev + 1
        );
      } else {
        setSelectedImage((prev) =>
          prev === 0 ? product.images!.length - 1 : prev - 1
        );
      }
      setImgLoaded(false);
    }
  };

  if (loading)
    return (
      <div className="loading-container">
        <p>Loading product details…</p>
      </div>
    );
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return <div className="error-message">Product not found</div>;

  const productInCart = cartItems.find((item) => item._id === product._id);

  let baseImage = "";
  if (product.images && product.images.length > 0) {
    baseImage = product.images[selectedImage] || product.image || "";
  } else {
    baseImage = product.image || "";
  }
  const imageUrl = getImageUrl(baseImage, 800);

  const sortedTiers = Array.isArray(product.bulkPricing)
    ? [...product.bulkPricing].sort(
        (a, b) => parseInt(a.inner) - parseInt(b.inner)
      )
    : [];

  const activeTier =
    sortedTiers.length > 0
      ? sortedTiers.reduce(
          (prev, tier) =>
            (productInCart?.quantity || quantity) >= parseInt(tier.inner)
              ? tier
              : prev,
          sortedTiers[0]
        )
      : undefined;

  const piecesPerInner =
    product.innerQty && product.innerQty > 0
      ? product.innerQty
      : sortedTiers.length > 0 && parseInt(sortedTiers[0].inner) > 0
      ? sortedTiers[0].qty / parseInt(sortedTiers[0].inner)
      : 1;

  const unitPrice = activeTier ? activeTier.price : product.price;

  const tiersForTable: Tier[] = sortedTiers.map((t) => ({
    inner: parseInt(t.inner),
    price: t.price,
    qty: t.qty,
  }));

  const handleSelectImage = (index: number) => {
    setSelectedImage(index);
    setImgLoaded(false);
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ✅ SEO setup
  const productUrl = `https://bafnatoys.com/product/${product._id}`;

  return (
    <>
      {/* ✅ SEO Meta Tags */}
      <ProductSEO
        name={product.name}
        description={product.description}
        price={product.price}
        image={imageUrl}
        url={productUrl}
      />

      <div className="product-details-container">
        {/* ✅ Product Gallery */}
        <div className="product-gallery">
          <div
            className="main-image-container"
            ref={imageContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {!imgLoaded && (
              <img
                src={getImageUrl(baseImage, 30)} // low-res blur-up
                alt="preview"
                className="main-image low-quality"
                width="30"
                height="30"
              />
            )}

            <picture>
              <source srcSet={getImageUrl(baseImage, 800)} type="image/webp" />
              <img
                src={imageUrl}
                alt={product.name}
                className={`main-image blur-up ${imgLoaded ? "loaded" : ""}`}
                width="800"
                height="800"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
              />
            </picture>

            {isApproved && product.price && (
              <div className="discount-badge">
                <FaTag className="discount-icon" />
                ₹{unitPrice.toFixed(2)}
              </div>
            )}
          </div>

          {/* ✅ Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-container">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img, 150)}
                  srcSet={`${getImageUrl(img, 150)} 150w, ${getImageUrl(
                    img,
                    300
                  )} 300w`}
                  sizes="(max-width: 768px) 150px, 300px"
                  alt={`${product.name} thumbnail ${i + 1}`}
                  className={`thumbnail ${
                    selectedImage === i ? "active" : ""
                  }`}
                  width="150"
                  height="150"
                  loading="lazy"
                  decoding="async"
                  onClick={() => handleSelectImage(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ✅ Product Info */}
        <div className="product-info">
          <div className="product-header">
            <h1 className="product-title">{product.name}</h1>
            <div className="price-section">
              {isApproved ? (
                <span className="current-price">₹{unitPrice.toFixed(2)}</span>
              ) : (
                <span className="locked-message">
                  🔒 Price visible after admin approval
                </span>
              )}
            </div>
          </div>

          {/* ✅ Bulk Pricing */}
          <div className="bulk-pricing-section">
            <div className="section-header">
              <h3 className="section-title">📊 Bulk Pricing</h3>
              <div className="pieces-info">
                <FaBoxOpen className="box-icon" />
                {piecesPerInner} pieces per inner
              </div>
            </div>

            {isApproved ? (
              tiersForTable.length > 0 ? (
                <div className="table-responsive">
                  <BulkPricingTable
                    innerQty={piecesPerInner}
                    tiers={tiersForTable}
                    selectedInner={productInCart?.quantity || quantity}
                  />
                </div>
              ) : (
                <div className="no-bulk-pricing">
                  No bulk pricing tiers available.
                </div>
              )
            ) : (
              <p className="locked-message">
                🔒 Bulk pricing available after admin approval
              </p>
            )}
          </div>

          {/* ✅ Quantity Section */}
          {isApproved && (
            <div className="quantity-section">
              <h3 className="section-title">🔢 Quantity (Inners)</h3>
              {productInCart ? (
                <div className="quantity-controls">
                  <button
                    onClick={() => {
                      const newQty = productInCart.quantity - 1;
                      if (newQty <= 0) {
                        removeFromCart(product._id);
                      } else {
                        setCartItemQuantity(productInCart, newQty);
                      }
                    }}
                    className="quantity-button"
                  >
                    −
                  </button>
                  <span className="quantity-display">
                    {productInCart.quantity}
                  </span>
                  <button
                    onClick={() =>
                      setCartItemQuantity(
                        productInCart,
                        productInCart.quantity + 1
                      )
                    }
                    className="quantity-button"
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="action-buttons-row">
                  <button
                    className="add-to-cart-button"
                    onClick={() => {
                      addToCart(
                        {
                          ...product,
                          bulkPricing: product.bulkPricing.map((t) => ({
                            inner: parseInt(t.inner),
                            qty: t.qty,
                            price: t.price,
                          })),
                        },
                        quantity
                      );
                    }}
                  >
                    <FiShoppingCart className="cart-icon" />
                    Add to Cart
                  </button>
                  <button
                    className="buy-now-button"
                    onClick={() => {
                      addToCart(
                        {
                          ...product,
                          bulkPricing: product.bulkPricing.map((t) => ({
                            inner: parseInt(t.inner),
                            qty: t.qty,
                            price: t.price,
                          })),
                        },
                        quantity
                      );
                      navigate("/cart");
                    }}
                  >
                    🛒 Buy Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ✅ Product Description Lazy Load */}
          {product.description && (
            <Suspense fallback={<p>Loading description…</p>}>
              <div
                className="description-section"
                style={{ marginTop: "1.5rem" }}
              >
                <div className="section-header">
                  <h3 className="section-title">📋 Product Description</h3>
                </div>
                <div className="description-content expanded">
                  <ul className="description-list">
                    {product.description
                      .split("\n")
                      .filter((line) => line.trim() !== "")
                      .map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </Suspense>
          )}
        </div>
      </div>

      <div style={{ height: 84 }} />
      <FloatingCheckoutButton />
    </>
  );
};

export default ProductDetails;
