import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  FiStar,
  FiLock,
  FiCheckCircle,
  FiFilter,
  FiX,
  FiThumbsUp,
  FiEdit2,
  FiChevronRight // ✅ Added for Sidebar Arrow
} from "react-icons/fi";
import Swal from "sweetalert2";
import "../styles/ReviewSection.css";

type Review = {
  _id: string;
  shopName: string;
  rating: number;
  comment: string;
  createdAt?: string;
};

const positiveTags = ["Excellent Quality", "Fast Shipping", "Best Wholesale Price", "Great Stock", "Strong Packaging"];
const negativeTags = ["Stock Issue", "Delay in Delivery", "Damaged Toy", "Pricing High", "Wrong Item Sent"];

const ReviewSection = ({ productId }: { productId: string }) => {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentShopName, setCurrentShopName] = useState("");

  const [hoverRating, setHoverRating] = useState(0);
  const [newReview, setNewReview] = useState({
    shopName: "",
    rating: 5,
    comment: "",
  });

  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [mobileComposerOpen, setMobileComposerOpen] = useState(false);
  
  // ✅ STATE: For handling Meesho style Sidebar
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    checkUserLogin();
  }, []);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // ✅ Block body scroll when sidebar is open
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
      setNewReview((prev) => ({ ...prev, shopName: user.shopName || "" }));
    } else {
      setIsLoggedIn(false);
      setCurrentShopName("");
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

  // ✅ Main page always shows only top 3 reviews
  const displayedReviews = filteredReviews.slice(0, 3);

  const getRatingStatus = (rating: number) => {
    if (rating >= 4) return { text: "Highly Satisfied", tone: "good", tags: positiveTags };
    if (rating === 3) return { text: "Satisfactory", tone: "mid", tags: [...positiveTags.slice(0, 2), ...negativeTags.slice(0, 2)] };
    return { text: "Needs Improvement", tone: "bad", tags: negativeTags };
  };

  const handleTagClick = (tag: string) => {
    setNewReview((prev) => ({
      ...prev,
      comment: prev.comment ? `${prev.comment}, ${tag}` : tag,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      Swal.fire({ icon: "warning", title: "Please write a review" });
      return;
    }
    try {
      await api.post("/reviews/add", { ...newReview, productId });
      Swal.fire({ icon: "success", title: "Review Published!", toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
      setNewReview((prev) => ({ ...prev, comment: "", rating: 5 }));
      setHoverRating(0);
      setMobileComposerOpen(false);
      fetchReviews();
    } catch (err) {
      Swal.fire("Error", "Failed to submit review", "error");
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
    const status = getRatingStatus(newReview.rating);

    return (
      <div className={`kt-composer ${variant === "mobile" ? "kt-composer--mobile" : ""}`}>
        <div className="kt-composer__head">
          <h3 className="kt-composer__title">Write a Review</h3>
          {variant === "mobile" && (
            <button className="kt-icon-btn" type="button" onClick={() => setMobileComposerOpen(false)}>
              <FiX />
            </button>
          )}
        </div>
        
        <p className="kt-composer__sub">Share your experience with <b>{currentShopName || "our products"}</b></p>

        <div className="kt-stars-input">
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                type="button"
                key={num}
                className={`kt-star-btn ${ (hoverRating || newReview.rating) >= num ? "is-active" : "" }`}
                onMouseEnter={() => setHoverRating(num)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setNewReview({ ...newReview, rating: num })}
              >
                <FiStar className={(hoverRating || newReview.rating) >= num ? "fill-star" : ""} />
              </button>
            ))}
          </div>
          <span className={`kt-badge kt-badge--${status.tone}`}>{status.text}</span>
        </div>

        <div className="kt-tags">
          {status.tags.map((tag) => (
            <button key={tag} type="button" className="kt-chip" onClick={() => handleTagClick(tag)}>
              {tag}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="kt-form">
          <textarea
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            placeholder="What did you like or dislike? How is the product quality?"
            required
          />
          <button type="submit" className="kt-primary-btn">
            Submit Review
          </button>
        </form>
      </div>
    );
  };

  // Helper to render a single review card (reused in main page and sidebar)
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

      <div className="kt-review-meta">
        <div className="kt-rating">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} className={i < r.rating ? "on fill-star" : "off"} />
          ))}
        </div>
        <span className="kt-date">Posted on {formatDate(r.createdAt)}</span>
      </div>

      <p className="kt-card__text">{r.comment}</p>

      <div className="kt-card__actions">
        <span className="helpful-text">Was this review helpful?</span>
        <button className="kt-helpful-btn" onClick={() => Swal.fire({title: 'Thank you for your feedback.', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false})}>
          <FiThumbsUp /> Helpful
        </button>
      </div>
    </div>
  );

  return (
    <section className="kt-review-wrap">
      
      {/* Header Title */}
      <div className="kt-header">
        <h2 className="kt-main-title">Customer Reviews</h2>
      </div>

      <div className="kt-grid">
        {/* Left Side: Summary Panel */}
        <div className="kt-summary-col">
          <div className="kt-summary">
            <div className="kt-score">
              <div className="kt-score__num">{stats.avg}</div>
              <div className="kt-score__stars">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className={i < Math.round(Number(stats.avg)) ? "on fill-star" : "off"} />
                ))}
              </div>
              <div className="kt-score__meta">Based on {stats.total} reviews</div>
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
                <h4>Review this product</h4>
                <p>Share your thoughts with other wholesale buyers.</p>
                <button className="kt-outline-btn" onClick={() => navigate("/login")}>
                  Write a review
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Reviews List */}
        <div className="kt-list">
          <div className="kt-list__head">
            <h4>{filterStars ? `Showing ${filterStars} Star Reviews` : "All Reviews"}</h4>
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
              <h5>No reviews yet</h5>
              <p>Be the first to review this product.</p>
            </div>
          ) : (
            <div className="kt-cards-wrapper">
              <div className="kt-cards">
                {displayedReviews.map((r) => renderReviewCard(r, false))}
              </div>

              {/* ✅ VIEW ALL BUTTON */}
              {filteredReviews.length > 3 && (
                <button 
                  className="kt-view-all-btn" 
                  onClick={() => setShowAllReviews(true)}
                >
                  View All {filteredReviews.length} Reviews <FiChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ MEESHO STYLE SIDEBAR FOR ALL REVIEWS */}
      {showAllReviews && (
        <div className="kt-sidebar-overlay" onClick={() => setShowAllReviews(false)}>
          <div className="kt-sidebar-panel" onClick={(e) => e.stopPropagation()}>
            <div className="kt-sidebar-header">
              <h3>All Reviews ({filteredReviews.length})</h3>
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

      {/* Mobile: floating action button */}
      {isLoggedIn && (
        <button className="kt-fab" type="button" onClick={() => setMobileComposerOpen(true)}>
          <FiEdit2 /> Write Review
        </button>
      )}

      {/* Mobile: composer bottom sheet */}
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