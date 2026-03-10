import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, MapPin, Star, Lock, ThumbsUp, X, Check, ChevronRight, Edit, User, Phone, ExternalLink, HelpCircle, CreditCard, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import useScrollReveal from '../hooks/useScrollReveal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL;

// Mock Data (matches Search page)
const MOCK_DATA = {
  // Keeping fallback mock data for Company Info only, until backend company fetch is implemented
  1: { id: 1, name: "Apex Textiles Ltd.", gst: "27AAACA1234A1Z5", rating: 4.8, reviews: 124, dealAgain: 98, location: "Mumbai, Maharashtra", verified: true, joined: "2021" },
  2: { id: 2, name: "Surat Silk Traders", gst: "24BBBCB5678B1Z1", rating: 4.2, reviews: 85, dealAgain: 88, location: "Surat, Gujarat", verified: true, joined: "2022" },
};

const CompanyProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useScrollReveal();

  /* REMOVING FIXED MOCK CONST - USING STATE */
  const [company, setCompany] = useState(MOCK_DATA[id] || MOCK_DATA[1]);
  
  // STRICT GATING: Use exactly === true
  const isSubscribed = user?.isSubscribed === true; 

  // Fetch Real Company Data
  React.useEffect(() => {
    if (id.length === 24) {
      api.get(`/companies/${id}`)
        .then(res => setCompany(res.data))
        .catch(err => console.error("Failed to fetch company:", err));
    } else {
      setCompany(MOCK_DATA[id] || MOCK_DATA[1]);
    }
  }, [id]);

  // Derived State
  const isOwner = user?._id && (company?.submittedBy === user._id || company?.submittedBy?._id === user._id);
  
  // Normalize Data for UI
  const avgRating = company?.avgRating ?? company?.rating ?? 0;
  const totalReviews = company?.totalReviews ?? company?.reviews ?? 0;

  // Calculate trust status based on rating
  const calculateTrustStatus = () => {
    if (totalReviews === 0) return 'UNRATED';
    if (avgRating <= 2.5) return 'CAUTION';
    return 'TRUSTED';
  };

  const displayCompany = {
     name: company?.name,
     gst: company?.gst,
     rating: avgRating,
     reviews: totalReviews,
     dealAgain: company?.dealAgainPercentage ?? company?.dealAgain ?? 0,
     location: company?.city || company?.location || 'Unknown',
     trustStatus: calculateTrustStatus(),
     businessType: company?.businessType || 'Manufacturer',
     contactPerson: company?.contactPerson || 'Not Available',
     phone: company?.officialPhone || 'Not Available',
     joined: company?.createdAt 
       ? new Date(company.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) 
       : company?.joined || 'N/A'
  };

  const getTrustBadge = (status, isViewingOwn = false) => {
    switch(status) {
      case 'TRUSTED':
        return { label: 'Trusted Company', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: ShieldCheck, dot: 'bg-emerald-500' };
      case 'CAUTION':
        return { 
          label: isViewingOwn ? 'Needs Improvement' : 'Use with Caution', 
          color: 'bg-yellow-50 text-yellow-700 border-yellow-100', 
          icon: ShieldCheck, 
          dot: 'bg-yellow-500' 
        };
      case 'LOW_TRUST':
        return { label: isViewingOwn ? 'Critical Attention Needed' : 'Low Trust', color: 'bg-red-50 text-red-700 border-red-100', icon: ShieldCheck, dot: 'bg-red-500' };
      default:
        return { label: 'Unrated', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: ShieldCheck, dot: 'bg-gray-400' };
    }
  };

  const trustBadge = getTrustBadge(displayCompany.trustStatus, isOwner);

  // State
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [showSubModal, setShowSubModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showBCModal, setShowBCModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  
  // Review Form State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [dealAgain, setDealAgain] = useState(null); // true | false
  const [reviewText, setReviewText] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null); // Track which review is being edited

  // Filter State
  const [selectedStarFilter, setSelectedStarFilter] = useState(null);

  // Fetch Reviews Effect
  React.useEffect(() => {
    if (isSubscribed) {
      if (id.length < 24) { setLoadingReviews(false); return; }
      const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
          const { data } = await api.get(`/reviews/${id}`);
          
          const formattedReviews = data.map(r => ({
            id: r._id,
            reviewerId: r.userId?._id, // Include reviewer's userId for edit check
            reviewerName: r.userId?.name || 'Anonymous',
            reviewerCompany: r.userId?.companyName || null,
            reviewerCompanyId: r.userId?.ownedCompanyId, // Link to company profile
            reviewerPhoto: r.userId?.profilePhoto || null,
            role: r.userId?.role || 'Trader', 
            isVerified: r.userId?.isSubscribed === true,
            rating: r.rating,
            wouldDealAgain: r.wouldDealAgain,
            date: calculateRelativeTime(r.updatedAt || r.createdAt),
            text: r.comment
          }));
          
          // Sort: current user's review first, then rest by date
          const sortedReviews = formattedReviews.sort((a, b) => {
            if (a.reviewerId === user?._id) return -1;
            if (b.reviewerId === user?._id) return 1;
            return 0; // Keep original date order for others
          });
          setReviews(sortedReviews);
        } catch (error) {
          console.error("Failed to fetch reviews:", error);
        } finally {
          setLoadingReviews(false);
        }
      };
      fetchReviews();
    }
  }, [isSubscribed, id, user?._id]);

  // Check if the current user has already reviewed this company
  const myExistingReview = reviews.find(r => r.reviewerId === user?._id);

  // Calculations for Distribution
  const totalReviewCount = reviews.length;
  const starCounts = reviews.reduce((acc, review) => {
    const star = Math.round(review.rating);
    acc[star] = (acc[star] || 0) + 1;
    return acc;
  }, {1:0, 2:0, 3:0, 4:0, 5:0});

  const filteredReviews = selectedStarFilter 
    ? reviews.filter(r => Math.round(r.rating) === selectedStarFilter)
    : reviews;

  const [showAllReviews, setShowAllReviews] = useState(false);
  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 3);

  const toggleFilter = (star) => {
    if (selectedStarFilter === star) {
       setSelectedStarFilter(null);
    } else {
       setSelectedStarFilter(star);
    }
  };

  const calculateRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Reviewed today';
    if (diffInDays === 1) return 'Reviewed yesterday';
    if (diffInDays <= 3) return `Reviewed ${diffInDays} days ago`;
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return `Reviewed on ${date.toLocaleDateString('en-US', options)}`;
  };

  // ... Auto-open useEffect ...
  React.useEffect(() => {
    if (isSubscribed && location.state?.action === 'review' && !isOwner) {
      setShowReviewModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [isSubscribed, location.state, isOwner]);

  // Handler restoration
  const handleSubscribeRedirect = () => {
    navigate('/subscription', { state: { view: 'form', returnUrl: location.pathname, action: 'review' } });
  };

  const handleGatedAction = () => {
    if (!isSubscribed) {
      navigate('/subscription', { state: { view: 'form', returnUrl: location.pathname, action: 'review' } });
    } else {
      setShowReviewModal(true);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const isMockCompany = id.length < 24; 

      if (isMockCompany) {
         // Mock logic handled by state only
      } else {
        const payload = {
          companyId: id,
          rating,
          wouldDealAgain: dealAgain,
          comment: reviewText
        };

        // Check if editing or creating
        if (editingReviewId) {
          await api.put(`/reviews/edit/${editingReviewId}`, payload);
        } else {
          await api.post('/reviews', payload);
        }
        
        // RE-FETCH to sync everything
        const companyRes = await api.get(`/companies/${id}`);
        setCompany(companyRes.data);

        const reviewsRes = await api.get(`/reviews/${id}`);
        const formattedReviews = reviewsRes.data.map(r => ({
           id: r._id,
           reviewerId: r.userId?._id,
           reviewerName: r.userId?.name || 'Anonymous',
           reviewerCompany: r.userId?.companyName || null,
           reviewerPhoto: r.userId?.profilePhoto || null,
           role: r.userId?.role || 'Trader',
           isVerified: r.userId?.isSubscribed === true,
           rating: r.rating,
           wouldDealAgain: r.wouldDealAgain,
           date: calculateRelativeTime(r.updatedAt || r.createdAt),
           text: r.comment
        }));
        
        // Sort: current user's review first
        const sortedReviews = formattedReviews.sort((a, b) => {
           if (a.reviewerId === user?._id) return -1;
           if (b.reviewerId === user?._id) return 1;
           return 0;
        });
        setReviews(sortedReviews);
        
        setHasSubmitted(true);
      }

      setTimeout(() => {
        setHasSubmitted(false);
        setShowReviewModal(false);
        setRating(0);
        setDealAgain(null);
        setReviewText('');
        setEditingReviewId(null); // Reset edit state
      }, 1500);

    } catch (error) {
       console.error("Failed to submit review:", error);
       alert(error.response?.data?.message || "Something went wrong.");
    }
  };

  const [initialReviewState, setInitialReviewState] = useState(null);

  // Open edit modal with existing review data
  const openEditReview = (review) => {
    setRating(review.rating);
    setDealAgain(review.wouldDealAgain);
    setReviewText(review.text);
    setEditingReviewId(review.id);
    
    // Store initial state for comparison
    setInitialReviewState({
      rating: review.rating,
      dealAgain: review.wouldDealAgain,
      reviewText: review.text
    });
    
    setShowReviewModal(true);
  };

  const getRatingLabel = (score) => {
    if (score >= 4.5) return "Excellent";
    if (score >= 3.6) return "Good";
    if (score >= 2.6) return "Average";
    if (score >= 1.1) return "Poor";
    return "Bad";
  };

  const getRatingColor = (score) => {
    if (score >= 4.5) return "#00b67a"; // Excellent (Green)
    if (score >= 3.6) return "#73b600"; // Good (Lime)
    if (score >= 2.6) return "#ffce00"; // Average (Yellow)
    if (score >= 1.1) return "#ff8622"; // Poor (Orange)
    return "#db3737"; // Bad (Red)
  };


  // Edit Profile Handlers
  const BUSINESS_TYPES = ['Manufacturer', 'Trader', 'Wholesaler', 'Retailer', 'Yarn Supplier', 'Fabric Manufacturer', 'Dyeing Unit', 'Printing Unit', 'Exporter'];

  const openEditProfile = () => {
    setEditForm({
      name: company?.name || '',
      city: company?.city || '',
      businessType: company?.businessType || '',
      contactPerson: company?.contactPerson || '',
      officialEmail: company?.officialEmail || '',
      officialPhone: company?.officialPhone || ''
    });
    setEditError('');
    setShowEditModal(true);
  };

  const saveEditProfile = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      const res = await api.put(`/companies/${id}`, editForm);
      setCompany(res.data);
      setShowEditModal(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-white">
      {/* ===== TRUSTPILOT-STYLE HEADER ===== */}
      <div className="border-b border-gray-200 reveal pt-24 sm:pt-28 bg-white">
        <div className="container-custom py-6 sm:py-8 md:py-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-10">
            
            {/* ===== LEFT COLUMN: Logo + Company Info ===== */}
            <div className="flex gap-5 sm:gap-6 flex-1 min-w-0">
              {/* Large Square Logo */}
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 min-w-[80px] sm:min-w-[96px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-2xl sm:text-3xl uppercase overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => company?.submittedBy?.profilePhoto && setShowImageModal(true)}
              >
                {company?.submittedBy?.profilePhoto ? (
                  <img src={`${API_BASE}${company.submittedBy.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  displayCompany.name?.substring(0, 2)
                )}
              </div>

              {/* Company Info Stack */}
              <div className="min-w-0 flex flex-col gap-2">
                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {isSubscribed && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                      Verified Profile
                    </span>
                  )}
                  {isSubscribed && totalReviews > 0 && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${trustBadge.color} shadow-sm border`}>
                      <trustBadge.icon className="w-3.5 h-3.5 mr-1" />
                      {trustBadge.label}
                    </span>
                  )}
                  {displayCompany.businessType && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                      {displayCompany.businessType}
                    </span>
                  )}
                </div>

                {/* Company Name */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-tight">{displayCompany.name}</h1>
                
                {/* Rating Row - Trustpilot Style */}
                {isSubscribed && totalReviews > 0 && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-sm text-gray-500 font-medium">Reviews <b className="text-gray-900">{displayCompany.reviews?.toLocaleString()}</b></span>
                    <span className="text-gray-300">·</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => {
                        const rating = displayCompany.rating;
                        const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));
                        const starColor = getRatingColor(rating);
                        return (
                          <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center" style={{
                            background: `linear-gradient(to right, ${starColor} ${fillPercentage}%, #e5e7eb ${fillPercentage}%)`
                          }}>
                            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current relative z-10" />
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{displayCompany.rating}</span>
                  </div>
                )}
                {isSubscribed && totalReviews === 0 && (
                  <span className="text-sm text-gray-400">No reviews yet</span>
                )}

                {/* Location + GST */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-xs sm:text-sm">
                  <div className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    <span>{displayCompany.location}</span>
                  </div>
                  <span className="text-gray-300">·</span>
                  <span className="font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded text-xs">GST: {displayCompany.gst}</span>
                  <span className="hidden md:inline text-gray-300">·</span>
                  <span className="hidden md:inline text-gray-400">Member since {displayCompany.joined}</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 mt-1">
                  {isOwner ? (
                    <>
                    <div className="flex items-center px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 font-medium text-sm">
                      <ShieldCheck className="w-4 h-4 mr-2 text-green-500" />
                      You manage this profile
                    </div>
                    <button
                      onClick={openEditProfile}
                      className="flex items-center px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-semibold text-sm hover:bg-brand-100 hover:border-brand-300 transition-all shadow-sm gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>
                    </>
                  ) : (
                    <>
                    {myExistingReview ? (
                      <Button 
                        variant="primary" 
                        onClick={() => openEditReview(myExistingReview)}
                        className="shadow-lg shadow-brand-500/20 bg-gray-900 hover:bg-black text-white px-5 sm:px-6 min-h-[40px] sm:min-h-[44px] text-sm sm:text-base flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Review
                      </Button>
                    ) : (
                      <Button 
                        variant="primary" 
                        onClick={handleGatedAction}
                        className="shadow-lg shadow-brand-500/20 bg-gray-900 hover:bg-black text-white px-5 sm:px-6 min-h-[40px] sm:min-h-[44px] text-sm sm:text-base flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Write a Review
                      </Button>
                    )}
                    {isSubscribed && company?.businessCard?.frontImageUrl && (
                      <button 
                        onClick={() => setShowBCModal(true)}
                        className="flex items-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                        Card
                      </button>
                    )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ===== RIGHT COLUMN: Rating Summary Card ===== */}
            {isSubscribed && totalReviews > 0 && (
              <div className="w-full lg:w-auto lg:min-w-[360px] lg:max-w-[420px] bg-white rounded-2xl border border-gray-200 shadow-lg p-5 sm:p-6 flex-shrink-0">
                <div className="flex items-start gap-4 mb-4">
                  {/* Big Rating Number */}
                  <div className="text-center flex-shrink-0">
                    <div className="text-5xl font-bold text-gray-900 leading-none">{displayCompany.rating}</div>
                    <div className="text-sm font-bold mt-1.5" style={{ color: getRatingColor(displayCompany.rating) }}>{getRatingLabel(displayCompany.rating)}</div>
                    <div className="flex gap-0.5 mt-2 justify-center">
                      {[...Array(5)].map((_, i) => {
                        const rating = displayCompany.rating;
                        const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));
                        const starColor = getRatingColor(rating);
                        return (
                          <div key={i} className="w-5 h-5 flex items-center justify-center" style={{
                            background: `linear-gradient(to right, ${starColor} ${fillPercentage}%, #e5e7eb ${fillPercentage}%)`
                          }}>
                            <Star className="w-3 h-3 text-white fill-current" />
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-gray-400 mt-1.5">{displayCompany.reviews?.toLocaleString()} reviews</div>
                  </div>

                  {/* Star Distribution Bars */}
                  <div className="flex-1 flex flex-col gap-2 pt-1 min-w-[160px]">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = starCounts[star] || 0;
                      const percentage = totalReviewCount > 0 ? (count / totalReviewCount) * 100 : 0;
                      const barColor = star >= 4 ? '#00b67a' : star === 3 ? '#73b600' : star === 2 ? '#ff8622' : '#db3737';
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-10 text-right whitespace-nowrap">{star}-star</span>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${percentage}%`, backgroundColor: barColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deal Again Badge */}
                {displayCompany.dealAgain > 0 && (
                  <div className={`flex items-center justify-between mt-2 p-3 rounded-xl border ${
                    displayCompany.dealAgain >= 80 ? 'bg-green-50 border-green-200' :
                    displayCompany.dealAgain >= 60 ? 'bg-yellow-50 border-yellow-200' :
                    displayCompany.dealAgain >= 40 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <span className={`text-sm font-semibold ${
                      displayCompany.dealAgain >= 80 ? 'text-green-800' :
                      displayCompany.dealAgain >= 60 ? 'text-yellow-800' :
                      displayCompany.dealAgain >= 40 ? 'text-orange-800' : 'text-red-800'
                    }`}>Would deal again</span>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-base shadow-md ${
                      displayCompany.dealAgain >= 80 ? 'bg-green-500' : 
                      displayCompany.dealAgain >= 60 ? 'bg-yellow-500' :
                      displayCompany.dealAgain >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      <ThumbsUp className="w-4 h-4" />
                      {displayCompany.dealAgain}%
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Business Card Upload (Owner) */}

          </div>
        </div>
      </div>

      <div className="container-custom mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* Main Content: Reviews Layout - Takes 8 cols on Desktop */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6 order-2 lg:order-2">
          <div className="p-0 reveal overflow-hidden border border-gray-100 bg-gray-50 rounded-2xl shadow-md">
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Reputation Analysis</h2>
              {isSubscribed && (
                 <span className="text-[10px] sm:text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                   Premium Unlocked
                 </span>
              )}
            </div>
            
            <div className="p-4 sm:p-5 relative">
              {/* [Existing Review Content Code...] */}
              {/* Premium Content Blur Wrapper */}
              <div className={`transition-all duration-500 min-h-[450px] ${!isSubscribed ? 'blur-md opacity-40 select-none pointer-events-none grayscale-[0.5]' : ''}`}>
                <div className="space-y-6 sm:space-y-8">
                
                  {/* TRUST LABEL BANNER - only show if has reviews */}
                  {isSubscribed && totalReviews > 0 && (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 ${trustBadge.color.replace('text-', 'bg-opacity-10 ')}`}>
                     <div className={`p-2 rounded-lg ${trustBadge.color} bg-opacity-20`}>
                        <trustBadge.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                     </div>
                     <div>
                        <h4 className="font-bold text-base">{trustBadge.label}</h4>
                        <p className="text-xs sm:text-sm opacity-80 mt-1 leading-relaxed">
                          {displayCompany.trustStatus === 'TRUSTED' ? 'This company meets our highest standards for reliability and feedback.' :
                           displayCompany.trustStatus === 'CAUTION' ? 'Mixed feedback detected. We recommend proceeding with standard due diligence.' :
                           displayCompany.trustStatus === 'LOW_TRUST' ? 'Multiple negative indicators found. High risk.' :
                           'Not enough data to calculate a trust score yet.'}
                        </p>
                     </div>
                  </div>
                  )}
                  {/* Clean Stats Row - REMOVED (Moved to Header/Card) */}

                  {/* Reviews List */}
                  <div className="pt-2 space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Recent Reviews</h3>
                    </div>
                    
                    {loadingReviews ? (
                       // Skeleton Loader
                       [1, 2].map(i => (
                         <div key={i} className="animate-pulse flex flex-col gap-3 p-5 rounded-2xl border border-gray-100">
                           <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                           <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                           <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                         </div>
                       ))
                    ) : (
                      <>
                      <div className={`${showAllReviews ? 'max-h-[600px] overflow-y-auto pr-1 scrollbar-thin' : ''} space-y-6`}>
                      {displayedReviews.map((review) => {
                        const isMyReview = review.reviewerId === user?._id;
                        return (
                          <div key={review.id} className={`group hover:bg-gray-50 p-4 sm:p-5 rounded-2xl border card-hover-lift fade-in-up fade-in-delay-${Math.min(displayedReviews.indexOf(review) + 1, 5)} ${isMyReview ? 'border-brand-200 bg-brand-50/30' : 'border-gray-100'}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center">
                                {/* Avatar / Initials */}
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold mr-2 sm:mr-3 border overflow-hidden ${isMyReview ? 'bg-brand-100 text-brand-700 border-brand-200' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 border-gray-200'}`}>
                                  {review.reviewerPhoto ? (
                                    <img src={`${API_BASE}${review.reviewerPhoto}`} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    review.reviewerCompany ? review.reviewerCompany.substring(0,2).toUpperCase() : review.reviewerName.substring(0,2).toUpperCase()
                                  )}
                                </div>
                                
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    {/* Name / Company */}
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (review.reviewerCompanyId) {
                                          navigate(`/company/${review.reviewerCompanyId}`);
                                        }
                                      }}
                                      className={`text-sm font-bold text-gray-900 truncate max-w-[120px] sm:max-w-xs transition-colors ${review.reviewerCompanyId ? 'cursor-pointer hover:text-brand-600 hover:underline' : ''}`}
                                    >
                                      {review.reviewerCompany || review.reviewerName}
                                    </div>
                                    
                                    {/* Verified Badge */}
                                    {review.isVerified && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100" title="Verified Subscriber">
                                        <ShieldCheck className="w-3 h-3 mr-0.5" />
                                        Verified
                                      </span>
                                    )}

                                    {/* My Review Badge */}
                                    {isMyReview && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-700 border border-brand-200">
                                        You
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-0.5">
                                    {/* Role Tag & Stars */}
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-100 px-1.5 rounded hidden sm:inline-block">
                                      {review.role}
                                    </span>
                                    
                                    <div className="flex gap-0.5">
                                      {[...Array(5)].map((_, idx) => {
                                         const activeColor = review.rating >= 5 ? 'bg-green-600' :
                                                             review.rating >= 4 ? 'bg-lime-500' :
                                                             review.rating >= 3 ? 'bg-yellow-400' :
                                                             review.rating >= 2 ? 'bg-orange-500' : 'bg-red-600';
                                         return (
                                           <div key={idx} className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm flex items-center justify-center ${idx < review.rating ? activeColor : 'bg-gray-100'}`}>
                                              <Star className={`w-2 h-2 sm:w-3 sm:h-3 ${idx < review.rating ? 'text-white fill-current' : 'text-gray-300'}`} />
                                           </div>
                                         );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Time message on top right, Edit button below it */}
                              <div className="flex flex-col items-end gap-1 sm:gap-2">
                                <span className="text-[10px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">{review.date}</span>
                                {isMyReview && (
                                  <button 
                                    onClick={() => openEditReview(review)}
                                    className="text-xs sm:text-sm text-brand-600 hover:text-white hover:bg-brand-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-brand-200 hover:border-brand-600 font-medium flex items-center gap-1 transition-all"
                                  >
                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Edit
                                  </button>
                                )}
                              </div>
                            </div>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            "{review.text}"
                          </p>
                        </div>
                      );
                      })}
                      </div>
                      
                      {filteredReviews.length > 3 && (
                        <div className="text-center pt-2">
                          <button 
                            onClick={() => setShowAllReviews(!showAllReviews)}
                            className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-full transition-colors"
                          >
                            {showAllReviews ? (
                              <>Show Less <ChevronRight className="w-4 h-4 ml-1 rotate-[-90deg]" /></>
                            ) : (
                              <>View All {filteredReviews.length - 3} More Reviews <ChevronRight className="w-4 h-4 ml-1 rotate-90" /></>
                            )}
                          </button>
                        </div>
                      )}
                      </>
                    )}
                    
                    {reviews.length === 0 && !loadingReviews && isSubscribed && (
                       <div className="text-center py-8 sm:py-12 px-4">
                         <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                         </div>
                         <h3 className="text-gray-900 font-bold mb-2">No reviews yet</h3>
                         <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                            {isOwner 
                              ? "Your profile is awaiting its first review. Share it with your partners!" 
                              : "Be the first to share your experience with this company."}
                         </p>
                         {!isOwner && (
                            <Button onClick={handleGatedAction} variant="secondary" className="border border-gray-200 shadow-sm w-full sm:w-auto">
                               Write a Review
                            </Button>
                         )}
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Locked Overlay */}
              {!isSubscribed && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-white/10 to-white/90">
                   <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl shadow-brand-900/10 border border-gray-100 w-full max-w-sm text-center transform hover:scale-[1.02] transition-transform duration-300 mx-4 fade-in-scale">
                      {/* Sub Modal Trigger Content */}
                      <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-brand-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Premium Intelligence Locked</h3>
                       <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Join verified textile traders who rely on TextileTrust to reduce payment risk and improve trade transparency.
                      </p>
                      <Button 
                        variant="primary" 
                        onClick={() => setShowSubModal(true)}
                        className="w-full shadow-lg shadow-brand-600/20"
                      >
                        View Premium Insights
                      </Button>
                      <p className="mt-4 text-xs text-gray-400 font-medium">
                        No long-term contracts • Cancel anytime
                      </p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Basic Info (Moves to Top on Mobile, currently Order 1) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6 order-1 lg:order-1 sticky top-32">
          
          {/* REDESIGNED COMPANY DETAILS for Mobile/Tablet/Desktop Consistency */}
          <div className="p-4 sm:p-5 reveal bg-gray-50 border border-gray-100 rounded-2xl shadow-md gradient-border-card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 text-gray-400 mr-2" />
              Company Details
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {/* GST */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                   GST Number
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                </div>
                <div className="text-sm font-mono text-gray-900 font-medium tracking-tight break-all">
                  {company.gst}
                </div>
              </div>

              {/* Status */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                <div className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Status</div>
                <div className="text-xs font-bold text-emerald-700 flex items-center">
                  Active
                  <Check className="w-3 h-3 ml-1" />
                </div>
              </div>

               {/* Type */}
              <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Type</div>
                <div className="text-xs font-bold text-gray-900 truncate">
                  {displayCompany.businessType}
                </div>
              </div>

              {/* Contact Person */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Person</div>
                 <div className="text-sm text-gray-900 font-medium flex items-center">
                    <User className="w-3 h-3 mr-2 text-gray-400" />
                    {displayCompany.contactPerson}
                 </div>
              </div>

              {/* Phone */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Number</div>
                 <div className="text-sm text-gray-900 font-medium flex items-center">
                    <Phone className="w-3 h-3 mr-2 text-gray-400" />
                    {displayCompany.phone}
                 </div>
              </div>
            </div>

               {/* GST Verified Details */}
               {company?.isGstVerified && company?.gstDetails && (
                 <div className="mt-3 pt-3 border-t border-gray-100">
                   <div className="flex items-center gap-1.5 mb-3">
                     <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                     <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">GST Verified</span>
                   </div>
                   <div className="space-y-2">
                     {company.gstDetails.lgnm && (
                       <div className="p-3 bg-white rounded-xl border border-gray-100">
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Legal Name</div>
                         <div className="text-sm text-gray-900 font-medium">{company.gstDetails.lgnm}</div>
                       </div>
                     )}
                     {company.gstDetails.tradeNam && (
                       <div className="p-3 bg-white rounded-xl border border-gray-100">
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Trade Name</div>
                         <div className="text-sm text-gray-900 font-medium">{company.gstDetails.tradeNam}</div>
                       </div>
                     )}
                     <div className="grid grid-cols-2 gap-2">
                       {company.gstDetails.rgdt && (
                         <div className="p-3 bg-white rounded-xl border border-gray-100">
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reg. Date</div>
                           <div className="text-xs text-gray-900 font-semibold">{company.gstDetails.rgdt}</div>
                         </div>
                       )}
                       {company.gstDetails.sts && (
                         <div className="p-3 bg-white rounded-xl border border-gray-100">
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">GST Status</div>
                           <div className={`text-xs font-semibold ${company.gstDetails.sts === 'Active' ? 'text-emerald-700' : 'text-red-700'}`}>{company.gstDetails.sts}</div>
                         </div>
                       )}
                     </div>
                     {company.gstDetails.ctb && (
                       <div className="p-3 bg-white rounded-xl border border-gray-100">
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Constitution of Business</div>
                         <div className="text-xs text-gray-900 font-medium">{company.gstDetails.ctb}</div>
                       </div>
                     )}
                     {company.gstDetails.pradr?.adr && (
                       <div className="p-3 bg-white rounded-xl border border-gray-100">
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registered Address</div>
                         <div className="text-xs text-gray-900 font-medium leading-relaxed">{company.gstDetails.pradr.adr}</div>
                       </div>
                     )}
                   </div>
                 </div>
               )}
            
            {isSubscribed && company?.businessCard?.frontImageUrl && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                   <button 
                     onClick={() => setShowBCModal(true)}
                     className="relative z-10 w-full flex items-center justify-center px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 hover:text-brand-600 transition-colors shadow-sm group"
                   >
                     <CreditCard className="w-4 h-4 mr-2 text-gray-400 group-hover:text-brand-600 transition-colors" />
                     View Business Card
                   </button>
                </div>
             )}
          </div>
          
          {/* Rating Breakdown - only show if has reviews */}
          {isSubscribed && totalReviews > 0 && (
          <div className="p-4 sm:p-6 reveal bg-gray-50 border border-gray-100 rounded-2xl shadow-md gradient-border-card">
            <h3 className="font-bold text-gray-900 mb-4 sm:mb-5 flex items-center">
              <Star className="w-5 h-5 text-gray-400 mr-2" />
              Rating Breakdown
            </h3>
            <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                   const count = starCounts[star] || 0;
                   const percent = totalReviewCount > 0 ? (count / totalReviewCount) * 100 : 0;
                   const isSelected = selectedStarFilter === star;
                   
                   let barColor = 'bg-red-900';
                   if (star === 5) barColor = 'bg-green-800';
                   else if (star === 4) barColor = 'bg-lime-500';
                   else if (star === 3) barColor = 'bg-yellow-400';
                   else if (star === 2) barColor = 'bg-orange-500';
                   else if (star === 1) barColor = 'bg-red-600';

                   return (
                     <button 
                        key={star}
                        onClick={() => toggleFilter(star)}
                        className={`w-full flex items-center gap-3 group text-sm ${isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'} transition-all`}
                     >
                        {/* Checkbox Look */}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? `${barColor} border-current text-white` : 'border-gray-300 group-hover:border-gray-400 bg-white'}`}>
                           {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        
                        <span className="w-12 text-xs font-medium text-gray-600 text-left whitespace-nowrap">{star} stars</span>
                        
                        {/* Bar */}
                        <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                              style={{ width: `${percent}%` }}
                           ></div>
                        </div>
                        
                        <span className="w-8 text-xs font-medium text-gray-400 text-right">{Math.round(percent)}%</span>
                     </button>
                   );
                })}
                {selectedStarFilter && (
                   <div className="text-right pt-2">
                      <button onClick={() => setSelectedStarFilter(null)} className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline">
                         Clear Filter
                      </button>
                   </div>
                )}
            </div>
          </div>
          )}
        </div>

      </div>

      {/* --- MODALS --- */}

      {/* Subscription Required Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-backdrop-blur" onClick={() => setShowSubModal(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden fade-in-scale">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-indigo-600"></div>
            <button 
              onClick={() => setShowSubModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <Lock className="w-8 h-8 text-brand-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Subscription Required</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                To view detailed ratings, analyze risk scores, and write reviews for 
                <span className="font-semibold text-gray-900"> {company.name}</span>, please upgrade your plan.
              </p>
              
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={handleSubscribeRedirect}
                  className="shadow-xl shadow-brand-500/20 py-3 text-base"
                >
                  Subscribe Now
                </Button>
                <button 
                  onClick={() => setShowSubModal(false)}
                  className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Maybe Later
                </button>
              </div>
            </div>
            <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
              Trusted by 5,000+ Textile Businesses
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-backdrop-blur" onClick={() => !hasSubmitted && setShowReviewModal(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden fade-in-scale">
            
            {!hasSubmitted ? (
              <>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
                  <button 
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={submitReview} className="p-6 space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Rate your experience</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeRating = hoverRating || rating;
                        const isActive = star <= activeRating;
                        const bgColor = isActive ? getRatingColor(activeRating) : '#f3f4f6';
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="w-12 h-12 transition-transform hover:scale-105 focus:outline-none flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: bgColor }}
                          >
                            <Star className={`w-7 h-7 ${isActive ? 'text-white' : 'text-gray-300'} fill-current`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deal Again Toggle */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Would you deal with them again?</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setDealAgain(true)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center transition-all ${dealAgain === true ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-gray-100 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 text-gray-600'}`}
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" /> Yes, definitely
                      </button>
                      <button
                        type="button"
                        onClick={() => setDealAgain(false)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center transition-all ${dealAgain === false ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-gray-100 hover:border-red-500 hover:text-red-700 hover:bg-red-50 text-gray-600'}`}
                      >
                        <Lock className="w-4 h-4 mr-2 rotate-180" /> No, avoid
                      </button>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Share your experience (Optional)</label>
                    <textarea 
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="e.g. Payment terms were clear, delivery was on time..."
                      className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none min-h-[100px] resize-none input-glow"
                    ></textarea>
                  </div>

                  {/* Submit Queue */}
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      fullWidth 
                      className="py-3 shadow-xl shadow-brand-500/20"
                      disabled={
                        rating === 0 || 
                        dealAgain === null || 
                        (editingReviewId && initialReviewState && 
                          rating === initialReviewState.rating && 
                          dealAgain === initialReviewState.dealAgain && 
                          reviewText === initialReviewState.reviewText
                        )
                      }
                    >
                      {editingReviewId ? 'Update Review' : 'Submit Review'}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <Check className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h3>
                <p className="text-gray-500">
                  Thank you for contributing to the community trust score.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Photo Lightbox */}
      {showImageModal && company?.submittedBy?.profilePhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-300"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
             <button 
                onClick={(e) => { e.stopPropagation(); setShowImageModal(false); }}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 bg-black/20 rounded-full backdrop-blur-sm"
             >
                <X className="w-8 h-8" />
             </button>
             <img 
               src={`${API_BASE}${company.submittedBy.profilePhoto}`} 
               alt={company.companyName} 
               className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             />
          </div>
        </div>
      )}
      {/* Business Card Modal */}
      {showBCModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/40 backdrop-blur-md p-4 transition-all duration-300 animate-in fade-in"
          onClick={() => setShowBCModal(false)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
             <button 
                onClick={() => setShowBCModal(false)}
                className="absolute top-0 right-0 md:-right-10 md:-top-10 text-gray-900 hover:text-black z-10 p-2 bg-white/80 hover:bg-white shadow-sm rounded-full backdrop-blur-sm transition-all"
             >
                <X className="w-6 h-6 md:w-8 md:h-8" />
             </button>
             
             <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
                {/* Front Side */}
                <div className="flex flex-col items-center gap-4 w-full md:w-1/2 max-w-md animate-in slide-in-from-bottom-4 duration-500">
                     <div className="w-full bg-white p-2 rounded-xl shadow-2xl overflow-hidden aspect-[1.6] flex items-center justify-center">
                        {company?.businessCard?.frontImageUrl ? (
                            <img src={`${API_BASE}${company.businessCard.frontImageUrl}`} alt="Front" className="w-full h-full object-contain rounded-lg" />
                        ) : (
                            <div className="text-gray-400 text-sm font-medium">No Front Side</div>
                        )}
                     </div>
                     <p className="text-gray-900 text-sm font-bold tracking-widest uppercase text-center border-b border-gray-300 pb-1 w-full mt-2">Front Side</p>
                </div>

                {/* Back Side */}
                <div className="flex flex-col items-center gap-4 w-full md:w-1/2 max-w-md animate-in slide-in-from-bottom-4 duration-700 delay-100">
                     <div className="w-full bg-white p-2 rounded-xl shadow-2xl overflow-hidden aspect-[1.6] flex items-center justify-center">
                        {company?.businessCard?.backImageUrl ? (
                            <img src={`${API_BASE}${company.businessCard.backImageUrl}`} alt="Back" className="w-full h-full object-contain rounded-lg" />
                        ) : (
                            <div className="text-gray-400 text-sm font-medium">No Back Side</div>
                        )}
                     </div>
                     <p className="text-gray-900 text-sm font-bold tracking-widest uppercase text-center border-b border-gray-300 pb-1 w-full mt-2">Back Side</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-backdrop-blur" onClick={() => !editSaving && setShowEditModal(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden fade-in-scale">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-indigo-600"></div>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-600" />
                Edit Company Profile
              </h3>
              <button
                onClick={() => !editSaving && setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEditProfile} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {editError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  {editError}
                </div>
              )}

              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none input-glow"
                  required
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                <input
                  type="text"
                  value={editForm.city || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none input-glow"
                  required
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Business Type</label>
                <select
                  value={editForm.businessType || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, businessType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white input-glow"
                  required
                >
                  <option value="" disabled>Select type</option>
                  {BUSINESS_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contact Person</label>
                <input
                  type="text"
                  value={editForm.contactPerson || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, contactPerson: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none input-glow"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Official Email</label>
                <input
                  type="email"
                  value={editForm.officialEmail || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, officialEmail: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none input-glow"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Official Phone</label>
                <input
                  type="tel"
                  value={editForm.officialPhone || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, officialPhone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none input-glow"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSaving}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-3 shadow-xl shadow-brand-500/20"
                  disabled={editSaving || !editForm.name || !editForm.city || !editForm.businessType}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;

