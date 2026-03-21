import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  FiStar,
  FiCheckCircle,
  FiX,
  FiThumbsUp,
  FiEdit2,
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

// ✅ NAYA STAR LABEL FUNCTION
const STAR_LABELS: Record<number, string> = {
  5: "Highly Satisfied",
  4: "Good",
  3: "Satisfactory",
  2: "Needs Improvement",
  1: "Poor",
};

const ReviewSection = ({ productId }: { productId: string }) => {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentShopName, setCurrentShopName] = useState("");
  const [currentUserId, setCurrentUserId] = useState(""); // ✅ Added User ID to verify order

  const [hoverRating, setHoverRating] = useState(0);
  const [newReview, setNewReview] = useState({
    shopName: "",
    rating: 5,
  });

  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [mobileComposerOpen, setMobileComposerOpen] = useState(false);
  
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    checkUserLogin();
  }, []);

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

  const checkUserLogin = () => {
    const rawData = localStorage.getItem("userInfo") || localStorage.getItem("user");
    if (rawData) {
      const user = JSON.parse(rawData);
      setIsLoggedIn(true);
      setCurrentShopName(user.shopName || "Verified Retailer");
      setCurrentUserId(user._id || user.id || ""); // ✅ Extracted User ID
      setNewReview((prev) => ({ ...prev, shopName: user.shopName || "" }));
    } else {
      setIsLoggedIn(false);
      setCurrentShopName("");
      setCurrentUserId("");
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Must be logged in to rate and verify order
    if (!currentUserId) {
      Swal.fire({ icon: "error", title: "Please login to rate this product" });
      return;
    }

    try {
      // ✅ Payload includes userId for Backend verification. Comment removed.
      await api.post("/reviews/add", { 
        ...newReview, 
        productId,
        userId: currentUserId 
      });

      Swal.fire({ icon: "success", title: "Rating Saved!", toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
      setNewReview((prev) => ({ ...prev, rating: 5 }));
      setHoverRating(0);
      setMobileComposerOpen(false);
      fetchReviews();
    } catch (err: any) {
      // ✅ Show Error if User hasn't purchased or Time Limit Expired
      const errorMessage = err.response?.data?.message || "Failed to submit rating.";
      Swal.fire("Cannot Rate", errorMessage, "warning");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "R";
  };

  const Composer = ({ variant }: { variant: "desktop" | "mobile" }) => {
    // Current text to display based on hover or selected rating
    const activeRating = hoverRating || newReview.rating;
    const ratingText = STAR_LABELS[activeRating];

    return (
      <div className={`kt-composer ${variant === "mobile" ? "kt-composer--mobile" : ""}`}>
        <div className="kt-composer__head">
          <h3 className="kt-composer__title">Rate This Product</h3>
          {variant === "mobile" && (
            <button className="kt-icon-btn" type="button" onClick={() => setMobileComposerOpen(false)}>
              <FiX />
            </button>
          )}
        </div>
        
        <p className="kt-composer__sub">Share your experience with <b>{currentShopName || "our products"}</b></p>

        <form onSubmit={handleSubmit} className="kt-form">
          
          {/* ✅ SMOOTH STARS UI WITH TEXT */}
          <div className="kt-stars-input" style={{ marginBottom: "25px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div className="stars-row" style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  type="button"
                  key={num}
                  style={{ 
                    background: "transparent", 
                    border: "none", 
                    cursor: "pointer", 
                    padding: "0",
                    transition: "transform 0.2s" // Smooth scale effect
                  }}
                  onMouseEnter={() => setHoverRating(num)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setNewReview({ ...newReview, rating: num })}
                  onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
                  onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <FiStar 
                    size={44} 
                    color={activeRating >= num ? "#FFD700" : "#d1d5db"} 
                    fill={activeRating >= num ? "#FFD700" : "none"}
                    style={{ transition: "all 0.2s ease-in-out" }}
                  />
                </button>
              ))}
            </div>
            
            {/* Dynamic Label Display */}
            <div style={{ fontSize: "16px", fontWeight: "bold", color: "#4b5563", minHeight: "24px" }}>
              {ratingText}
            </div>
          </div>

          <button type="submit" className="kt-primary-btn" style={{ width: "100%" }}>
            Submit Rating
          </button>
        </form>
      </div>
    );
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

      <div className="kt-review-meta" style={{ marginBottom: "5px" }}>
        <div className="kt-rating">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} className={i < r.rating ? "on fill-star" : "off"} />
          ))}
        </div>
        <span className="kt-date">Rated on {formatDate(r.createdAt)}</span>
      </div>

      {/* ✅ Displays Rating Text instead of Comment */}
      <div style={{ marginBottom: "15px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
         {STAR_LABELS[r.rating]}
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

          <div className="kt-side">
            {isLoggedIn ? (
              <Composer variant="desktop" />
            ) : (
              <div className="kt-login">
                <h4>Rate this product</h4>
                <p>Share your rating with other wholesale buyers.</p>
                <button className="kt-outline-btn" onClick={() => navigate("/login")}>
                  Login to Rate
                </button>
              </div>
            )}
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

      {isLoggedIn && (
        <button className="kt-fab" type="button" onClick={() => setMobileComposerOpen(true)}>
          <FiEdit2 /> Rate Product
        </button>
      )}

      {isLoggedIn && mobileComposerOpen && (
        <div className="kt-sheet">
          <div className="kt-sheet__backdrop" onClick={() => setMobileComposerOpen(false)} />
          <div className="kt-sheet__panel">
            <Composer variant="mobile" />
          </div>
        </div>
      )}
    </section>
  );
};

export default ReviewSection;