import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { FiStar, FiUser, FiMessageSquare, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import Swal from "sweetalert2";
import "../styles/ReviewSection.css";

const ReviewSection = ({ productId }: { productId: string }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newReview, setNewReview] = useState({ customerName: "", rating: 5, comment: "" });

  useEffect(() => {
    checkUserLogin();
    fetchReviews();
  }, [productId]);

  const checkUserLogin = () => {
    // ✅ FIX: Check both possible keys in localStorage
    const rawData = localStorage.getItem("userInfo") || localStorage.getItem("user");
    if (rawData) {
      const user = JSON.parse(rawData);
      setIsLoggedIn(true);
      // ✅ FIX: shopName ko priority dein (Registration model uses shopName)
      const name = user.shopName || user.name || user.username || "Customer";
      setCurrentUserName(name);
      setNewReview(prev => ({ ...prev, customerName: name }));
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/${productId}`);
      setReviews(res.data);
    } catch (err) { console.error("Load Error:", err); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ FIX: Ensure customerName (shopName) is sent correctly
    const finalName = newReview.customerName || currentUserName;
    if (!finalName || !newReview.comment.trim()) {
      return Swal.fire("Error", "Shop name and comment are required!", "warning");
    }

    try {
      if (editingId) {
        await api.put(`/reviews/${editingId}`, { rating: newReview.rating, comment: newReview.comment });
        Swal.fire({ icon: 'success', title: 'Updated!', toast: true, position: 'top-end', timer: 2000 });
        setEditingId(null);
      } else {
        await api.post("/reviews/add", { 
          ...newReview, 
          customerName: finalName, 
          productId 
        });
        Swal.fire({ icon: 'success', title: 'Submitted!', toast: true, position: 'top-end', timer: 2000 });
      }
      setNewReview({ ...newReview, comment: "", rating: 5 });
      fetchReviews();
    } catch (err) { 
      Swal.fire("Error", "Action failed. Check if server is running.", "error"); 
    }
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({ title: 'Delete review?', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) {
      await api.delete(`/reviews/${id}`);
      fetchReviews();
    }
  };

  return (
    <div className="review-section-container">
      <h3 className="review-title"><FiMessageSquare /> Customer Reviews</h3>
      <div className="review-list">
        {loading ? <p>Loading...</p> : reviews.length === 0 ? <p className="review-empty">No reviews yet.</p> : reviews.map((r) => (
          <div key={r._id} className="review-card">
            <div className="review-header">
              <div className="review-user">
                <div className="review-avatar"><FiUser /></div>
                <span>{r.customerName} {isLoggedIn && r.customerName === currentUserName && <small>(You)</small>}</span>
              </div>
              <div className="review-actions-wrap">
                <div className="review-stars">
                  {[...Array(5)].map((_, i) => (<FiStar key={i} className={i < r.rating ? "star-filled" : "star-empty"} />))}
                </div>
                {isLoggedIn && r.customerName === currentUserName && (
                  <div className="review-btn-grp">
                    <button onClick={() => { setEditingId(r._id); setNewReview({...newReview, comment: r.comment, rating: r.rating}); }}><FiEdit2 /></button>
                    <button onClick={() => handleDelete(r._id)}><FiTrash2 /></button>
                  </div>
                )}
              </div>
            </div>
            <p className="review-comment">{r.comment}</p>
          </div>
        ))}
      </div>
      <div className="review-form-container">
        <h4>{editingId ? "Edit Review" : "Write a Review"}</h4>
        <form onSubmit={handleSubmit}>
          <label>Posting as Shop: <strong>{newReview.customerName || currentUserName}</strong></label>
          <input type="text" value={newReview.customerName || currentUserName} disabled className="review-input disabled" />
          <textarea value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} placeholder="Your thoughts..." required className="review-textarea" />
          <button type="submit" className="review-submit-btn">{editingId ? "Update" : "Submit"}</button>
        </form>
      </div>
    </div>
  );
};

export default ReviewSection;