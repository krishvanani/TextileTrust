import React, { useEffect, useState, useRef } from 'react';
import { Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// API Base for images
const API_BASE = 'http://localhost:5003';

const RecentReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();

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

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
        const scrollAmount = 300; // Adjust scroll distance
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }
  };

  if (loading) return null;
  if (!Array.isArray(reviews) || reviews.length === 0) return null;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-indigo-50/10 to-white border-t border-slate-200/60 relative overflow-hidden">
       {/* Background Decoration - Modern & Distinct */}
       <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 mix-blend-multiply"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 mix-blend-multiply"></div>
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-100/20 rounded-full blur-[80px] opacity-60 mix-blend-multiply animate-pulse-slow"></div>
       </div>
       
       <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
             <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
                   <Star className="w-3 h-3 mr-1.5 fill-indigo-700" />
                   Trusted Feedback
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                   Recent Reviews
                </h2>
                <p className="text-slate-600 text-base sm:text-lg max-w-xl">
                   Real experiences from verified certified traders and manufacturers.
                </p>
             </div>
             
             {/* Navigation Controls */}
             <div className="hidden md:flex gap-3">
                <button 
                    onClick={() => scroll('left')}
                    className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all active:scale-95 shadow-sm"
                >
                   <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => scroll('right')}
                    className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all active:scale-95 shadow-sm"
                >
                   <ArrowRight className="w-5 h-5" />
                </button>
             </div>
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto py-6 sm:py-8 snap-x snap-mandatory gap-6 hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
             {reviews.map((review) => (
                <div 
                  key={review._id} 
                  className="min-w-[280px] md:min-w-[350px] snap-center group relative bg-white border border-slate-200 rounded-3xl p-6 flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
                >
                   {/* Decorative Quote Icon */}
                   <div className="absolute top-6 right-6 text-slate-100 group-hover:text-indigo-50 transition-colors pointer-events-none">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                         <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.01697 21L5.01697 18C5.01697 16.8954 5.9124 16 7.01697 16H10.017C10.5693 16 11.017 15.5523 11.017 15V9C11.017 8.44772 10.5693 8 10.017 8H6.01697C5.46468 8 5.01697 8.44772 5.01697 9V11C5.01697 11.5523 4.56925 12 4.01697 12H3.01697V5H13.017V15C13.017 18.3137 10.3307 21 7.01697 21H5.01697Z" />
                      </svg>
                   </div>

                   {/* User Header */}
                   <div className="flex items-center gap-4 mb-5 relative z-10">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex-shrink-0 border-2 border-white shadow-sm ring-1 ring-slate-100">
                         {review.user.photo ? (
                            <img src={`${API_BASE}${review.user.photo}`} alt={review.user.name} className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500 font-bold text-base">
                               {review.user.name.substring(0, 2).toUpperCase()}
                            </div>
                         )}
                      </div>
                      <div className="flex flex-col min-w-0">
                         <h4 className="font-bold text-slate-800 text-base truncate w-full">
                            {review.user.name}
                         </h4>
                         <div className="flex items-center gap-2 text-xs">
                             <span className="text-slate-400 font-medium uppercase tracking-wide truncate">
                                {review.user.location || 'Verified User'}
                             </span>
                         </div>
                      </div>
                   </div>

                   {/* Variable Height Wrapper for Content */}
                   <div className="flex-grow flex flex-col z-10">
                       {/* Rating */}
                       <div className="flex gap-1 mb-3">
                          {[...Array(5)].map((_, i) => {
                             // Logic from CompanyProfile.jsx
                             const activeColor = review.rating >= 5 ? 'bg-green-600' :
                                                 review.rating >= 4 ? 'bg-lime-500' :
                                                 review.rating >= 3 ? 'bg-yellow-400' :
                                                 review.rating >= 2 ? 'bg-orange-500' : 'bg-red-600';
                             
                             return (
                                <div 
                                  key={i} 
                                  className={`w-5 h-5 rounded-[3px] flex items-center justify-center ${i < review.rating ? activeColor : 'bg-slate-100'}`}
                                >
                                   <Star 
                                     className={`w-3 h-3 ${i < review.rating ? 'text-white fill-white' : 'text-slate-300'}`} 
                                   />
                                </div>
                             );
                          })}
                       </div>

                       {/* Review Body */}
                       <div className="relative mb-6">
                            <p className="text-slate-600 text-[15px] leading-relaxed line-clamp-4">
                               {review.comment}
                            </p>
                       </div>
                   </div>

                   {/* Company Footer (Pill Design) */}
                   <div className="mt-auto pt-5 border-t border-slate-100/80">
                       <div 
                         className="flex items-center gap-3 cursor-pointer group/company p-2 rounded-xl transition-colors hover:bg-slate-50"
                         onClick={() => navigate(`/company/${review.company.id}`)}
                       >
                          <div className="w-9 h-9 rounded-lg bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 p-0.5 shadow-sm">
                             {review.company.logo ? (
                                <img src={`${API_BASE}${review.company.logo}`} alt="" className="w-full h-full object-cover rounded-[4px]" />
                             ) : (
                                <span className="text-xs font-bold text-slate-400">{review.company.name.substring(0, 2)}</span>
                             )}
                          </div>
                          <div className="overflow-hidden">
                             <h5 className="font-bold text-slate-900 text-sm truncate group-hover/company:text-indigo-600 transition-colors">
                                {review.company.name}
                             </h5>
                             <div className="flex items-center mt-0.5">
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 truncate">
                                  {review.company.category || 'Textile Company'}
                               </span>
                             </div>
                          </div>
                          <div className="ml-auto opacity-0 group-hover/company:opacity-100 transition-opacity -translate-x-2 group-hover/company:translate-x-0">
                                <ArrowRight className="w-4 h-4 text-indigo-400" />
                          </div>
                       </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </section>
  );
};

export default RecentReviews;
