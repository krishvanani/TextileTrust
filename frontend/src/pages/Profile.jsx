import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Mail, Phone, Calendar, Star, Building2, LogOut, CreditCard, Eye, Activity, Clock, Edit, ThumbsUp, Lock, Check, X, Camera, Upload } from 'lucide-react'; // Added Icons
import Button from '../components/ui/Button';

import { useAuth } from '../context/AuthContext';
import useScrollReveal from '../hooks/useScrollReveal';
import api from '../services/api'; // Import API

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  useScrollReveal();
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const [companyStats, setCompanyStats] = React.useState(null);
  const [activities, setActivities] = React.useState([]);
  
  // Review Section State
  const [myReviews, setMyReviews] = React.useState([]);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [editingReviewId, setEditingReviewId] = React.useState(null);
  const [rating, setRating] = React.useState(0);
  const [dealAgain, setDealAgain] = React.useState(null);
  const [reviewText, setReviewText] = React.useState('');
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [initialReviewState, setInitialReviewState] = React.useState(null);
  const [showAllReviews, setShowAllReviews] = React.useState(false);
  const [showAllActivities, setShowAllActivities] = React.useState(false);

  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);

  // Business Card State
  const [showBCModal, setShowBCModal] = React.useState(false);
  const [bcFront, setBcFront] = React.useState(null);
  const [bcBack, setBcBack] = React.useState(null);
  const [uploadingBC, setUploadingBC] = React.useState(false);

  const API_BASE = 'http://localhost:5003';

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePhoto', file);
    setUploadingPhoto(true);

    try {
      await api.post('/auth/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refreshUser();
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Failed to upload photo. Max size is 5MB.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Business Card Handlers
  const handleBCFileChange = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      if (side === 'front') setBcFront(file);
      else setBcBack(file);
    }
  };

  const handleBCUpload = async () => {
    if (!bcFront && !bcBack) return;
    setUploadingBC(true);
    const formData = new FormData();
    if (bcFront) formData.append('front', bcFront);
    if (bcBack) formData.append('back', bcBack);

    try {
      await api.post('/companies/business-card', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh company stats
      if (user.ownedCompanyId) {
         const { data } = await api.get(`/companies/${user.ownedCompanyId}`);
         setCompanyStats(data);
      }
      setBcFront(null);
      setBcBack(null);
      setShowBCModal(false);
      // alert('Business Card Uploaded Successfully!');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingBC(false);
    }
  };

  const displayedReviews = showAllReviews ? myReviews : myReviews.slice(0, 3);
  const displayedActivities = showAllActivities ? activities : activities.slice(0, 5);

  // Fetch Data
  useEffect(() => {
    if (user) {
       // Fetch Activities
       api.get('/activities')
         .then(res => setActivities(res.data))
         .catch(err => console.error(err));
         
       // Fetch User Reviews
       api.get('/reviews/user')
         .then(res => setMyReviews(res.data))
         .catch(err => console.error(err));

       // Fetch Company Stats if owner
       if (user.ownedCompanyId) {
          api.get(`/companies/${user.ownedCompanyId}`)
            .then(res => setCompanyStats(res.data))
            .catch(err => console.error(err));
       }
    }
  }, [user]);

  // Handlers
  const openEditReview = (review) => {
    setRating(review.rating);
    setDealAgain(review.wouldDealAgain);
    setReviewText(review.comment);
    setEditingReviewId(review._id);
    
    setInitialReviewState({
      rating: review.rating,
      dealAgain: review.wouldDealAgain,
      reviewText: review.comment
    });
    
    setShowReviewModal(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
        const payload = {
          companyId: myReviews.find(r => r._id === editingReviewId).companyId._id,
          rating,
          wouldDealAgain: dealAgain,
          comment: reviewText
        };

        if (editingReviewId) {
          await api.put(`/reviews/edit/${editingReviewId}`, payload);
        }
        
        // Re-fetch reviews
        const res = await api.get('/reviews/user');
        setMyReviews(res.data);
        
        setHasSubmitted(true);

      setTimeout(() => {
        setHasSubmitted(false);
        setShowReviewModal(false);
        setRating(0);
        setDealAgain(null);
        setReviewText('');
        setEditingReviewId(null);
      }, 1500);

    } catch (error) {
       console.error("Failed to submit review:", error);
       alert(error.response?.data?.message || "Something went wrong.");
    }
  };

  const profile = user;
  const loading = !user;

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white pt-28 sm:pt-28 md:pt-36 pb-12 sm:pb-16 md:pb-20 relative overflow-hidden">
        {/* Background Gradients - animated orbs */}
        <div className="hidden sm:block absolute top-20 left-10 w-64 md:w-96 h-64 md:h-96 bg-brand-500/10 rounded-full blur-[100px] -z-10 orb-float-1"></div>
        <div className="hidden sm:block absolute bottom-20 right-10 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 orb-float-2"></div>

      <div className="container-custom max-w-4xl">
        <div className="reveal">
            {/* Header */}
            <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-white shadow-lg shadow-brand-500/10 flex items-center justify-center border border-white/50">
                   <User className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-brand-600" />
                </div>
                <div>
                   <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
                   <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium">Manage your account and subscription</p>
                </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
               {/* Cover / Top Section */}
               <div className="bg-gray-50 rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 md:p-8 lg:p-10 relative">
                  <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-50">
                      <ShieldCheck className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 text-gray-100 -rotate-12" />
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                      <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
                          <div 
                            className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex-shrink-0 cursor-pointer group avatar-pulse-ring"
                            onClick={() => fileInputRef.current?.click()}
                          >
                              {profile.profilePhoto ? (
                                <img 
                                  src={`${API_BASE}${profile.profilePhoto}`} 
                                  alt="Profile" 
                                  className="w-full h-full rounded-full object-cover shadow-lg ring-2 sm:ring-4 ring-white"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold shadow-lg ring-2 sm:ring-4 ring-white">
                                    {profile.companyName ? profile.companyName.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {uploadingPhoto ? (
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                  <Camera className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handlePhotoUpload}
                              />
                          </div>
                          <div className="min-w-0">
                              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                                  {profile.companyName || profile.name || 'User'}
                              </h2>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
                                     {profile.role || 'Member'}
                                  </span>
                                  {profile.isSubscribed ? (
                                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200 shadow-sm">
                                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 fill-amber-500 text-amber-500" /> Premium
                                     </span>
                                  ) : (
                                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                        Free Plan
                                     </span>
                                  )}
                              </div>
                          </div>
                      </div>

                      
                      {/* Quick Actions */}
                      <div className="flex gap-2 sm:gap-3">
                         {!profile.isSubscribed && (
                            <Button to="/subscription" variant="primary" className="shadow-lg shadow-brand-500/20 min-h-[44px] touch-target text-sm sm:text-base">
                               Upgrade Plan
                            </Button>
                         )}
                         {companyStats && (
                           <button 
                             onClick={() => setShowBCModal(true)}
                             className="flex items-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 hover:text-brand-600 transition-colors shadow-sm h-[44px]"
                           >
                             <CreditCard className="w-4 h-4 mr-2" />
                             Business Card
                           </button>
                         )}
                      </div>
                  </div>
               </div>

               {/* DASHBOARD & ANALYTICS (Owner Only) */}
               {companyStats ? (
                   <div className="bg-gray-50 rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 md:p-8 lg:p-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                         <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-brand-500" /> 
                            My Company Dashboard
                         </h3>
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit ${companyStats.status === 'APPROVED' ? 'bg-indigo-100 text-indigo-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {companyStats.status}
                         </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                         <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 count-up-glow">{companyStats.viewsCount || 0}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 flex items-center justify-center">
                               <Eye className="w-3 h-3 mr-1" /> Views
                            </div>
                         </div>
                         <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 count-up-glow">{companyStats.totalReviews || 0}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 flex items-center justify-center">
                               <Star className="w-3 h-3 mr-1" /> Reviews
                            </div>
                         </div>
                         <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 count-up-glow">{companyStats.avgRating || 0}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 flex items-center justify-center">
                               Rating
                            </div>
                         </div>
                         {/* Business Card Small Box */}

                      </div>
                  </div>
              ) : null}

               {/* ACTIVITY HISTORY */}
               <div className="bg-gray-50 rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 md:p-8 lg:p-10">
                   <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 sm:mb-6 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-brand-500" /> 
                      Recent Activity
                   </h3>
                   
                   <div className="space-y-4">
                      {activities.length > 0 ? (
                         displayedActivities.map((act) => (
                           <div key={act._id} className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                              <div className="mt-1 w-2 h-2 rounded-full bg-brand-400"></div>
                              <div>
                                 <p className="text-sm font-medium text-gray-900">{act.message}</p>
                                 <p className="text-xs text-gray-400 mt-1 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(act.createdAt).toLocaleDateString()}
                                 </p>
                              </div>
                           </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-sm italic">
                           No recent activity.
                        </div>
                      )}
                   </div>

                   {activities.length > 5 && (
                      <div className="mt-4 text-center">
                          <button 
                            onClick={() => setShowAllActivities(!showAllActivities)}
                            className="text-sm font-bold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            {showAllActivities ? 'Show Less' : `View All Activity`}
                          </button>
                      </div>
                   )}
               </div>


               {/* MY REVIEWS */}
               <div className="bg-gray-50 rounded-2xl shadow-md border border-gray-100 p-8 sm:p-10">
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-500" /> 
                      My Reviews
                   </h3>
                   
                   <div className="space-y-4">
                      {myReviews.length > 0 ? (
                        displayedReviews.map((review) => (
                           <div key={review._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 card-hover-lift">
                              <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{review.companyId?.name || "Unknown Company"}</h4>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                       <span className="flex items-center text-yellow-500 mr-2">
                                          {[...Array(5)].map((_, i) => (
                                             <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                          ))}
                                       </span>
                                       <span>• {new Date(review.updatedAt || review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={() => openEditReview(review)}
                                    className="text-sm text-brand-600 hover:text-white hover:bg-brand-600 px-3 py-1.5 rounded-lg border border-brand-200 hover:border-brand-600 font-medium flex items-center gap-1.5 transition-all"
                                 >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                 </button>
                              </div>
                              <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                           </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-sm italic">
                           You haven't written any reviews yet.
                        </div>
                      )}
                   </div>

                   {myReviews.length > 3 && (
                      <div className="mt-6 text-center border-t border-gray-50 pt-4">
                          <button 
                            onClick={() => setShowAllReviews(!showAllReviews)}
                            className="text-sm font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center justify-center mx-auto"
                          >
                            {showAllReviews ? 'Show Less' : `View All ${myReviews.length} Reviews`}
                          </button>
                      </div>
                   )}
               </div>

               {/* Details Grid */}
               <div className="bg-gray-50 rounded-2xl shadow-md border border-gray-100 p-8 sm:p-10">
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center">
                      <User className="w-4 h-4 mr-2 text-brand-500" /> 
                      Contact Information
                   </h3>
                   
                   <div className="grid md:grid-cols-2 gap-6 mb-10">
                       <div className="group p-4 rounded-xl bg-white border border-gray-100 shadow-sm card-hover-lift">
                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                   <Mail className="w-5 h-5 text-blue-600" />
                               </div>
                               <div className="overflow-hidden">
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Email Address</p>
                                   <p className="text-sm font-medium text-gray-900 truncate" title={profile.email}>{profile.email}</p>
                               </div>
                           </div>
                       </div>

                       <div className="group p-4 rounded-xl bg-white border border-gray-100 shadow-sm card-hover-lift">
                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                   <Phone className="w-5 h-5 text-indigo-600" />
                               </div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Phone Number</p>
                                   <p className="text-sm font-medium text-gray-900">{profile.contactNumber || profile.phone || '—'}</p>
                               </div>
                           </div>
                       </div>

                       <div className="group p-4 rounded-xl bg-white border border-gray-100 shadow-sm card-hover-lift">
                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                   <Calendar className="w-5 h-5 text-purple-600" />
                               </div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                      {profile.isSubscribed ? 'Premium Member Since' : 'Member Since'}
                                   </p>
                                   <p className="text-sm font-medium text-gray-900">
                                      {profile.subscription?.activatedAt 
                                        ? new Date(profile.subscription.activatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'}) 
                                        : (profile.createdAt 
                                            ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'}) 
                                            : '—')
                                      }
                                   </p>
                               </div>
                           </div>
                       </div>
                       
                       {profile.isSubscribed && (
                           <div className="group p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shadow-sm">
                               <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                       <CreditCard className="w-5 h-5 text-amber-600" />
                                   </div>
                                   <div>
                                       <p className="text-xs font-bold text-amber-600/70 uppercase tracking-wide">Subscription</p>
                                       <p className="text-sm font-bold text-amber-800">Premium Active</p>
                                   </div>
                               </div>
                           </div>
                       )}
                   </div>

                   {/* Action Buttons */}
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center pt-6 border-t border-gray-100">
                      <ShieldCheck className="w-4 h-4 mr-2 text-brand-500" /> 
                      Account Actions
                   </h3>

                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {profile.companyId && (
                             <button
                               onClick={() => navigate(`/company/${profile.companyId}`)}
                               className="flex items-center justify-center px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group"
                             >
                                <Building2 className="w-4 h-4 mr-2 text-gray-400 group-hover:text-brand-600" />
                                View Company Profile
                             </button>
                      )}



                      <button 
                         onClick={logout}
                         className="flex items-center justify-center px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 font-medium hover:bg-red-100 hover:border-red-200 transition-all shadow-sm"
                      >
                         <LogOut className="w-4 h-4 mr-2" />
                         Sign Out
                      </button>
                   </div>
               </div>
            </div>
            
            <p className="text-center text-gray-400 text-sm mt-8">
               Member ID: <span className="font-mono">{profile._id}</span>
            </p>
        </div>
      </div>
      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-backdrop-blur" onClick={() => !hasSubmitted && setShowReviewModal(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden fade-in-scale">
            
            {!hasSubmitted ? (
              <>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-900">Edit Review</h3>
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
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-1 transition-transform hover:scale-110 focus:outline-none ${rating >= star ? 'text-yellow-400 scale-110' : 'text-gray-200 hover:text-yellow-200'}`}
                        >
                          <Star className="w-8 h-8 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deal Again Toggle */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Would you deal with them again?</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setDealAgain(true)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center transition-all ${dealAgain === true ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" /> Yes, definitely
                      </button>
                      <button
                        type="button"
                        onClick={() => setDealAgain(false)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center transition-all ${dealAgain === false ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}
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
                      Update Review
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <Check className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Updated!</h3>
                <p className="text-gray-500">
                  Your feedback has been successfully updated.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Business Card Upload Modal */}
      {showBCModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowBCModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                   <CreditCard className="w-5 h-5 text-brand-600" />
                   Manage Business Card
                </h3>
                <button onClick={() => setShowBCModal(false)} className="text-gray-400 hover:text-gray-900">
                   <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front Upload */}
                    <div className="space-y-3">
                       <label className="block text-sm font-bold text-gray-700">Front Side</label>
                       <label className="cursor-pointer block relative group">
                          <div className="aspect-[1.6] rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-brand-50 transition-all flex flex-col items-center justify-center relative overflow-hidden bg-gray-50">
                              {bcFront ? (
                                <img src={URL.createObjectURL(bcFront)} className="absolute inset-0 w-full h-full object-cover" />
                              ) : companyStats?.businessCard?.frontImageUrl ? (
                                <img src={`${API_BASE}${companyStats.businessCard.frontImageUrl}`} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center text-gray-400 group-hover:text-brand-500 transition-colors">
                                   <Upload className="w-8 h-8 mb-2" />
                                   <span className="text-xs font-semibold">Upload Front</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">Change Image</span>
                              </div>
                          </div>
                          <input type="file" className="hidden" onChange={(e) => handleBCFileChange(e, 'front')} accept="image/*" />
                       </label>
                    </div>

                    {/* Back Upload */}
                    <div className="space-y-3">
                       <label className="block text-sm font-bold text-gray-700">Back Side</label>
                       <label className="cursor-pointer block relative group">
                          <div className="aspect-[1.6] rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-brand-50 transition-all flex flex-col items-center justify-center relative overflow-hidden bg-gray-50">
                              {bcBack ? (
                                <img src={URL.createObjectURL(bcBack)} className="absolute inset-0 w-full h-full object-cover" />
                              ) : companyStats?.businessCard?.backImageUrl ? (
                                <img src={`${API_BASE}${companyStats.businessCard.backImageUrl}`} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center text-gray-400 group-hover:text-brand-500 transition-colors">
                                   <Upload className="w-8 h-8 mb-2" />
                                   <span className="text-xs font-semibold">Upload Back</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">Change Image</span>
                              </div>
                          </div>
                          <input type="file" className="hidden" onChange={(e) => handleBCFileChange(e, 'back')} accept="image/*" />
                       </label>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                   {(bcFront || bcBack) ? (
                      <Button 
                        onClick={handleBCUpload} 
                        disabled={uploadingBC}
                        className="shadow-lg shadow-brand-500/20"
                      >
                        {uploadingBC ? 'Uploading...' : 'Save Business Card'}
                      </Button>
                   ) : (
                      <button 
                        onClick={() => setShowBCModal(false)}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors text-sm"
                      >
                        Close
                      </button>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
