import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ShieldCheck, Building2, TrendingUp, Zap, Crown, CheckCircle, Shield, Search, Lock, FileText, Globe, Star, AlertCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Input from '../components/ui/Input';
import Silk from '../components/effects/Silk';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import useScrollReveal from '../hooks/useScrollReveal';
import api from '../services/api';
import axios from 'axios';

<Silk
  speed={5}
  scale={1}
  color="#4F46E5"
  noiseIntensity={1.5}
  rotation={0}
/>

// Avatar gradient colors to assign to reviews
const avatarGradients = [
  "from-brand-400 to-indigo-600",
  "from-indigo-400 to-purple-600",
  "from-blue-400 to-cyan-600",
  "from-pink-400 to-rose-600",
  "from-violet-400 to-purple-600",
  "from-cyan-400 to-blue-600",
  "from-red-400 to-pink-600",
];

// Fallback testimonials shown when no real reviews exist in database
const fallbackTestimonials = [
  {
    quote: "We verified 200+ suppliers in our first month. The GST validation alone saved us from three fraudulent dealers.",
    name: "Priya Sharma",
    title: "Head of Procurement, Loom & Weave Exports",
    gradient: "from-brand-400 to-indigo-600",
    rating: 5,
  },
  {
    quote: "Before TextileTrust, onboarding a new yarn supplier took weeks. Now we verify and connect in under 10 minutes.",
    name: "Amit Patel",
    title: "CEO, Patel Yarn Industries",
    gradient: "from-brand-400 to-indigo-600",
    rating: 5,
  },
  {
    quote: "The trust scores and deal-again ratings give us real confidence before placing large fabric orders.",
    name: "Sneha Agarwal",
    title: "Director, Agarwal Textile House",
    gradient: "from-brand-400 to-indigo-600",
    rating: 5,
  },
  {
    quote: "As a dyeing unit, getting found by the right manufacturers was hard. Our verified profile changed everything.",
    name: "Karan Desai",
    title: "Owner, Desai Dyeing & Printing",
    gradient: "from-pink-400 to-rose-600",
    rating: 4,
  },
  {
    quote: "We reduced bad debts by 40% this year just by checking company profiles and reviews before every deal.",
    name: "Rohit Jain",
    title: "Partner, Jain Brothers Wholesale",
    gradient: "from-violet-400 to-purple-600",
    rating: 5,
  },
];

