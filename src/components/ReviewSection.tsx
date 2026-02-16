import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  FiStar,
  FiUser,
  FiLock,
  FiCheckCircle,
  FiTrendingUp,
  FiFilter,
  FiX,
  FiSend,
  FiMessageSquare,
  FiEdit2, // ✅ ADD THIS
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

const positiveTags = [
  "Excellent Quality",
  "Fast Shipping",
  "Best Wholesale Price",
  "Great Stock",
  "Strong Packaging",
];

const negativeTags = [
  "Stock Issue",
  "Delay in Delivery",
  "Damaged Toy",
  "Pricing High",
  "Wrong Item Sent",
];

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

  useEffect(() => {
    checkUserLogin();
  }, []);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

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
    const counts = [0, 0, 0, 0, 0]; // index 0=1 star ... 4=5 star
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
      counts, // 1..5
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (!filterStars) return reviews;
    return reviews.filter((r) => r.rating === filterStars);
  }, [reviews, filterStars]);

  const getRatingStatus = (rating: number) => {
    if (rating >= 4)
      return { text: "Highly Satisfied", tone: "good", tags: positiveTags };
    if (rating === 3)
      return {
        text: "Satisfactory",
        tone: "mid",
        tags: [...positiveTags.slice(0, 2), ...negativeTags.slice(0, 2)],
      };
    return { text: "Need Improvement", tone: "bad", tags: negativeTags };
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
      Swal.fire({ icon: "warning", title: "Write something first" });
      return;
    }

    try {
      await api.post("/reviews/add", { ...newReview, productId });

      Swal.fire({
        icon: "success",
        title: "Review Published!",
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false,
      });

      setNewReview((prev) => ({ ...prev, comment: "", rating: 5 }));
      setHoverRating(0);
      setMobileComposerOpen(false);
      fetchReviews();
    } catch (err) {
      Swal.fire("Error", "Action failed", "error");
    }
  };

  const Composer = ({ variant }: { variant: "desktop" | "mobile" }) => {
    const status = getRatingStatus(newReview.rating);

    return (
      <div className={`kt-composer ${variant === "mobile" ? "kt-composer--mobile" : ""}`}>
        <div className="kt-composer__head">
          <div>
            <div className="kt-composer__title">
              <FiMessageSquare /> Share Shop Experience
            </div>
            <div className="kt-composer__sub">
              Shop: <b>{currentShopName || "Verified Retailer"}</b>
            </div>
          </div>

          {variant === "mobile" && (
            <button
              className="kt-icon-btn"
              type="button"
              onClick={() => setMobileComposerOpen(false)}
              aria-label="Close"
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="kt-stars">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              type="button"
              key={num}
              className={`kt-star-btn ${
                (hoverRating || newReview.rating) >= num ? "is-active" : ""
              }`}
              onMouseEnter={() => setHoverRating(num)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setNewReview({ ...newReview, rating: num })}
              aria-label={`${num} star`}
            >
              <FiStar />
            </button>
          ))}

          <span className={`kt-badge kt-badge--${status.tone}`}>{status.text}</span>
        </div>

        <div className="kt-tags">
          {status.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="kt-chip"
              onClick={() => handleTagClick(tag)}
            >
              + {tag}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="kt-form">
          <textarea
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            placeholder="Tap tags or write your experience..."
            required
          />
          <button type="submit" className="kt-primary-btn">
            <FiSend /> Publish Review
          </button>
        </form>
      </div>
    );
  };

  return (
    <section className="kt-review-wrap">
      {/* Top Header */}
      <div className="kt-header">
        <div className="kt-header__left">
          <div className="kt-title">
            <span className="kt-title__icon">
              <FiTrendingUp />
            </span>
            <div>
              <h3>KeyToys Shop Reviews</h3>
              <p>Wholesale buyers ki real feedback (Verified Shops)</p>
            </div>
          </div>
        </div>

        <div className="kt-header__right">
          <button
            className={`kt-filter-pill ${filterStars ? "is-on" : ""}`}
            type="button"
            onClick={() => setFilterStars((p) => (p ? null : 5))}
            title="Quick filter"
          >
            <FiFilter /> {filterStars ? `${filterStars}★ Only` : "Quick Filter"}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="kt-summary">
        <div className="kt-summary__score">
          <div className="kt-score">
            <div className="kt-score__num">{stats.avg}</div>
            <div className="kt-score__stars">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className={i < Math.round(Number(stats.avg)) ? "on" : "off"} />
              ))}
            </div>
            <div className="kt-score__meta">{stats.total} total feedbacks</div>
          </div>
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
                aria-label={`Filter ${star} stars`}
              >
                <div className="kt-bar-row__label">
                  <span className="kt-star-num">{star}</span>
                  <FiStar className="kt-mini-star" />
                </div>

                <div className="kt-bar">
                  <div className="kt-bar__fill" style={{ width: `${pct}%` }} />
                </div>

                <div className="kt-bar-row__count">{count}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout */}
      <div className="kt-grid">
        {/* Reviews list */}
        <div className="kt-list">
          <div className="kt-list__head">
            <h4>Latest Shop Experiences</h4>
            <div className="kt-list__meta">
              {filterStars ? (
                <span className="kt-small">
                  Showing <b>{filterStars}★</b> reviews{" "}
                  <button className="kt-link" onClick={() => setFilterStars(null)}>
                    Clear
                  </button>
                </span>
              ) : (
                <span className="kt-small">Tap any bar to filter</span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="kt-skeleton">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="kt-skel-card" />
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="kt-empty">
              <div className="kt-empty__icon">
                <FiMessageSquare />
              </div>
              <h5>No reviews yet</h5>
              <p>Be the first verified shop to share experience.</p>
            </div>
          ) : (
            <div className="kt-cards">
              {filteredReviews.map((r) => (
                <div key={r._id} className="kt-card">
                  <div className="kt-card__top">
                    <div className="kt-user">
                      <div className="kt-avatar">
                        <FiUser />
                      </div>
                      <div className="kt-user__info">
                        <div className="kt-user__name">{r.shopName}</div>
                        <div className="kt-user__badge">
                          <FiCheckCircle /> Verified Shop
                        </div>
                      </div>
                    </div>

                    <div className="kt-rating">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className={i < r.rating ? "on" : "off"} />
                      ))}
                    </div>
                  </div>

                  <p className="kt-card__text">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Composer */}
        <aside className="kt-side">
          {isLoggedIn ? (
            <div className="kt-sticky">
              <Composer variant="desktop" />
            </div>
          ) : (
            <div className="kt-login">
              <div className="kt-login__icon">
                <FiLock />
              </div>
              <h4>Retailer Verification Required</h4>
              <p>Sign in as a shop to post wholesale feedback.</p>
              <button className="kt-primary-btn" onClick={() => navigate("/login")}>
                Login to Review
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile: floating action button */}
      {isLoggedIn && (
        <button
          className="kt-fab"
          type="button"
          onClick={() => setMobileComposerOpen(true)}
          aria-label="Write a review"
        >
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
