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
    <div className="min-h-screen bg-[#fafafa] pt-28 sm:pt-32 md:pt-36 pb-8 sm:pb-16 md:pb-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="hidden sm:block absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] -z-10 mix-blend-multiply"></div>
        <div className="hidden sm:block absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] -z-10 mix-blend-multiply"></div>

      <div className="container-custom max-w-6xl mx-auto px-3 sm:px-6">
        <div className="reveal">
            
            <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6 lg:gap-8">
               
               {/* LEFT SIDEBAR (Sticky on Desktop) */}
               <div className="w-full lg:w-[32%] shrink-0 space-y-4 sm:space-y-6 self-start">
                  <div className="lg:sticky lg:top-28 space-y-4 sm:space-y-6">
                     
                     {/* 1. Profile Identity Card */}
                     <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-200/60 p-5 sm:p-8 relative overflow-hidden group">
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                           <div 
                             className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full flex-shrink-0 cursor-pointer group/avatar mb-4 sm:mb-5 ring-4 ring-gray-50 shadow-md"
                             onClick={() => fileInputRef.current?.click()}
                           >
                               {profile.profilePhoto ? (
                                 <img 
                                   src={`${API_BASE}${profile.profilePhoto}`} 
                                   alt="Profile" 
                                   className="w-full h-full rounded-full object-cover"
                                 />
                               ) : (
                                 <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                                     {profile.companyName ? profile.companyName.charAt(0).toUpperCase() : 'U'}
                                 </div>
                               )}
                               <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                 {uploadingPhoto ? (
                                   <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                 ) : (
                                   <Camera className="w-6 h-6 text-white" />
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
                           
                           <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 tracking-tight">
                               {profile.companyName || profile.name || 'User'}
                           </h2>
                           <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                               <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                                  {profile.role || 'Member'}
                               </span>
                               {profile.isSubscribed ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-700">
                                     <Star className="w-3 h-3 mr-1 fill-current" /> Premium
                                  </span>
                               ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-gray-100 text-gray-500">
                                     Free Plan
                                  </span>
                               )}
                           </div>
                           
                           {/* Quick Actions */}
                           <div className="w-full flex flex-col gap-2.5 sm:gap-3">
                              {!profile.isSubscribed && (
                                 <Button to="/subscription" variant="primary" fullWidth className="shadow-md shadow-brand-500/20 py-3">
                                   Upgrade to Premium
                                 </Button>
                              )}
                              {companyStats && (
                                <button 
                                  onClick={() => setShowBCModal(true)}
                                  className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 hover:text-brand-600 transition-all"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Manage Business Card
                                </button>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Company Performance - Mobile Only (shown above Contact Details) */}
                     {companyStats ? (
                       <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4">
                         <div className="flex items-center justify-between gap-2 mb-5">
                            <div>
                               <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center">
                                  <Activity className="w-4 h-4 mr-2 text-brand-500" /> 
                                  Company Performance
                               </h3>
                               <p className="text-xs text-gray-500 mt-0.5">Overview of your public profile metrics.</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit border ${companyStats.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                               {companyStats.status}
                            </span>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                               <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Views</div>
                               <div className="text-xl font-bold text-gray-900 tracking-tight">{companyStats.viewsCount || 0}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                               <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Reviews</div>
                               <div className="text-xl font-bold text-gray-900 tracking-tight">{companyStats.totalReviews || 0}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                               <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Rating</div>
                               <div className={`text-xl font-bold tracking-tight flex items-baseline gap-0.5 ${
                                   companyStats.avgRating >= 4.5 ? 'text-green-600' :
                                   companyStats.avgRating >= 3.5 ? 'text-lime-500' :
                                   companyStats.avgRating >= 2.5 ? 'text-yellow-500' :
                                   companyStats.avgRating >= 1.5 ? 'text-orange-500' : 
                                   companyStats.avgRating > 0 ? 'text-red-600' : 'text-gray-400'
                               }`}>
                                  {companyStats.avgRating > 0 ? companyStats.avgRating.toFixed(1) : 0}
                                  <span className="text-xs text-gray-400 font-medium">/ 5</span>
                               </div>
                            </div>
                         </div>
                       </div>
                     ) : null}

                     {/* 2. Contact Information */}
                     <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-200/60 p-5 sm:p-8">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 sm:mb-6 flex items-center text-brand-600">
                           <User className="w-4 h-4 mr-2" /> Contact details
                        </h3>
                        <div className="space-y-4 sm:space-y-5">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                                    <p className="text-sm font-medium text-gray-900 truncate" title={profile.email}>{profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{profile.contactNumber || profile.phone || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                                       {profile.isSubscribed ? 'Premium Since' : 'Joined'}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 truncate">
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
                     </div>

                     {/* 3. Account Actions - Desktop Only */}
                     <div className="hidden lg:block bg-white rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-200/60 p-5 sm:p-8">
                         <div className="flex flex-col gap-3">
                           {profile.companyId && (
                                  <button
                                    onClick={() => navigate(`/company/${profile.companyId}`)}
                                    className="w-full flex items-center justify-center px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all shadow-sm"
                                  >
                                     <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                     View Public Profile
                                  </button>
                           )}
                           <button 
                              onClick={logout}
                              className="w-full flex items-center justify-center px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-all shadow-sm"
                           >
                              <LogOut className="w-4 h-4 mr-2" />
                              Sign Out
                           </button>
                         </div>
                     </div>

                  </div>
               </div>

               {/* RIGHT MAIN CONTENT */}
               <div className="w-full lg:w-[68%] grow space-y-4 sm:space-y-6">
                  
                  {/* DASHBOARD & ANALYTICS (Owner Only) - Desktop Only */}
                  {companyStats ? (
                      <div className="hidden lg:block bg-white rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-200/60 p-4 sm:p-8">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-5 sm:mb-8">
                            <div>
                               <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center">
                                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-brand-500" /> 
                                  Company Performance
                               </h3>
                               <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Overview of your public profile metrics.</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit border ${companyStats.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                               {companyStats.status}
                            </span>
                         </div>
                         
                         <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="bg-gray-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 relative overflow-hidden group">
                               <div className="hidden sm:block absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <Eye className="w-12 h-12" />
                               </div>
                               <div className="text-[10px] sm:text-xs uppercase font-bold text-gray-500 mb-1 sm:mb-2">Views</div>
                               <div className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">{companyStats.viewsCount || 0}</div>
                            </div>
                            
                            <div className="bg-gray-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 relative overflow-hidden group">
                               <div className="hidden sm:block absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <Star className="w-12 h-12 fill-current" />
                               </div>
                               <div className="text-[10px] sm:text-xs uppercase font-bold text-gray-500 mb-1 sm:mb-2">Reviews</div>
                               <div className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">{companyStats.totalReviews || 0}</div>
                            </div>
                            
                            <div className="bg-gray-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 relative overflow-hidden group">
                               <div className="hidden sm:block absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <ThumbsUp className="w-12 h-12" />
                               </div>
                               <div className="text-[10px] sm:text-xs uppercase font-bold text-gray-500 mb-1 sm:mb-2">Rating</div>
                               <div className={`text-xl sm:text-3xl font-bold tracking-tight flex items-baseline gap-0.5 sm:gap-1 ${
                                   companyStats.avgRating >= 4.5 ? 'text-green-600' :
                                   companyStats.avgRating >= 3.5 ? 'text-lime-500' :
                                   companyStats.avgRating >= 2.5 ? 'text-yellow-500' :
                                   companyStats.avgRating >= 1.5 ? 'text-orange-500' : 
                                   companyStats.avgRating > 0 ? 'text-red-600' : 'text-gray-400'
                               }`}>
                                  {companyStats.avgRating > 0 ? companyStats.avgRating.toFixed(1) : 0}
                                  <span className="text-xs sm:text-base text-gray-400 font-medium">/ 5</span>
                               </div>
                            </div>
                         </div>
                     </div>
                 ) : null}

                 {/* MY REVIEWS */}
                 <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-200/60 p-4 sm:p-8">
                     <div className="flex items-center justify-between mb-5 sm:mb-8 pb-3 sm:pb-4 border-b border-gray-100">
                         <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Reviews I've Written</h3>
                         {myReviews.length > 3 && (
                             <button 
                               onClick={() => setShowAllReviews(!showAllReviews)}
                               className="text-sm font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
                             >
                               {showAllReviews ? 'Show Less' : `View All (${myReviews.length})`}
                             </button>
                         )}
                     </div>
                     
                     <div className={`space-y-3 sm:space-y-4 ${showAllReviews ? 'max-h-[500px] overflow-y-auto pr-1' : ''}`}>
                        {myReviews.length > 0 ? (
                          displayedReviews.map((review) => (
                             <div key={review._id} className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-brand-200/50 transition-colors group">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2.5 sm:mb-3">
                                   <div className="min-w-0 sm:mr-4">
                                      <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1 sm:mb-1.5 group-hover:text-brand-600 transition-colors truncate">{review.companyId?.name || "Unknown Company"}</h4>
                                      <div className="flex items-center text-xs text-gray-500">
                                         <div className="flex gap-0.5 mr-2.5">
                                           {[...Array(5)].map((_, idx) => {
                                              const activeColor = review.rating >= 5 ? 'bg-emerald-500' :
                                                                  review.rating >= 4 ? 'bg-lime-500' :
                                                                  review.rating >= 3 ? 'bg-yellow-400' :
                                                                  review.rating >= 2 ? 'bg-orange-500' : 'bg-red-500';
                                              return (
                                                <div key={idx} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm flex items-center justify-center ${idx < review.rating ? activeColor : 'bg-gray-200'}`}>
                                                   <Star className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${idx < review.rating ? 'text-white fill-current' : 'text-transparent'}`} />
                                                </div>
                                              );
                                           })}
                                         </div>
                                         <span className="font-medium shrink-0">{new Date(review.updatedAt || review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                      </div>
                                   </div>
                                   <button 
                                      onClick={() => openEditReview(review)}
                                      className="text-xs sm:text-sm text-gray-500 hover:text-brand-600 bg-white hover:bg-brand-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 hover:border-brand-200 font-medium flex items-center gap-1 sm:gap-1.5 transition-all shadow-sm shrink-0 w-fit"
                                   >
                                      <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                      Edit
                                   </button>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-white/60 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-gray-100/50">"{review.comment}"</p>
                             </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-gray-400 text-sm">
                             <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                             You haven't left any reviews yet.
                          </div>
                        )}
                     </div>
                 </div>

                 {/* Account Actions - Mobile Only (shown below Reviews) */}
                 <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
                     <div className="flex flex-col gap-3">
                       {profile.companyId && (
                              <button
                                onClick={() => navigate(`/company/${profile.companyId}`)}
                                className="w-full flex items-center justify-center px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all shadow-sm"
                              >
                                 <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                 View Public Profile
                              </button>
                       )}
                       <button 
                          onClick={logout}
                          className="w-full flex items-center justify-center px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-all shadow-sm"
                       >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                       </button>
                     </div>
                 </div>


               </div>
            </div>
            
            <p className="text-center text-gray-400/50 hover:text-gray-400 transition-colors text-xs mt-12 mb-4 font-mono select-all">
               Member ID: {profile._id}
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