// Format backend role to display text
const formatRole = (role) => {
  if (!role) return '';
  return role.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'marketing'; // 'marketing', 'form', 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [gstError, setGstError] = useState('');
  const [panError, setPanError] = useState('');

  // Redirect if already subscribed
  useEffect(() => {
    if (user?.isSubscribed && user?.registeredCompanyId) {
      navigate(`/company/${user.registeredCompanyId}`, { replace: true });
    } else if (user?.isSubscribed) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Testimonial: starts with a random fallback, replaced by real review if available
  const [testimonial, setTestimonial] = useState(() =>
    fallbackTestimonials[Math.floor(Math.random() * fallbackTestimonials.length)]
  );

  // Try to fetch a real featured review — replaces fallback if found
  useEffect(() => {
    const fetchFeaturedReview = async () => {
      try {
        const { data } = await api.get('/reviews/featured');
        if (data && data.length > 0) {
          const picked = data[Math.floor(Math.random() * data.length)];
          if (picked.comment) {
            setTestimonial({
              quote: picked.comment,
              name: picked.reviewerCompany,
              title: `${formatRole(picked.reviewerRole)}, reviewed ${picked.companyName}`,
              gradient: avatarGradients[Math.floor(Math.random() * avatarGradients.length)],
              rating: picked.rating,
              photo: picked.reviewerPhoto || null,
            });
          }
        }
      } catch {
        // Keep fallback testimonial — no action needed
      }
    };
    fetchFeaturedReview();
  }, []);

  // Enable scroll animations - re-run when view changes
  useScrollReveal(view);


  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    gstNumber: '',
    panNumber: '',
    city: '',
    businessType: '',
    contactPerson: '',
    contactNumber: user?.contactNumber || '',
    email: user?.email || '',
  });

  // ── GST Verification State ──
  const [gstSessionId, setGstSessionId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [gstVerifyStatus, setGstVerifyStatus] = useState('idle'); // 'idle' | 'captcha' | 'loading' | 'success' | 'error'
  const [gstVerifyError, setGstVerifyError] = useState('');
  const [gstDetails, setGstDetails] = useState(null);
  const [isGstVerified, setIsGstVerified] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const GST_API_BASE = 'http://localhost:5003/api/gst';

  // Fetch captcha from the GST verification API
  const fetchGstCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaInput('');
    setGstVerifyError('');
    try {
      const res = await axios.get(`${GST_API_BASE}/captcha`);
      setGstSessionId(res.data.sessionId);
      setCaptchaImage(res.data.image);
      setGstVerifyStatus('captcha');
    } catch (err) {
      console.error('Captcha fetch failed:', err);
      setGstVerifyError('Failed to load captcha. Please try again.');
      setGstVerifyStatus('error');
    } finally {
      setCaptchaLoading(false);
    }
  };

  // Verify GST using captcha
  const verifyGst = async () => {
    if (!captchaInput.trim()) {
      setGstVerifyError('Please enter the captcha.');
      return;
    }
    setGstVerifyStatus('loading');
    setGstVerifyError('');
    try {
      const res = await axios.post(`${GST_API_BASE}/verify`, {
        sessionId: gstSessionId,
        GSTIN: formData.gstNumber,
        captcha: captchaInput
      });

      console.log('GST API raw response:', JSON.stringify(res.data, null, 2));

      // The backend returns the GST data directly (already unwrapped)
      // But handle both cases: res.data could be { gstin, lgnm, ... } directly
      // or could be wrapped as { data: { gstin, lgnm, ... } }
      let data = res.data;
      if (data && data.data && data.data.gstin) {
        data = data.data; // Unwrap if nested
      }

      console.log('Parsed GST data:', data);

      // Check for error from gov API
      if (!data || !data.gstin || data.errorCode || data.error) {
        setGstVerifyError('Invalid GST or captcha. Please try again.');
        setGstVerifyStatus('error');
        fetchGstCaptcha(); // Auto-refresh captcha
        return;
      }

      // Success — set details and autofill
      console.log('GST Verified! Trade Name:', data.tradeNam, 'Legal Name:', data.lgnm);
      setGstDetails(data);
      setIsGstVerified(true);
      setGstVerifyStatus('success');

      // Autofill company name from trade name or legal name
      const autoName = data.tradeNam || data.lgnm || '';
      if (autoName) {
        setFormData(prev => ({ ...prev, companyName: autoName }));
      }
    } catch (err) {
      console.error('GST verification failed:', err);
      setGstVerifyError(err.response?.data?.error || 'Verification failed. Please try again.');
      setGstVerifyStatus('error');
      fetchGstCaptcha();
    }
  };

  // Reset GST verification when GST number changes
  const resetGstVerification = () => {
    setGstVerifyStatus('idle');
    setGstDetails(null);
    setIsGstVerified(false);
    setCaptchaImage('');
    setCaptchaInput('');
    setGstSessionId('');
    setGstVerifyError('');
  };

  const validateGST = (gst) => {
    if (!gst) {
      setGstError('');
      return true;
    }

    // GSTIN Format: 2 digits (state) + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
    // ^[0-9]{2} = State Code (01-37)
    // [A-Z]{5}[0-9]{4}[A-Z]{1} = PAN (5 letters, 4 numbers, 1 letter)
    // [1-9A-Z]{1} = Entity Code (1-9 or A-Z)
    // Z = Default character
    // [0-9A-Z]{1}$ = Checksum digit
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (gst.length !== 15) {
      setGstError('GST Number must be exactly 15 characters long');
      return false;
    }

    if (!gstRegex.test(gst)) {
      setGstError('Invalid GST format. Example: 22AAAAA0000A1Z5');
      return false;
    }

    const stateCode = parseInt(gst.substring(0, 2), 10);
    if (stateCode < 1 || stateCode > 37) {
      setGstError('Invalid State Code. Must be between 01 and 37');
      return false;
    }

    setGstError('');
    return true;
  };

  const validatePAN = (pan) => {
    if (!pan) {
      setPanError('');
      return true;
    }

    // PAN Format: 5 letters + 4 digits + 1 letter
    // [A-Z]{5} = First 5 alphabets
    // [0-9]{4} = Next 4 numerals
    // [A-Z]{1} = Last alphabet (check digit)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (pan.length !== 10) {
      setPanError('PAN must be exactly 10 characters long');
      return false;
    }

    if (!panRegex.test(pan)) {
      setPanError('Invalid PAN format. Example: ABCDE1234F');
      return false;
    }

    setPanError('');
    return true;
  };

  // Identity Check State
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { type: 'GST' | 'PAN', name: string }

  const checkIdentity = async (field, value) => {
    if (!value || value.length < 5) return;
    
    try {
      const type = field === 'gstNumber' ? 'gst' : 'pan';
      // Only check if valid format to save API calls
      if (type === 'gst' && !validateGST(value)) return;
      if (type === 'pan' && !validatePAN(value)) return;

      const { data } = await api.get(`/companies/check-identity?${type}=${value}`);
      
      if (data.exists) {
        setDuplicateWarning({
          type: data.matchSource,
          name: data.companyName,
          id: data.companyId
        });
      } else {
        // Clear warning only if the currently warned field is being changed
        if (duplicateWarning?.type === (type === 'gst' ? 'GST' : 'PAN')) {
           setDuplicateWarning(null);
        }
      }
    } catch (error) {
      console.error("Identity check failed:", error);
      if (error.response && error.response.status === 404) {
          alert("BACKEND UPDATE REQUIRED: The server is running old code. Please restart 'npm start' in the backend terminal to enable the identity check.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    
    if (id === 'gstNumber') {
      const uppercaseValue = value.toUpperCase();
      let newFormData = { ...formData, [id]: uppercaseValue };
      
      // Reset GST verification if number changes
      if (isGstVerified || gstVerifyStatus !== 'idle') {
        resetGstVerification();
      }

      // Auto-extract PAN from GST
      if (uppercaseValue.length >= 12) {
          const extractedPan = uppercaseValue.substring(2, 12);
          
          if (validatePAN(extractedPan)) {
              newFormData.panNumber = extractedPan;
              // Also validate/check identity for the new PAN
              if (extractedPan.length === 10) checkIdentity('panNumber', extractedPan);
          }
      } else {
          // Clear PAN if GST is too short/cleared, since PAN is locked and derived
          newFormData.panNumber = '';
          setPanError('');
      }

      setFormData(newFormData);
      validateGST(uppercaseValue);
      if (uppercaseValue.length === 15) {
        checkIdentity(id, uppercaseValue);
        // Auto-fetch captcha when GST is complete and valid
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (gstRegex.test(uppercaseValue)) {
          fetchGstCaptcha();
        }
      }
    } else if (id === 'panNumber') {
      const uppercaseValue = value.toUpperCase();
      setFormData({ ...formData, [id]: uppercaseValue });
      validatePAN(uppercaseValue);
      if (uppercaseValue.length === 10) checkIdentity(id, uppercaseValue);
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (duplicateWarning) return; // Block submission

    setIsLoading(true);
    
    try {
      // Validate before submission
      if (!validateGST(formData.gstNumber)) {
        setIsLoading(false);
        return;
      }
      if (formData.panNumber && !validatePAN(formData.panNumber)) {
        setIsLoading(false);
        return;
      }

      // Redirect to Payment Gateway page with form data + GST verification info
      navigate('/payment', { state: { formData: { ...formData, gstDetails: gstDetails || null, isGstVerified } } });
    } catch (error) {
       console.error("Validation failed:", error);
    } finally {
       setIsLoading(false);
    }
  };


  if (view === 'success') {
    return (
      <div className="min-h-screen pt-24 sm:pt-32 md:pt-40 pb-20 sm:pb-32 px-4 flex items-center justify-center bg-future-midnight" data-nav-theme="dark">
        <GlassCard className="max-w-xl w-full text-center p-6 sm:p-12 reveal">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-8 border border-indigo-200">
            <CheckCircle className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-future-carbon mb-4">Subscription Request Submitted</h2>
          <p className="text-future-steel text-lg mb-10 leading-relaxed">
            Your subscription request has been submitted successfully. Our team will verify your details and activate your subscription shortly.
          </p>
          <div className="flex flex-col gap-4 justify-center mt-8">
             <Button onClick={() => user?.registeredCompanyId && navigate(`/company/${user.registeredCompanyId}`)} variant="primary" className="mx-auto px-10 shadow-xl shadow-brand-500/20" disabled={!user?.registeredCompanyId}>
              View Company Profile
             </Button>
             <button onClick={() => navigate('/')} className="text-future-steel font-medium text-sm hover:text-white transition-colors">
               Skip to Dashboard
             </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-future-midnight lg:bg-[#020617] overflow-x-hidden" data-nav-theme="dark">
        {/* Left Panel - Immersive Dark Sidebar (Desktop only) */}
        <div className="hidden lg:flex flex-col justify-between w-full lg:w-5/12 bg-black p-12 relative overflow-hidden text-white">
           {/* Background FX */}
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/20 rounded-full blur-[100px] opacity-40 -translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-900/40 rounded-full blur-[100px] opacity-50 translate-y-1/2 -translate-x-1/2"></div>
           <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05]"></div>

           <div className="relative z-10 mt-20">
             <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-brand-300 text-xs font-medium uppercase tracking-wider mb-8 backdrop-blur-md shadow-lg shadow-black/20">
                <Zap className="w-3 h-3 mr-2 text-yellow-400" /> Premium Access
             </div>
             <h2 className="text-4xl font-bold mb-6 leading-tight text-white drop-shadow-xl">Get verified in minutes, not weeks.</h2>
             <p className="text-gray-300 text-lg mb-12 leading-relaxed">
               Submit your GST details, and your company profile goes live instantly with a verified trust badge.
             </p>

             <div className="space-y-8">
               <div className="flex items-start">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-500/30 ring-4 ring-brand-500/20">
                   1
                 </div>
                 <div className="ml-4">
                   <h3 className="text-white font-semibold">Enter Business Details</h3>
                   <p className="text-sm text-gray-400 mt-1">GST number, PAN & contact info</p>
                 </div>
               </div>
               <div className="flex items-start">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 font-bold text-sm border border-white/10">
                   2
                 </div>
                 <div className="ml-4">
                   <h3 className="text-white/40 font-semibold">Instant GST Verification</h3>
                   <p className="text-sm text-white/20 mt-1">We validate your GST & PAN in real-time</p>
                 </div>
               </div>
               <div className="flex items-start">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 font-bold text-sm border border-white/10">
                   3
                 </div>
                 <div className="ml-4">
                   <h3 className="text-white/40 font-semibold">Go Live & Start Trading</h3>
                   <p className="text-sm text-white/20 mt-1">Your verified profile is searchable instantly</p>
                 </div>
               </div>
             </div>
           </div>

           <div className="relative z-10 pt-12">
              <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
                 <div className="flex items-center gap-0.5 mb-4">
                     {[...Array(5)].map((_, i) => {
                       const activeColor = testimonial.rating >= 5 ? 'bg-green-600' :
                                           testimonial.rating >= 4 ? 'bg-lime-500' :
                                           testimonial.rating >= 3 ? 'bg-yellow-400' :
                                           testimonial.rating >= 2 ? 'bg-orange-500' : 'bg-red-600';
                       return (
                         <div key={i} className={`w-5 h-5 rounded-[3px] flex items-center justify-center ${i < testimonial.rating ? activeColor : 'bg-white/10'}`}>
                           <Star className={`w-3 h-3 ${i < testimonial.rating ? 'text-white fill-white' : 'text-white/20'}`} />
                         </div>
                       );
                     })}
                  </div>
                  <p className="text-sm text-gray-300 italic mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                     <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                       {testimonial.photo ? (
                         <img src={`http://localhost:5003${testimonial.photo}`} alt={testimonial.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className={`w-full h-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white text-sm font-bold`}>
                           {testimonial.name ? testimonial.name.substring(0, 2).toUpperCase() : 'U'}
                         </div>
                       )}
                     </div>
                     <div className="ml-3">
                        <div className="text-xs font-bold text-white">{testimonial.name}</div>
                        <div className="text-[10px] text-gray-400">{testimonial.title}</div>
                     </div>
                  </div>
               </div>
            </div>
        </div>

        {/* Right Panel - Form */}
        {/* Mobile: Login-style centered glass card on dark bg */}
        {/* Desktop: Original white bg with wide scrollable form */}
        <div className="flex-1 w-full relative bg-transparent lg:bg-white overflow-x-hidden">
           {/* Mobile Background Decor (same as Login page) */}
           <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-brand-500/20 blur-[80px] lg:hidden pointer-events-none"></div>
           <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-600/20 blur-[80px] lg:hidden pointer-events-none"></div>

           {/* Mobile: centered glass card layout (like Login page) */}
           <div className="flex items-start justify-center px-4 sm:px-6 pt-24 pb-24 sm:pt-32 sm:pb-32 min-h-screen lg:hidden relative">
             <div className="w-full max-w-md space-y-6 glass p-6 sm:p-8 rounded-2xl sm:rounded-3xl relative z-10">
                {/* Mobile Logo */}
                <div className="text-center">
                  <div className="mb-4 sm:mb-6 flex justify-center">
                      <Logo variant="dark" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-future-carbon tracking-tight">Business Information</h2>
                  <p className="mt-1 sm:mt-2 text-sm sm:text-base text-future-steel">
                    Please provide accurate details for GST verification.
                  </p>
                </div>

                <button
                  onClick={() => setSearchParams({ view: 'marketing' })}
                  className="text-sm font-medium text-future-steel hover:text-future-carbon flex items-center transition-colors font-mono tracking-wide"
                >
                  ← BACK TO PLANS
                </button>

                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-future-carbon uppercase tracking-widest border-b border-white/20 pb-3">Basic Info</h3>

                    {duplicateWarning && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg shadow-sm animate-fade-in">
                            <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-amber-800">This company is already registered</h3>
                                <div className="mt-2 text-sm text-amber-700">
                                <p>A company with this {duplicateWarning.type} number is already listed as <span className="font-bold">"{duplicateWarning.name}"</span>.</p>
                                </div>
                                <div className="mt-4">
                                <button type="button" onClick={() => navigate(`/company/${duplicateWarning.id}`)} className="bg-amber-100 px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-200">View Company Profile</button>
                                </div>
                            </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="gstNumber" className="block text-sm font-medium text-future-steel mb-2">GST Number <span className="text-brand-500">*</span></label>
                        <Input id="gstNumber" placeholder="e.g. 22AAAAA0000A1Z5" value={formData.gstNumber} onChange={handleInputChange} maxLength={15} className={`bg-white/50 border-future-smoke text-future-carbon placeholder:text-future-steel focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all rounded-xl py-3 px-4 text-sm sm:text-base min-h-[48px] ${gstError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`} required />
                        {gstError && <p className="mt-2 text-xs text-red-600 font-medium">{gstError}</p>}
                        {formData.panNumber && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all duration-300 ${
                              duplicateWarning?.type === 'PAN'
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : panError
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}>

                              PAN: {formData.panNumber}
                            </div>
                            {duplicateWarning?.type === 'PAN' ? (
                              <span className="text-xs text-red-600 font-medium animate-pulse flex items-center"><AlertCircle className="w-3 h-3 mr-1" />Already exists</span>
                            ) : (
                              <span className="text-xs text-future-steel">Auto-extracted from GST</span>
                            )}
                          </div>
                        )}
                        {panError && <p className="mt-2 text-xs text-red-600 font-medium">{panError}</p>}

                        {/* ── GST Verification Section (Mobile) ── */}
                        {(gstVerifyStatus !== 'idle' || captchaImage) && (
                          <div className="mt-4 p-4 rounded-xl border border-white/20 bg-white/30 backdrop-blur-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-future-carbon uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-brand-500" /> GST Verification
                              </h4>
                              {gstVerifyStatus !== 'success' && (
                                <button type="button" onClick={fetchGstCaptcha} disabled={captchaLoading} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1 transition-colors">
                                  <RefreshCw className={`w-3 h-3 ${captchaLoading ? 'animate-spin' : ''}`} /> Refresh
                                </button>
                              )}
                            </div>

                            {gstVerifyStatus === 'success' ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                  <span className="text-sm font-semibold text-emerald-800">GST Verified Successfully</span>
                                </div>
                                {gstDetails && (
                                  <div className="grid grid-cols-1 gap-2.5">
                                    {gstDetails.lgnm && (
                                      <div className="p-3 rounded-lg bg-white/60 border border-white/30">
                                        <span className="text-[10px] font-bold text-future-steel uppercase tracking-wider">Legal Name</span>
                                        <p className="text-sm font-semibold text-future-carbon mt-0.5">{gstDetails.lgnm}</p>
                                      </div>
                                    )}
                                    {gstDetails.tradeNam && (
                                      <div className="p-3 rounded-lg bg-white/60 border border-white/30">
                                        <span className="text-[10px] font-bold text-future-steel uppercase tracking-wider">Trade Name</span>
                                        <p className="text-sm font-semibold text-future-carbon mt-0.5">{gstDetails.tradeNam}</p>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2.5">
                                      {gstDetails.rgdt && (
                                        <div className="p-3 rounded-lg bg-white/60 border border-white/30">
                                          <span className="text-[10px] font-bold text-future-steel uppercase tracking-wider">Reg. Date</span>
                                          <p className="text-sm font-semibold text-future-carbon mt-0.5">{gstDetails.rgdt}</p>
                                        </div>
                                      )}
                                      {gstDetails.sts && (
                                        <div className="p-3 rounded-lg bg-white/60 border border-white/30">
                                          <span className="text-[10px] font-bold text-future-steel uppercase tracking-wider">Status</span>
                                          <p className={`text-sm font-semibold mt-0.5 ${gstDetails.sts === 'Active' ? 'text-emerald-700' : 'text-red-700'}`}>{gstDetails.sts}</p>
                                        </div>
                                      )}
                                    </div>
                                    {gstDetails.ctb && (
                                      <div className="p-3 rounded-lg bg-white/60 border border-white/30">
                                        <span className="text-[10px] font-bold text-future-steel uppercase tracking-wider">Business Type</span>
                                        <p className="text-sm font-semibold text-future-carbon mt-0.5">{gstDetails.ctb}</p>
                                      </div>
                                    )}
                                    {gstDetails.pradr?.adr && (
                                      <div className="p-3 rounded-lg bg-white/60 border border-white/30">
                                        <span className="text-[10px] font-bold text-future-steel uppercase tracking-wider">Address</span>
                                        <p className="text-sm font-semibold text-future-carbon mt-0.5 leading-relaxed">{gstDetails.pradr.adr}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {captchaImage && (
                                  <div className="flex items-center gap-3">
                                    <img src={captchaImage} alt="CAPTCHA" className="h-12 rounded-lg border border-white/30 bg-white" />
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Enter captcha"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), verifyGst())}
                                    className="flex-1 bg-white/50 border border-future-smoke text-future-carbon placeholder:text-future-steel rounded-xl py-2.5 px-3 text-sm focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all min-h-[42px]"
                                  />
                                  <button
                                    type="button"
                                    onClick={verifyGst}
                                    disabled={gstVerifyStatus === 'loading'}
                                    className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 flex items-center gap-1.5 min-h-[42px] shadow-lg shadow-brand-500/20"
                                  >
                                    {gstVerifyStatus === 'loading' ? (
                                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                    ) : (
                                      <><ShieldCheck className="w-4 h-4" /> Verify</>
                                    )}
                                  </button>
                                </div>
                                {gstVerifyError && (
                                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {gstVerifyError}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {isGstVerified && (
                          <p className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> GST Verified</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-future-steel mb-2">Company Name <span className="text-brand-500">*</span></label>
                        <Input id="companyName" placeholder="e.g. Apex Textiles Pvt Ltd" value={formData.companyName} onChange={handleInputChange} className={`bg-white/50 border-future-smoke text-future-carbon placeholder:text-future-steel focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all rounded-xl py-3 px-4 text-sm sm:text-base min-h-[48px] ${isGstVerified ? 'border-emerald-300 bg-emerald-50/30' : ''}`} required />
                        {isGstVerified && formData.companyName && (
                          <p className="mt-1.5 text-[11px] text-emerald-600 font-medium">Autofilled from GST verification</p>
                        )}
                      </div>

                      <div>
                         <label htmlFor="businessType" className="block text-sm font-medium text-future-steel mb-2">Business Type <span className="text-brand-500">*</span></label>
                          <div className="relative">
                            <select id="businessType" value={formData.businessType} onChange={handleInputChange} className="w-full bg-white/50 border border-future-smoke text-future-carbon text-sm rounded-xl block p-3 px-4 transition-all duration-300 outline-none appearance-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 min-h-[48px]" required>
                              <option value="" disabled hidden>Select Business Type</option>
                              <option value="Manufacturer">Manufacturer</option>
                              <option value="Trader">Trader</option>
                              <option value="Wholesaler">Wholesaler</option>
                              <option value="Retailer">Retailer</option>
                              <option value="Yarn Supplier">Yarn Supplier</option>
                              <option value="Fabric Manufacturer">Fabric Manufacturer</option>
                              <option value="Dyeing Unit">Dyeing Unit</option>
                              <option value="Printing Unit">Printing Unit</option>
                              <option value="Exporter">Exporter</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-future-steel"><ArrowRight className="w-4 h-4 rotate-90" /></div>
                          </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-future-carbon uppercase tracking-widest border-b border-white/20 pb-3">Contact Details</h3>
                    <div className="space-y-4">
                      <div>
                         <label htmlFor="contactPerson" className="block text-sm font-medium text-future-steel mb-2">Contact Person Name <span className="text-brand-500">*</span></label>
                         <Input id="contactPerson" placeholder="Full Name" value={formData.contactPerson} onChange={handleInputChange} className="bg-white/50 border-future-smoke text-future-carbon placeholder:text-future-steel focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all rounded-xl py-3 px-4 text-sm sm:text-base min-h-[48px]" required />
                      </div>
                      <div>
                         <label htmlFor="city" className="block text-sm font-medium text-future-steel mb-2">City <span className="text-brand-500">*</span></label>
                         <Input id="city" placeholder="e.g. Surat" value={formData.city} onChange={handleInputChange} className="bg-white/50 border-future-smoke text-future-carbon placeholder:text-future-steel focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all rounded-xl py-3 px-4 text-sm sm:text-base min-h-[48px]" required />
                      </div>
                      <div>
                         <label htmlFor="contactNumber" className="block text-sm font-medium text-future-steel mb-2">Official Contact Number <span className="text-brand-500">*</span></label>
                         <Input id="contactNumber" type="tel" placeholder="+91 98765 43210" value={formData.contactNumber} onChange={handleInputChange} className="bg-white/50 border-future-smoke text-future-carbon placeholder:text-future-steel focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all rounded-xl py-3 px-4 text-sm sm:text-base min-h-[48px]" required />
                      </div>
                      <div>
                         <label htmlFor="email" className="block text-sm font-medium text-future-steel mb-2">Official Email ID <span className="text-brand-500">*</span></label>
                         <Input id="email" type="email" placeholder="name@company.com" value={formData.email} onChange={handleInputChange} className="bg-white/50 border-future-smoke text-future-carbon placeholder:text-future-steel focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all rounded-xl py-3 px-4 text-sm sm:text-base min-h-[48px]" required />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col-reverse gap-3 border-t border-white/20">
                    <button type="button" onClick={() => setSearchParams({ view: 'marketing' })} className="w-full px-8 py-3 border border-future-smoke text-future-steel hover:bg-white/10 rounded-xl font-medium text-sm transition-all min-h-[48px]">Cancel</button>
                    <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center py-3 px-4 bg-future-graphite hover:bg-future-carbon text-white rounded-xl font-bold text-base shadow-lg shadow-future-graphite/20 hover:shadow-future-graphite/30 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed min-h-[48px] touch-target">
                      {isLoading ? 'Processing...' : 'Proceed to Payment'}
                    </button>
                  </div>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-future-smoke"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-transparent text-future-steel">Secure & Encrypted</span></div>
                </div>
             </div>
           </div>

           {/* Desktop: Original wide white form layout */}
           <div className="hidden lg:block h-full overflow-y-auto px-6 py-12 pt-36 md:px-16 lg:px-24">
             <div className="max-w-3xl mx-auto reveal">
                <button
                  onClick={() => setSearchParams({ view: 'marketing' })}
                  className="mb-8 text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center transition-colors font-mono tracking-wide"
                >
                  ← BACK TO PLANS
                </button>

                <div className="mb-10">
                   <h1 className="text-3xl font-bold text-gray-900 mb-3">Business Information</h1>
                   <p className="text-gray-500">Please provide accurate details for GST verification.</p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-8">
                  {/* Section 1 */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-3">Basic Info</h3>

                    {/* Duplicate Warning */}
                    {duplicateWarning && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm animate-fade-in">
                            <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-amber-800">
                                This company is already registered
                                </h3>
                                <div className="mt-2 text-sm text-amber-700">
                                <p>
                                    A company with this {duplicateWarning.type} number is already listed as <span className="font-bold">"{duplicateWarning.name}"</span>.
                                </p>
                                </div>
                                <div className="mt-4">
                                <div className="-mx-2 -my-1.5 flex">
                                    <button
                                    type="button"
                                    onClick={() => navigate(`/company/${duplicateWarning.id}`)}
                                    className="bg-amber-100 px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600"
                                    >
                                    View Company Profile
                                    </button>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                         <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-2">GST Number <span className="text-brand-500">*</span></label>
                         <Input
                          id="gstNumber"
                          placeholder="e.g. 22AAAAA0000A1Z5"
                          value={formData.gstNumber}
                          onChange={handleInputChange}
                          maxLength={15}
                          className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all rounded-xl py-3 px-4 shadow-sm ${gstError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                          required
                         />
                         {gstError && <p className="mt-2 text-sm text-red-600 font-medium">{gstError}</p>}
                         {formData.panNumber && (
                           <div className="mt-3 flex items-center gap-2.5">
                             <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold tracking-wide border transition-all duration-300 ${
                               duplicateWarning?.type === 'PAN'
                                 ? 'bg-red-50 border-red-200 text-red-700'
                                 : panError
                                   ? 'bg-red-50 border-red-200 text-red-700'
                                   : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                             }`}>

                               PAN: {formData.panNumber}
                             </div>
                             {duplicateWarning?.type === 'PAN' ? (
                               <span className="text-xs text-red-600 font-medium animate-pulse flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" />Already exists</span>
                             ) : (
                               <span className="text-sm text-gray-500">Auto-extracted from GST</span>
                             )}
                           </div>
                         )}
                         {panError && <p className="mt-2 text-sm text-red-600 font-medium">{panError}</p>}

                         {/* ── GST Verification Section (Desktop) ── */}
                         {(gstVerifyStatus !== 'idle' || captchaImage) && (
                           <div className="mt-5 p-5 rounded-xl border border-gray-200 bg-gray-50/80 space-y-4">
                             <div className="flex items-center justify-between">
                               <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                 <ShieldCheck className="w-4 h-4 text-brand-500" /> GST Verification
                               </h4>
                               {gstVerifyStatus !== 'success' && (
                                 <button type="button" onClick={fetchGstCaptcha} disabled={captchaLoading} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1.5 transition-colors">
                                   <RefreshCw className={`w-3.5 h-3.5 ${captchaLoading ? 'animate-spin' : ''}`} /> Refresh Captcha
                                 </button>
                               )}
                             </div>

                             {gstVerifyStatus === 'success' ? (
                               <div className="space-y-4">
                                 <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                                   <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                   <span className="text-sm font-semibold text-emerald-800">GST Verified Successfully</span>
                                 </div>
                                 {gstDetails && (
                                   <div className="grid grid-cols-2 gap-3">
                                     {gstDetails.lgnm && (
                                       <div className="col-span-2 p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Legal Name</span>
                                         <p className="text-sm font-semibold text-gray-900 mt-1">{gstDetails.lgnm}</p>
                                       </div>
                                     )}
                                     {gstDetails.tradeNam && (
                                       <div className="col-span-2 p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Trade Name</span>
                                         <p className="text-sm font-semibold text-gray-900 mt-1">{gstDetails.tradeNam}</p>
                                       </div>
                                     )}
                                     {gstDetails.rgdt && (
                                       <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Registration Date</span>
                                         <p className="text-sm font-semibold text-gray-900 mt-1">{gstDetails.rgdt}</p>
                                       </div>
                                     )}
                                     {gstDetails.sts && (
                                       <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</span>
                                         <p className={`text-sm font-semibold mt-1 ${gstDetails.sts === 'Active' ? 'text-emerald-700' : 'text-red-700'}`}>{gstDetails.sts}</p>
                                       </div>
                                     )}
                                     {gstDetails.ctb && (
                                       <div className="col-span-2 p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Constitution of Business</span>
                                         <p className="text-sm font-semibold text-gray-900 mt-1">{gstDetails.ctb}</p>
                                       </div>
                                     )}
                                     {gstDetails.pradr?.adr && (
                                       <div className="col-span-2 p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Registered Address</span>
                                         <p className="text-sm font-semibold text-gray-900 mt-1 leading-relaxed">{gstDetails.pradr.adr}</p>
                                       </div>
                                     )}
                                   </div>
                                 )}
                               </div>
                             ) : (
                               <div className="space-y-4">
                                 {captchaImage && (
                                   <div className="flex items-center gap-4">
                                     <img src={captchaImage} alt="CAPTCHA" className="h-14 rounded-xl border border-gray-300 bg-white shadow-sm" />
                                     <span className="text-xs text-gray-500">Enter the characters shown</span>
                                   </div>
                                 )}
                                 <div className="flex gap-3">
                                   <input
                                     type="text"
                                     placeholder="Enter captcha text"
                                     value={captchaInput}
                                     onChange={(e) => setCaptchaInput(e.target.value)}
                                     onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), verifyGst())}
                                     className="flex-1 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl py-3 px-4 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                                   />
                                   <button
                                     type="button"
                                     onClick={verifyGst}
                                     disabled={gstVerifyStatus === 'loading'}
                                     className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 flex items-center gap-2 shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30 transform hover:-translate-y-0.5"
                                   >
                                     {gstVerifyStatus === 'loading' ? (
                                       <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                     ) : (
                                       <><ShieldCheck className="w-4 h-4" /> Verify GST</>
                                     )}
                                   </button>
                                 </div>
                                 {gstVerifyError && (
                                   <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                                     <AlertCircle className="w-3.5 h-3.5" /> {gstVerifyError}
                                   </p>
                                 )}
                               </div>
                             )}
                           </div>
                         )}
                         {isGstVerified && (
                           <p className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> GST Verified</p>
                         )}
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Company Name <span className="text-brand-500">*</span></label>
                        <Input
                          id="companyName"
                          placeholder="e.g. Apex Textiles Pvt Ltd"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all rounded-xl py-3 px-4 shadow-sm ${isGstVerified ? 'border-emerald-400 bg-emerald-50/50' : ''}`}
                          required
                        />
                        {isGstVerified && formData.companyName && (
                          <p className="mt-1.5 text-xs text-emerald-600 font-medium">Autofilled from GST verification</p>
                        )}
                      </div>

                      <div>
                         <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">Business Type <span className="text-brand-500">*</span></label>
                          <div className="relative">
                            <select
                              id="businessType"
                              value={formData.businessType}
                              onChange={handleInputChange}
                              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 block p-3 px-4 transition-all duration-300 outline-none shadow-sm appearance-none"
                              required
                            >
                              <option value="" disabled hidden>Select Business Type</option>
                              <option value="Manufacturer">Manufacturer</option>
                              <option value="Trader">Trader</option>
                              <option value="Wholesaler">Wholesaler</option>
                              <option value="Retailer">Retailer</option>
                              <option value="Yarn Supplier">Yarn Supplier</option>
                              <option value="Fabric Manufacturer">Fabric Manufacturer</option>
                              <option value="Dyeing Unit">Dyeing Unit</option>
                              <option value="Printing Unit">Printing Unit</option>
                              <option value="Exporter">Exporter</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                              <ArrowRight className="w-4 h-4 rotate-90" />
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-3 mt-8">Contact Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                         <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">Contact Person Name <span className="text-brand-500">*</span></label>
                         <Input
                          id="contactPerson"
                          placeholder="Full Name"
                          value={formData.contactPerson}
                          onChange={handleInputChange}
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all rounded-xl py-3 px-4 shadow-sm"
                          required
                         />
                      </div>

                      <div>
                         <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-brand-500">*</span></label>
                         <Input
                          id="city"
                          placeholder="e.g. Surat"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all rounded-xl py-3 px-4 shadow-sm"
                          required
                         />
                      </div>

                      <div>
                         <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">Official Contact Number <span className="text-brand-500">*</span></label>
                         <Input
                          id="contactNumber"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.contactNumber}
                          onChange={handleInputChange}
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all rounded-xl py-3 px-4 shadow-sm"
                          required
                         />
                      </div>

                      <div className="md:col-span-2">
                         <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Official Email ID <span className="text-brand-500">*</span></label>
                         <Input
                          id="email"
                          type="email"
                          placeholder="name@company.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all rounded-xl py-3 px-4 shadow-sm"
                          required
                         />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 flex flex-col-reverse md:flex-row gap-4 border-t border-gray-200 mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSearchParams({ view: 'marketing' })}
                      className="w-full md:w-auto px-8 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={isLoading}
                      className="w-full md:w-auto px-10 shadow-xl shadow-brand-500/20"
                    >
                      {isLoading ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                  </div>
                </form>
             </div>
           </div>
        </div>
      </div>
    );
  }

  // Marketing View
  return (
    <div className="w-full">
      {/* Hero Section - Premium Dark Mode */}
      <section className="relative pt-24 sm:pt-32 md:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-future-midnight" data-nav-theme="dark">
        {/* Silk Background Effect */}
        <div className="absolute inset-0 z-0 opacity-30">
          <Silk
            speed={3}
            scale={1.2}
            color="#4F46E5"
            noiseIntensity={1}
            rotation={0.5}
          />
        </div>

        {/* Dark Background Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[120px] opacity-40 animate-pulse z-5"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/40 rounded-full blur-[120px] opacity-50 z-5"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] z-5"></div>
        
        <div className="container-custom relative z-10 text-center max-w-4xl mx-auto reveal">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-brand-300 text-sm font-medium mb-8 shadow-sm">
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            Premium Subscription
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8 leading-tight text-white">
            Unlock the Full Power of <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">Trusted Trade.</span>
          </h1>
          <p className="text-xl text-brand-100/80 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Go beyond basic verification. Get deep insights, credit risk assessments, and exclusive access to the top 1% of textile manufacturers.
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="primary" 
              onClick={() => {
                if (!user) {
                  navigate('/login', { state: { from: '/subscription?view=form' } });
                } else {
                  setSearchParams({ view: 'form' });
                }
              }} 
              className="px-8 py-4 text-lg shadow-2xl shadow-brand-500/30 border border-white/10"
            >
              Subscribe Now
            </Button>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-24">
        <div className="container-custom">
          <div className="text-center mb-20 reveal">
            <h2 className="text-3xl font-bold text-future-carbon mb-4">Exclusive Pro Features</h2>
            <p className="text-future-steel max-w-2xl mx-auto">
              Everything you need to mitigate risk and scale your business securely.
            </p>
          </div>

          <div className="grid mt-14 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 reveal">
            {/* Feature 1 */}
            <div className="bg-white rounded-[24px] lg:rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Credit Risk Reports</h3>
              <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                Access detailed financial health reports, payment history trends, and credit scores before you sign any deal.
              </p>
              <ul className="space-y-3 mt-auto">
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-indigo-500" /> Payment timeline analysis
                </li>
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-indigo-500" /> Default probability score
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-[24px] lg:rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Advanced Search Filters</h3>
              <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                Find exactly who you need. Filter by monthly capacity, machinery type, export certifications, and more.
              </p>
              <ul className="space-y-3 mt-auto">
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-blue-500" /> Filter by machine count
                </li>
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-blue-500" /> Export-ready status
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-[24px] lg:rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Private Trade Network</h3>
              <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                Join exclusive, invite-only trade groups for high-value transactions hidden from the public marketplace.
              </p>
              <ul className="space-y-3 mt-auto">
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-purple-500" /> Verified-only access
                </li>
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-purple-500" /> Direct CEO connections
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-[24px] lg:rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Market Trends & Analytics</h3>
              <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                 Stay ahead with real-time price tracking for Yarn, Fabric, and raw materials across major Indian mandis.
              </p>
              <ul className="space-y-3 mt-auto">
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-emerald-500" /> Daily price alerts
                </li>
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-emerald-500" /> Demand forecasting
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-[24px] lg:rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-600 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Legal Verification APIs</h3>
              <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                Automate your onboarding. Integrate our GST and PAN verification API directly into your ERP or CRM.
              </p>
              <ul className="space-y-3 mt-auto">
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-rose-500" /> Instant GST check
                </li>
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-rose-500" /> Bulk verification
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-[24px] lg:rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 text-sky-600 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Global Export Badges</h3>
              <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                Showcase your compliance certificates (Oeko-Tex, GOTS) with verified digital badges on your profile.
              </p>
              <ul className="space-y-3 mt-auto">
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-sky-500" /> Trust badge for website
                </li>
                <li className="flex items-center text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 mr-2.5 text-sky-500" /> Verified compliance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table / CTA / CTA - High Contrast Midnight Version */}
      <section className="py-24 bg-future-midnight relative overflow-hidden" data-nav-theme="dark">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-900/20 to-transparent pointer-events-none"></div>

        <div className="container-custom max-w-5xl relative z-10 reveal">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 lg:p-20 text-center relative overflow-hidden">
             
             <div className="relative z-10">
               <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your business?</h2>
               <p className="text-brand-100 text-lg mb-10 max-w-2xl mx-auto font-light">
                 Join over 5,000 premium members who trust TextileTrust for their daily business intelligence.
               </p>
               <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <Button 
                   onClick={() => {
                      if (!user) {
                        navigate('/login', { state: { from: '/subscription' } });
                      } else {
                        setSearchParams({ view: 'form' });
                      }
                   }} 
                   variant="primary" 
                   className="scale-110 px-10 py-4 font-bold shadow-2xl shadow-brand-500/40 hover:shadow-brand-500/50 border border-white/20"
                 >
                   Get Premium Access
                 </Button>
               </div>
               <p className="mt-8 text-sm text-white/40 uppercase tracking-widest">No credit card required for 7-day trial.</p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Subscription;
