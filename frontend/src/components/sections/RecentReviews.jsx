import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Star, X, ThumbsUp, ThumbsDown, Calendar, ArrowRight, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

// API Base for images
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5003';

// Star rating display — simple inline stars
const StarRating = ({ rating, size = 'sm' }) => {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const color = rating >= 4 ? 'text-emerald-500' : rating >= 3 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${i < rating ? `${color} fill-current` : 'text-slate-200'}`}
        />
      ))}
    </div>
  );
};

// Relative time formatter
const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const RecentReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const navigate = useNavigate();

  // Close modal on Escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') setSelectedReview(null);
  }, []);

  useEffect(() => {
    if (selectedReview) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [selectedReview, handleEscape]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const { data } = await api.get('/reviews/recent');
        if (Array.isArray(data)) {
            setReviews(data);
        } else {
            console.error("Recent reviews data is not an array:", data);
            setReviews([]);
        }
      } catch (err) {
        console.error("Failed to fetch recent reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  // Scroll state tracking
  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [reviews, updateScrollState]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector('.review-card')?.offsetWidth || 340;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -(cardWidth + 20) : (cardWidth + 20),
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-5 overflow-hidden">
            {[1,2,3].map(i => (
              <div key={i} className="min-w-[320px] h-[220px] rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!Array.isArray(reviews) || reviews.length === 0) return null;

  return (
    <section className="rr-section py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-10 sm:mb-12">
          <div>
            <p className="text-indigo-600 font-semibold text-sm tracking-wide uppercase mb-2">
              What People Say
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Recent Reviews
            </h2>
          </div>

          {/* Scroll Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                canScrollLeft 
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 active:scale-95' 
                  : 'border-slate-200 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                canScrollRight 
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 active:scale-95' 
                  : 'border-slate-200 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reviews - Horizontal scroll */}
        <div 
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {reviews.map((review, index) => (
            <div
              key={review._id}
              onClick={() => setSelectedReview(review)}
              className="review-card min-w-[300px] sm:min-w-[340px] max-w-[380px] snap-start flex-shrink-0 cursor-pointer group"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="h-full bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-0.5">
                
                {/* Top: User + Rating */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0 ring-2 ring-white shadow-sm">
                      {review.user.photo ? (
                        <img src={getImageUrl(review.user.photo, API_BASE)} alt={review.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {review.user.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm truncate leading-tight">
                        {review.user.name}
                      </h4>
                      <span className="text-xs text-slate-400">{timeAgo(review.createdAt)}</span>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>

                {/* Review Body */}
                <p className="text-slate-600 text-[14px] leading-relaxed line-clamp-3 flex-grow mb-4">
                  {review.comment}
                </p>

                {/* Company Footer */}
                <div className="pt-4 border-t border-slate-100 mt-auto">
                  <div
                    className="flex items-center gap-2.5 group/company"
                    onClick={(e) => { e.stopPropagation(); navigate(`/company/${review.company.id}`); }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                      {review.company.logo ? (
                        <img src={getImageUrl(review.company.logo, API_BASE)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">{review.company.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-slate-700 text-xs truncate group-hover/company:text-indigo-600 transition-colors">
                        {review.company.name}
                      </h5>
                      <span className="text-[10px] text-slate-400">
                        {review.company.category || 'Textile Company'}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover/company:text-indigo-500 group-hover/company:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Scroll Indicator */}
        <div className="flex sm:hidden justify-center mt-4 gap-1">
          {reviews.slice(0, Math.min(reviews.length, 6)).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          ))}
        </div>
      </div>

      {/* ===== REVIEW DETAIL MODAL ===== */}
      {selectedReview && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setSelectedReview(null)}
          style={{ animation: 'rr-fade-in 0.2s ease-out' }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          {/* Modal */}
          <div 
            className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'rr-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Close */}
            <button 
              onClick={() => setSelectedReview(null)}
              className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="p-6 sm:p-8 overflow-y-auto">
              {/* User */}
              <div className="flex items-center gap-4 mb-6 pr-10">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0 ring-2 ring-white shadow-md">
                  {selectedReview.user.photo ? (
                    <img src={getImageUrl(selectedReview.user.photo, API_BASE)} alt={selectedReview.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-base">
                      {selectedReview.user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                    {selectedReview.user.name}
                  </h3>
                  {selectedReview.createdAt && (
                    <p className="text-sm text-slate-400 mt-0.5">
                      {new Date(selectedReview.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-5">
                <StarRating rating={selectedReview.rating} size="lg" />
                <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {selectedReview.rating}.0
                </span>
              </div>

              {/* Review Text */}
              <p className="text-slate-700 text-[15px] leading-relaxed mb-6 whitespace-pre-wrap break-words">
                {selectedReview.comment}
              </p>

              {/* Deal Again */}
              {selectedReview.wouldDealAgain !== undefined && selectedReview.wouldDealAgain !== null && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium mb-6 ${
                  selectedReview.wouldDealAgain 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {selectedReview.wouldDealAgain 
                    ? <ThumbsUp className="w-4 h-4" />
                    : <ThumbsDown className="w-4 h-4" />
                  }
                  {selectedReview.wouldDealAgain ? 'Would deal again' : 'Would not deal again'}
                </div>
              )}

              {/* Company */}
              <div className="border-t border-slate-100 pt-5">
                <div 
                  className="flex items-center gap-3 p-3 -mx-3 rounded-xl cursor-pointer group/company hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setSelectedReview(null);
                    navigate(`/company/${selectedReview.company.id}`);
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                    {selectedReview.company.logo ? (
                      <img src={getImageUrl(selectedReview.company.logo, API_BASE)} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{selectedReview.company.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h5 className="font-semibold text-slate-800 text-sm truncate group-hover/company:text-indigo-600 transition-colors">
                      {selectedReview.company.name}
                    </h5>
                    <span className="text-xs text-slate-400">
                      {selectedReview.company.category || 'Textile Company'}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-indigo-500 opacity-0 group-hover/company:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-1">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes rr-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rr-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rr-section::-webkit-scrollbar,
        .rr-section *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default RecentReviews;
