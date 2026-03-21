import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import api from '../utils/api';
import { FiStar, FiArrowLeft } from 'react-icons/fi';
import Swal from 'sweetalert2';
import '../styles/PendingReviews.css';

const MEDIA_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MEDIA_URL) ||
  "https://bafnatoys-backend-production.up.railway.app";

const getImageUrl = (url: string) =>
  url?.startsWith("http") ? url : url ? `${MEDIA_BASE}${url}` : "";

const STAR_LABELS: Record<number, string> = {
  1: "Poor 😞",
  2: "Needs Improvement 😕",
  3: "Satisfactory 😐",
  4: "Good 🙂",
  5: "Highly Satisfied 🤩",
};

const STAR_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#84cc16",
  5: "#22c55e",
};

const PendingReviews = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hoverRatings, setHoverRatings] = useState<{ [key: string]: number }>({});
  const [selectedRatings, setSelectedRatings] = useState<{ [key: string]: number }>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeliveredProducts = async () => {
      const rawData = localStorage.getItem("userInfo") || localStorage.getItem("user");
      if (!rawData) {
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(rawData);
      setUser(parsedUser);
      const userId = parsedUser._id || parsedUser.id;

      try {
        const res = await api.get(`/orders?customerId=${userId}`);
        const allOrders = res.data;
        const deliveredOrders = allOrders.filter((o: any) => o.status === 'delivered');

        const productMap = new Map();
        deliveredOrders.forEach((order: any) => {
          order.items.forEach((item: any) => {
            const prodId = item.productId?._id || item.productId;
            if (prodId) {
              productMap.set(prodId, {
                id: prodId,
                name: item.name,
                image: item.image,
              });
            }
          });
        });

        setProducts(Array.from(productMap.values()));
      } catch (err) {
        console.error("Failed to fetch delivered products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveredProducts();
  }, [navigate]);

  const handleStarHover = (productId: string, star: number) => {
    setHoverRatings((prev) => ({ ...prev, [productId]: star }));
  };

  const handleStarLeave = (productId: string) => {
    setHoverRatings((prev) => ({ ...prev, [productId]: 0 }));
  };

  const handleStarClick = (productId: string, star: number) => {
    setSelectedRatings((prev) => ({ ...prev, [productId]: star }));
  };

  const handleSubmitRating = async (productId: string) => {
    if (!user) return;

    const rating = selectedRatings[productId];
    if (!rating) {
      Swal.fire({
        icon: 'warning',
        title: 'Select a Rating',
        text: 'Please tap on the stars to select your rating first.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
        customClass: {
          popup: 'pr-swal-popup',
        },
      });
      return;
    }

    try {
      setSubmittingId(productId);

      await api.post("/reviews/add", {
        productId,
        rating,
        shopName: user.shopName || "Verified Buyer",
        userId: user._id || user.id,
      });

      await Swal.fire({
        icon: 'success',
        title: 'Thank You! 🎉',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
            <div style="display:flex;gap:4px;margin-bottom:4px;">
              ${[1, 2, 3, 4, 5]
                .map(
                  (s) =>
                    `<svg width="22" height="22" viewBox="0 0 24 24" fill="${
                      s <= rating ? STAR_COLORS[rating] : '#e5e7eb'
                    }" stroke="${
                      s <= rating ? STAR_COLORS[rating] : '#e5e7eb'
                    }" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
                )
                .join('')}
            </div>
            <p style="margin:0;font-size:15px;color:#6b7280;">
              Your <strong style="color:${STAR_COLORS[rating]}">${rating}-star</strong> rating has been submitted!
            </p>
            <p style="margin:0;font-size:13px;color:#9ca3af;">${STAR_LABELS[rating]}</p>
          </div>
        `,
        confirmButtonText: 'Great!',
        confirmButtonColor: '#10b981',
        timer: 3000,
        timerProgressBar: true,
        customClass: {
          popup: 'pr-swal-popup pr-swal-success',
          title: 'pr-swal-title',
          htmlContainer: 'pr-swal-html',
          confirmButton: 'pr-swal-confirm',
        },
      });

      setProducts((prev) => prev.filter((p) => p.id !== productId));

      const newSelections = { ...selectedRatings };
      delete newSelections[productId];
      setSelectedRatings(newSelections);

      const newHovers = { ...hoverRatings };
      delete newHovers[productId];
      setHoverRatings(newHovers);

    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: err.response?.data?.message || 'Failed to submit rating. Please try again.',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'pr-swal-popup',
        },
      });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <MainLayout>
      <div className="pr-container">

        {/* Header */}
        <div className="pr-header">
          <button onClick={() => navigate('/my-account')} className="pr-back-btn">
            <FiArrowLeft size={20} />
          </button>
          <div className="pr-header-text">
            <h2 className="pr-title">Rate Your Purchases</h2>
            <p className="pr-subtitle">
              {products.length > 0
                ? `${products.length} product${products.length > 1 ? 's' : ''} waiting for your review`
                : 'All caught up!'}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="pr-loading">
            <div className="pr-spinner"></div>
            <p>Loading your purchases...</p>
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="pr-empty-state">
            <div className="pr-empty-icon">
              <FiStar size={36} />
            </div>
            <h3 className="pr-empty-title">No Pending Reviews</h3>
            <p className="pr-empty-desc">
              You have rated all your delivered products. Great job!
            </p>
            <button className="pr-empty-btn" onClick={() => navigate('/')}>
              Continue Shopping
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="pr-grid">
            {products.map((p: any) => {
              const activeRating = hoverRatings[p.id] || selectedRatings[p.id] || 0;
              const hasSelected = !!selectedRatings[p.id];
              const isSubmitting = submittingId === p.id;
              const activeColor = activeRating > 0 ? STAR_COLORS[activeRating] : '#d1d5db';

              return (
                <div key={p.id} className="pr-card">
                  {/* Accent Bar */}
                  <div
                    className="pr-card-accent"
                    style={{
                      background: hasSelected
                        ? STAR_COLORS[selectedRatings[p.id]]
                        : '#e5e7eb',
                    }}
                  />

                  {/* Image */}
                  <div className="pr-image-wrap">
                    <img
                      src={getImageUrl(p.image)}
                      alt={p.name}
                      className="pr-image"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div className="pr-content">
                    <h4 className="pr-product-name">{p.name}</h4>

                    {/* Stars */}
                    <div className="pr-stars-container">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = activeRating >= star;
                        const fillColor = isFilled ? activeColor : 'none';
                        const strokeColor = isFilled ? activeColor : '#d1d5db';

                        return (
                          <button
                            key={star}
                            type="button"
                            className={`pr-star-btn ${isFilled ? 'filled' : ''}`}
                            onMouseEnter={() => handleStarHover(p.id, star)}
                            onMouseLeave={() => handleStarLeave(p.id)}
                            onClick={() => handleStarClick(p.id, star)}
                            aria-label={`Rate ${star} star`}
                          >
                            <FiStar
                              size={26}
                              color={strokeColor}
                              fill={fillColor}
                              className="pr-star-icon"
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Rating Label */}
                    <div
                      className="pr-rating-text"
                      style={{ color: activeRating > 0 ? activeColor : '#9ca3af' }}
                    >
                      {activeRating > 0 ? STAR_LABELS[activeRating] : 'Tap to rate'}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    className={`pr-submit-btn ${hasSelected ? 'active' : ''}`}
                    onClick={() => handleSubmitRating(p.id)}
                    disabled={!hasSelected || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="pr-btn-spinner"></span>
                    ) : (
                      'Submit Rating'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PendingReviews;