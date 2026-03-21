import React, { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import {
  FiStar,
  FiCheckCircle,
  FiX,
  FiThumbsUp,
  FiChevronRight
} from "react-icons/fi";
import Swal from "sweetalert2";
import "../styles/ReviewSection.css";

type Review = {
  _id: string;
  shopName: string;
  rating: number;
  createdAt?: string;
};

const ReviewSection = ({ productId }: { productId: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (showAllReviews) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showAllReviews]);

  useEffect(() => {
    setShowAllReviews(false);
  }, [filterStars]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/${productId}`);
      setReviews(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    const counts = [0, 0, 0, 0, 0]; 
    let sum = 0;

    reviews.forEach((r) => {
      const idx = Math.max(1, Math.min(5, r.rating)) - 1;
      counts[idx] += 1;
      sum += r.rating;
    });

    const avg = total > 0 ? sum / total : 0;
    return {
      total,
      avg: avg.toFixed(1),
      counts, 
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (!filterStars) return reviews;
    return reviews.filter((r) => Math.floor(r.rating) === filterStars);
  }, [reviews, filterStars]);

  const displayedReviews = filteredReviews.slice(0, 3);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "R";
  };

  const renderReviewCard = (r: Review, isSidebar = false) => (
    <div key={r._id} className={`kt-card ${isSidebar ? "sidebar-card" : ""}`}>
      <div className="kt-user">
        <div className="kt-avatar">{getInitials(r.shopName)}</div>
        <div className="kt-user__info">
          <div className="kt-user__name">{r.shopName}</div>
          <div className="kt-user__badge">
            <FiCheckCircle className="badge-icon"/> Verified Retailer
          </div>
        </div>
      </div>

      {/* Sirf Stars aur Date show hoga */}
      <div className="kt-review-meta" style={{ marginBottom: "15px" }}>
        <div className="kt-rating">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} className={i < r.rating ? "on fill-star" : "off"} />
          ))}
        </div>
        <span className="kt-date" style={{ marginLeft: "10px" }}>Rated on {formatDate(r.createdAt)}</span>
      </div>

      <div className="kt-card__actions">
        <span className="helpful-text">Was this rating helpful?</span>
        <button className="kt-helpful-btn" onClick={() => Swal.fire({title: 'Thank you for your feedback.', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false})}>
          <FiThumbsUp /> Helpful
        </button>
      </div>
    </div>
  );

  return (
    <section className="kt-review-wrap">
      
      <div className="kt-header">
        <h2 className="kt-main-title">Customer Ratings</h2>
      </div>

      <div className="kt-grid">
        <div className="kt-summary-col">
          <div className="kt-summary">
            <div className="kt-score">
              <div className="kt-score__num">{stats.avg}</div>
              <div className="kt-score__stars">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className={i < Math.round(Number(stats.avg)) ? "on fill-star" : "off"} />
                ))}
              </div>
              <div className="kt-score__meta">Based on {stats.total} ratings</div>
            </div>

            <div className="kt-summary__bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.counts[star - 1] || 0;
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                const active = filterStars === star;

                return (
                  <button
                    type="button"
                    key={star}
                    className={`kt-bar-row ${active ? "is-active" : ""}`}
                    onClick={() => setFilterStars((prev) => (prev === star ? null : star))}
                  >
                    <span className="kt-star-num">{star} star</span>
                    <div className="kt-bar">
                      <div className="kt-bar__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="kt-bar-pct">{Math.round(pct)}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="kt-list">
          <div className="kt-list__head">
            <h4>{filterStars ? `Showing ${filterStars} Star Ratings` : "All Ratings"}</h4>
            {filterStars && (
               <button className="kt-clear-filter" onClick={() => setFilterStars(null)}>
                 Clear filter <FiX />
               </button>
            )}
          </div>

          {loading ? (
            <div className="kt-skeleton">
              {[...Array(3)].map((_, i) => <div key={i} className="kt-skel-card" />)}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="kt-empty">
              <h5>No ratings yet</h5>
              <p>Be the first to rate this product.</p>
            </div>
          ) : (
            <div className="kt-cards-wrapper">
              <div className="kt-cards">
                {displayedReviews.map((r) => renderReviewCard(r, false))}
              </div>

              {filteredReviews.length > 3 && (
                <button 
                  className="kt-view-all-btn" 
                  onClick={() => setShowAllReviews(true)}
                >
                  View All {filteredReviews.length} Ratings <FiChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showAllReviews && (
        <div className="kt-sidebar-overlay" onClick={() => setShowAllReviews(false)}>
          <div className="kt-sidebar-panel" onClick={(e) => e.stopPropagation()}>
            <div className="kt-sidebar-header">
              <h3>All Ratings ({filteredReviews.length})</h3>
              <button className="kt-sidebar-close" onClick={() => setShowAllReviews(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="kt-sidebar-body">
              <div className="kt-cards">
                {filteredReviews.map((r) => renderReviewCard(r, true))}
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default ReviewSection;