import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  MapPin,
  Star,
  ShieldCheck,
  ArrowRight,
  Loader,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Send,
  AlertCircle,
  ChevronRight,
  User,
  EyeOff,
  Lock,
} from "lucide-react";
import Button from "../components/ui/Button";
import useScrollReveal from "../hooks/useScrollReveal";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { useSearch } from "../context/SearchContext";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5003';

// GST number regex: 15 alphanumeric characters
const GST_REGEX = /^[0-9A-Z]{15}$/i;

const isGstNumber = (input) => {
  return input && input.trim().length === 15 && GST_REGEX.test(input.trim());
};

const Search = () => {
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(queryFromUrl);
  const [category, setCategory] = useState("All");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const { user } = useAuth();
  const { setShowNavbarSearch, setSearchTerm: setGlobalSearchTerm } = useSearch();
  const searchContainerRef = React.useRef(null);
  useScrollReveal(loading);

  // GST-specific state
  const [gstMode, setGstMode] = useState(false);
  const [gstData, setGstData] = useState(null); // GOV.IN API data
  const [gstCompany, setGstCompany] = useState(null); // Existing company from DB
  const [gstLoading, setGstLoading] = useState(false);
  const [captchaImage, setCaptchaImage] = useState(null);
  const [captchaInput, setCaptchaInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [gstError, setGstError] = useState("");
  const [gstReviews, setGstReviews] = useState([]);
  const [gstReviewsLoading, setGstReviewsLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewDealAgain, setReviewDealAgain] = useState(null);
  const [reviewIsAnonymous, setReviewIsAnonymous] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const BUSINESS_TYPES = [
    "All", "Manufacturer", "Trader", "Wholesaler", "Retailer",
    "Yarn Supplier", "Fabric Manufacturer", "Dyeing Unit", "Printing Unit", "Exporter",
  ];

  // Fetch captcha for GST verification
  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setGstError("");
    try {
      const { data } = await api.get("/gst/captcha");
      setCaptchaImage(data.image);
      setSessionId(data.sessionId);
      setCaptchaInput("");
    } catch (error) {
      setGstError("Failed to load captcha. Please try again.");
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  // Verify GST via GOV.IN
  const verifyGst = async (gstin) => {
    if (!sessionId || !captchaInput) {
      setGstError("Please solve the captcha first.");
      return;
    }
    setGstLoading(true);
    setGstError("");
    try {
      const { data } = await api.post("/gst/verify", {
        sessionId,
        GSTIN: gstin.toUpperCase().trim(),
        captcha: captchaInput,
      });
      setGstData(data);
      setCaptchaImage(null); // Hide captcha after success
      // Fetch reviews if a company exists in DB for this GST
      fetchGstReviews(gstin);
    } catch (error) {
      const msg = error.response?.data?.error || error.message || "Verification failed";
      setGstError(msg);
      // Refresh captcha on failure
      fetchCaptcha();
    } finally {
      setGstLoading(false);
    }
  };

  // Check if company exists in DB by GST
  const checkGstInDb = async (gstin) => {
    try {
      const { data } = await api.get(`/companies/by-gst/${gstin.toUpperCase().trim()}`);
      setGstCompany(data);
      return data;
    } catch {
      setGstCompany(null);
      return null;
    }
  };

  // Fetch reviews for a GST company
  const fetchGstReviews = async (gstin) => {
    const company = await checkGstInDb(gstin);
    if (company && company._id) {
      setGstReviewsLoading(true);
      try {
        const { data } = await api.get(`/reviews/${company._id}`);
        setGstReviews(data);
      } catch {
        setGstReviews([]);
      } finally {
        setGstReviewsLoading(false);
      }
    } else {
      setGstReviews([]);
    }
  };

  // Normal company search
  const fetchCompanies = async (query = "", cat = category) => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/companies/search?query=${query}&category=${cat}`,
      );
      setCompanies(data);
    } catch (error) {
      console.error("Search failed:", error);
      if (error.response?.status === 403) {
        toast.error("Subscription required to search companies.");
      } else {
        toast.error("Failed to fetch companies. Please try again.");
      }
      setCompanies([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  // Main search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    const term = searchTerm.trim();

    // Reset GST state
    setGstData(null);
    setGstCompany(null);
    setGstReviews([]);
    setGstError("");
    setShowReviewForm(false);
    setReviewSubmitted(false);

    if (isGstNumber(term)) {
      setLoading(true);
      
      // First check if this GST exists in our database
      const existing = await checkGstInDb(term);
      
      setGstMode(true);
      setCompanies([]);
      setHasSearched(false);

      if (existing) {
        // Fetch reviews too
        setGstReviewsLoading(true);
        try {
          const { data } = await api.get(`/reviews/${existing._id}`);
          setGstReviews(data);
        } catch {
          setGstReviews([]);
        } finally {
          setGstReviewsLoading(false);
        }
      } else {
        // Only fetch captcha for GOV.IN lookup if company is not already in DB
        fetchCaptcha();
      }
      setLoading(false);
    } else {
      setGstMode(false);
      fetchCompanies(term, category);
    }
  };

  // Initial load
  useEffect(() => {
    setSearchTerm(queryFromUrl);
    setGlobalSearchTerm('');
    if (queryFromUrl && isGstNumber(queryFromUrl)) {
      setLoading(true);
      checkGstInDb(queryFromUrl).then((existing) => {
        setGstMode(true);
        if (!existing) {
          fetchCaptcha();
        } else {
          // If it exists, fetch reviews
          setGstReviewsLoading(true);
          api.get(`/reviews/${existing._id}`)
            .then(({ data }) => setGstReviews(data))
            .catch(() => setGstReviews([]))
            .finally(() => setGstReviewsLoading(false));
        }
        setLoading(false);
      });
    } else {
      setGstMode(false);
      fetchCompanies(queryFromUrl, "All");
    }
  }, [user, queryFromUrl, setGlobalSearchTerm]);

  // Scroll Listener for Navbar Search
  useEffect(() => {
    const handleScroll = () => {
      if (!searchContainerRef.current) return;
      const rect = searchContainerRef.current.getBoundingClientRect();
      if (rect.bottom <= 80) {
        setShowNavbarSearch(true);
      } else {
        setShowNavbarSearch(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      setShowNavbarSearch(false);
    };
  }, [setShowNavbarSearch]);

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    if (!gstMode) {
      fetchCompanies(searchTerm, newCategory);
    }
  };

  // Submit review for GST company
  const handleGstReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewRating || reviewDealAgain === null) {
      toast.error("Please provide a rating and deal-again preference.");
      return;
    }
    setReviewSubmitting(true);
    try {
      await api.post("/reviews/gst", {
        gst: searchTerm.toUpperCase().trim(),
        rating: reviewRating,
        comment: reviewComment,
        wouldDealAgain: reviewDealAgain,
        isAnonymous: reviewIsAnonymous,
        gstDetails: gstData || undefined,
      });
      setReviewSubmitted(true);
      toast.success("Review submitted successfully!");
      // Refresh reviews
      fetchGstReviews(searchTerm);
      setTimeout(() => {
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewComment("");
        setReviewDealAgain(null);
        setReviewIsAnonymous(false);
        setReviewSubmitted(false);
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const calculateRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays <= 7) return `${diffInDays}d ago`;
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Helper for star rating colors
  const getRatingColor = (rating) => {
    if (rating >= 5) return '#10b981'; // emerald-500
    if (rating >= 4) return '#84cc16'; // lime-500
    if (rating >= 3) return '#facc15'; // yellow-400
    if (rating >= 2) return '#f97316'; // orange-500
    if (rating >= 1) return '#ef4444'; // red-500
    return '#f3f4f6'; // gray-100
  };

  // ─── RENDER ─────────────────────────────────

  return (
    <div className="min-h-screen pb-20 bg-white">
      {/* Header */}
      <div className="bg-gray-50 rounded-b-2xl sm:rounded-b-3xl pt-24 sm:pt-28 pb-8 sm:pb-12 px-4 shadow-md border-b border-gray-100">
        <div className="container-custom max-w-4xl mx-auto text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 mb-4 sm:mb-6 md:mb-8 tracking-tight drop-shadow-sm">
            Search Verified Companies
          </h1>

          <div className="relative max-w-3xl mx-auto flex flex-col gap-3 sm:gap-4">
            {/* Category Filter */}
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <select
                value={category}
                onChange={handleCategoryChange}
                className="w-full h-12 sm:h-[54px] pl-4 pr-10 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500/20 text-slate-700 appearance-none cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all font-medium text-sm sm:text-base"
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="flex-grow flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl sm:rounded-full shadow-soft p-2 sm:p-1.5 border border-white/50 focus-within:ring-4 focus-within:ring-brand-500/5 focus-within:border-brand-500/20 transition-all duration-500 gap-2 sm:gap-0 hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] search-expand"
            >
              <div className="flex items-center flex-grow">
                <div className="pl-3 sm:pl-5 pr-2 sm:pr-3 text-slate-400">
                  <SearchIcon className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  className="flex-grow bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 text-base sm:text-lg py-2 focus:outline-none min-w-0"
                  placeholder="Search by Name, GST, or PAN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 sm:px-8 py-3 rounded-xl sm:rounded-full font-medium transition-all duration-300 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 flex items-center justify-center min-h-[48px] touch-target transform active:scale-95"
                disabled={loading || gstLoading}
              >
                {loading || gstLoading ? (
                  <Loader className="animate-spin h-5 w-5" />
                ) : (
                  "Search"
                )}
              </button>
            </form>

            {/* GST hint */}
            {searchTerm.trim().length > 0 && isGstNumber(searchTerm) && (
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 font-medium animate-fadeIn">
                <ShieldCheck className="w-3.5 h-3.5" />
                GST number detected — will look up taxpayer details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll ref */}
      <div ref={searchContainerRef} className="absolute top-0 h-[300px] w-full pointer-events-none -z-10" />

      {/* ─── GST MODE ─── */}
      {gstMode && (
        <div className="container-custom max-w-4xl mt-6 sm:mt-8 md:mt-12 space-y-6">

          {/* Existing Company in DB */}
          {gstCompany && (
            <div className="fade-in-up">
              <div className="flex items-center gap-2 mb-3 px-1">
                {gstCompany.submittedBy ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Registered on TexoTrust</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-bold text-red-700 uppercase tracking-wider">Not Registered on TexoTrust</span>
                  </>
                )}
              </div>
              <Link
                to={`/company/${gstCompany._id}`}
                className="block group"
              >
                <div className={`p-5 sm:p-6 flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between rounded-2xl sm:rounded-[28px] shadow-lg border hover:shadow-xl transition-all duration-300 ${gstCompany.submittedBy ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:border-emerald-200' : 'bg-gradient-to-br from-red-50 to-white border-red-100 hover:border-red-200'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm uppercase overflow-hidden border ${gstCompany.submittedBy ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
                        {gstCompany.submittedBy?.profilePhoto ? (
                          <img src={`${API_BASE}${gstCompany.submittedBy.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          gstCompany.name?.substring(0, 2)
                        )}
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold text-slate-800 transition-colors ${gstCompany.submittedBy ? 'group-hover:text-emerald-700' : 'group-hover:text-red-700'}`}>{gstCompany.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {gstCompany.city && (
                            <><MapPin className="w-3 h-3" /><span>{gstCompany.city}</span></>
                          )}
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">GST: {gstCompany.gst}</span>
                        </div>
                      </div>
                      {gstCompany.submittedBy && <ShieldCheck className="w-5 h-5 text-emerald-500 ml-auto" />}
                    </div>
                    {user?.isSubscribed && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200 text-sm font-bold text-slate-700 shadow-sm">
                          <Star className="w-3.5 h-3.5 fill-current text-yellow-500" />
                          {(gstCompany.avgRating || 0) > 0 ? gstCompany.avgRating?.toFixed(1) : "New"}
                        </div>
                        <span className="text-sm text-slate-500">{gstCompany.totalReviews || 0} reviews</span>
                      </div>
                    )}
                  </div>
                  <div className={`text-sm px-4 py-2.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all ${gstCompany.submittedBy ? 'text-emerald-700 group-hover:text-white group-hover:bg-emerald-600 border-emerald-200 group-hover:border-emerald-600' : 'text-red-700 group-hover:text-white group-hover:bg-red-600 border-red-200 group-hover:border-red-600'}`}>
                    View Full Profile <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Captcha Section (only if no GST data yet and company not in DB) */}
          {!gstData && !gstCompany && !loading && (
            <div className="fade-in-up bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              {/* "Not Registered" Warning Header */}
              <div className="bg-yellow-50 border-b border-yellow-200 p-5 sm:p-6 text-center relative overflow-hidden">
                <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mb-1.5 capitalize tracking-tight">This company is not registered</h3>
                <p className="text-sm text-yellow-700/90 font-medium">This GST number does not currently exist within the TexoTrust system.</p>
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-brand-600" />
                  <h3 className="font-bold text-gray-900 text-lg">Verify to Write a Review</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
                  You can still review this company! Simply solve the captcha below to securely fetch their official taxpayer details directly from the Government GST Portal.
                </p>

              {captchaLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin h-8 w-8 text-brand-500" />
                </div>
              ) : captchaImage ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 inline-block">
                      <img src={captchaImage} alt="Captcha" className="h-12 sm:h-14" />
                    </div>
                    <button
                      onClick={fetchCaptcha}
                      className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Enter captcha text..."
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), verifyGst(searchTerm))}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
                    />
                    <button
                      onClick={() => verifyGst(searchTerm)}
                      disabled={!captchaInput || gstLoading}
                      className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[140px]"
                    >
                      {gstLoading ? <Loader className="animate-spin h-4 w-4" /> : <><ShieldCheck className="w-4 h-4" /> Verify</>}
                    </button>
                  </div>
                </div>
              ) : null}

              {gstError && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{gstError}</span>
                </div>
              )}
              </div>
            </div>
          )}

          {/* GST Details Card (from GOV.IN) */}
          {gstData && (
            <div className="fade-in-up bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                      {gstData.tradeNam || gstData.lgnm || 'Unknown'}
                    </h3>
                    {gstData.tradeNam && gstData.lgnm && gstData.tradeNam !== gstData.lgnm && (
                      <p className="text-sm text-white/60 mt-0.5 truncate">Legal: {gstData.lgnm}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="font-mono text-xs text-white/80 bg-white/10 px-2 py-0.5 rounded">{gstData.gstin}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        gstData.sts === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {gstData.sts || 'Unknown Status'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gstData.pradr?.addr && (
                  <DetailItem
                    label="Principal Address"
                    value={formatAddress(gstData.pradr.addr)}
                    icon={<MapPin className="w-4 h-4" />}
                    span
                  />
                )}
                {gstData.ctb && <DetailItem label="Constitution" value={gstData.ctb} />}
                {gstData.dty && <DetailItem label="Dealer Type" value={gstData.dty} />}
                {gstData.rgdt && <DetailItem label="Registration Date" value={gstData.rgdt} />}
                {gstData.lstupdt && <DetailItem label="Last Updated" value={gstData.lstupdt} />}
                {gstData.nba && gstData.nba.length > 0 && (
                  <DetailItem label="Nature of Business" value={gstData.nba.join(', ')} span />
                )}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {(gstCompany || gstData) && (
            <div className="fade-in-up bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Reviews {gstReviews.length > 0 && <span className="text-sm font-normal text-gray-400">({gstReviews.length})</span>}
                </h3>
                {user && (user.isSubscribed || (user.reviewCount || 0) < 5) && !showReviewForm && !reviewSubmitted && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl border border-brand-100 transition-all flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5" /> Write Review
                    {!user.isSubscribed && (
                      <span className="text-xs text-gray-400 ml-1">({Math.max(0, 5 - (user.reviewCount || 0))} left)</span>
                    )}
                  </button>
                )}
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* Review Form */}
                {showReviewForm && user && (user.isSubscribed || (user.reviewCount || 0) < 5) && (
                  <form onSubmit={handleGstReviewSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 fade-in-up shadow-sm">
                    {/* Star Rating */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Rate your experience</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const activeRating = reviewHover || reviewRating;
                          const isActive = star <= activeRating;
                          const bgColor = isActive ? getRatingColor(activeRating) : '#f3f4f6';
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setReviewHover(star)}
                              onMouseLeave={() => setReviewHover(0)}
                              className="w-12 h-12 transition-transform hover:scale-105 focus:outline-none flex items-center justify-center shadow-sm rounded-lg"
                              style={{ backgroundColor: bgColor }}
                            >
                              <Star className={`w-7 h-7 ${isActive ? 'text-white' : 'text-gray-300'} fill-current`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Would Deal Again */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Would you deal with them again?</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setReviewDealAgain(true)}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center transition-all ${reviewDealAgain === true ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-gray-100 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 text-gray-600'}`}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" /> Yes, definitely
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewDealAgain(false)}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center transition-all ${reviewDealAgain === false ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-gray-100 hover:border-red-500 hover:text-red-700 hover:bg-red-50 text-gray-600'}`}
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" /> No, avoid
                        </button>
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Share your experience (Optional)</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="e.g. Payment terms were clear, delivery was on time..."
                        maxLength={500}
                        className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none min-h-[100px] resize-none input-glow"
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">{reviewComment.length}/500</p>
                    </div>

                    {/* Anonymous Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${reviewIsAnonymous ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-500'}`}>
                          {reviewIsAnonymous ? <EyeOff className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Submit Anonymously</p>
                          <p className="text-xs text-gray-500">Your identity will be hidden from the public.</p>
                        </div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => setReviewIsAnonymous(!reviewIsAnonymous)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${reviewIsAnonymous ? 'bg-brand-600' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${reviewIsAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={!reviewRating || reviewDealAgain === null || reviewSubmitting}
                        className="flex-1 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {reviewSubmitting ? <Loader className="animate-spin h-4 w-4" /> : <><Send className="w-4 h-4" /> Submit Review</>}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Not logged in / not subscribed prompt */}
                {!user && (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-gray-500 text-sm mb-3">Log in to write a review</p>
                    <Button to="/login" variant="primary" className="text-sm py-2.5 px-6 min-h-[40px]">
                      Log In
                    </Button>
                  </div>
                )}
                {user && !user.isSubscribed && (user.reviewCount || 0) >= 5 && (
                  <div className="text-center py-6 bg-red-50/50 rounded-xl border border-red-100">
                    <p className="text-red-800 text-sm font-medium mb-1">You've used all 5 free reviews</p>
                    <p className="text-gray-500 text-xs mb-3">Subscribe to continue writing reviews and unlock ratings</p>
                    <Button to="/subscription" variant="primary" className="text-sm py-2.5 px-6 min-h-[40px]">
                      Subscribe Now
                    </Button>
                  </div>
                )}

                {/* Review success */}
                {reviewSubmitted && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-medium text-sm fade-in-up">
                    <CheckCircle className="w-5 h-5" />
                    Your review has been submitted successfully!
                  </div>
                )}

                {/* Reviews List */}
                {gstReviewsLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader className="animate-spin h-6 w-6 text-gray-400" />
                  </div>
                ) : gstReviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className={`${showAllReviews ? 'max-h-[600px] overflow-y-auto pr-1 scrollbar-thin' : ''} space-y-4`}>
                      {(showAllReviews ? gstReviews : gstReviews.slice(0, 3)).map((review) => (
                        <div key={review._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
                                {review.userId?.profilePhoto ? (
                                  <img src={`${API_BASE}${review.userId.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  (review.userId?.companyName || review.userId?.name || 'A').substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-gray-800">{review.userId?.companyName || review.userId?.name || 'Anonymous'}</span>
                                {review.userId?.isSubscribed && (
                                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                    <ShieldCheck className="w-2.5 h-2.5 mr-0.5" /> Verified
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">{calculateRelativeTime(review.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => {
                                const activeColor = review.rating >= 5 ? 'bg-emerald-500' :
                                                    review.rating >= 4 ? 'bg-lime-500' :
                                                    review.rating >= 3 ? 'bg-yellow-400' :
                                                    review.rating >= 2 ? 'bg-orange-500' : 'bg-red-500';
                                return (
                                  <div key={s} className={`w-4 h-4 rounded-sm flex items-center justify-center ${s <= review.rating ? activeColor : 'bg-gray-200'}`}>
                                    <Star className={`w-2.5 h-2.5 ${s <= review.rating ? 'text-white fill-current' : 'text-gray-400'}`} />
                                  </div>
                                );
                              })}
                            </div>
                            {review.wouldDealAgain !== undefined && (
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${review.wouldDealAgain ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {review.wouldDealAgain ? 'Would deal again' : 'Would not deal again'}
                              </span>
                            )}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600 leading-relaxed">"{review.comment}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {gstReviews.length > 3 && (
                      <div className="text-center pt-2">
                        <button 
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-full transition-colors"
                        >
                          {showAllReviews ? (
                            <div className="flex items-center">Show Less <ChevronRight className="w-4 h-4 ml-1 rotate-[-90deg]" /></div>
                          ) : (
                            <div className="flex items-center">View All {gstReviews.length - 3} More Reviews <ChevronRight className="w-4 h-4 ml-1 rotate-90" /></div>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── NORMAL COMPANY RESULTS ─── */}
      {!gstMode && (
        <div className="container-custom max-w-4xl mt-6 sm:mt-8 md:mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 px-1 sm:px-2 gap-3">
            {hasSearched && (
              <h2 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest pl-2 border-l-2 border-brand-500/30">
                {companies.length} Result{companies.length !== 1 ? "s" : ""} Found
              </h2>
            )}
            {hasSearched && companies.length > 1 && (
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSortBy(val);
                    const sorted = [...companies].sort((a, b) => {
                      if (val === 'highest') return (b.avgRating || 0) - (a.avgRating || 0);
                      if (val === 'most_reviews') return (b.totalReviews || 0) - (a.totalReviews || 0);
                      if (val === 'az') return (a.name || '').localeCompare(b.name || '');
                      return new Date(b.createdAt) - new Date(a.createdAt); // newest
                    });
                    setCompanies(sorted);
                  }}
                  className="h-9 pl-3 pr-8 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500/20 text-slate-600 appearance-none cursor-pointer text-xs font-medium"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="most_reviews">Most Reviews</option>
                  <option value="az">A → Z</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <>
              {loading &&
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-4 sm:p-6 bg-gray-50 rounded-3xl sm:rounded-[32px] border border-gray-100 shadow-md skeleton-pulse">
                    <div className="flex items-center mb-3">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded-full ml-2"></div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              {!loading &&
                companies.map((company, index) => {
                  const rating = company.avgRating ?? company.rating ?? 0;
                  let ratingColor = "bg-gray-50 text-gray-600 border border-gray-200";
                  if (rating >= 4.5) ratingColor = "bg-emerald-100 text-emerald-800 border border-emerald-200";
                  else if (rating >= 3.6) ratingColor = "bg-lime-100 text-lime-800 border border-lime-200";
                  else if (rating >= 2.6) ratingColor = "bg-yellow-100 text-yellow-800 border border-yellow-200";
                  else if (rating >= 1.1) ratingColor = "bg-orange-100 text-orange-800 border border-orange-200";
                  else if (rating > 0) ratingColor = "bg-red-100 text-red-800 border border-red-200";

                  return (
                    <Link
                      to={`/company/${company._id}`}
                      key={company._id}
                      className={`block group slide-in-left slide-in-delay-${Math.min(index + 1, 5)}`}
                    >
                      <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between card-hover-lift active:scale-[0.995] bg-gray-50 rounded-3xl sm:rounded-[32px] shadow-md border border-gray-100 hover:border-brand-200/50 hover:bg-gray-50/90">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <div className="w-14 h-14 min-w-[56px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-base uppercase overflow-hidden border border-gray-200 shrink-0">
                              {company.submittedBy?.profilePhoto ? (
                                <img src={`${API_BASE}${company.submittedBy.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                company.name?.substring(0, 2)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 group-hover:text-brand-600 transition-colors tracking-tight break-words line-clamp-2">
                                {company.name}
                              </h3>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4 gap-1 sm:gap-0">
                            {company.city && (
                              <>
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-slate-400" />
                                <span className="truncate max-w-[100px] sm:max-w-none">{company.city}</span>
                                <span className="mx-2 sm:mx-3 text-slate-300">|</span>
                              </>
                            )}
                            <span className="font-mono bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded text-slate-600 text-[10px] sm:text-xs tracking-wide border border-slate-100 truncate">
                              GST: {company.gst}
                            </span>
                          </div>
                          {user?.isSubscribed && (
                            <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                              <div className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm ${ratingColor}`}>
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current mr-1 sm:mr-1.5" />
                                {rating > 0 ? rating.toFixed(1) : "New"}
                              </div>
                              <div className="text-xs sm:text-sm text-slate-500 font-medium">
                                {company.totalReviews || 0} Reviews
                              </div>
                              {company.submittedBy ? (
                                <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-50 to-emerald-100/50 flex items-center gap-1 border border-emerald-200 shrink-0">
                                  <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider whitespace-nowrap">Registered</span>
                                </div>
                              ) : (
                                <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-red-50 to-red-100/50 flex items-center gap-1 border border-red-200 shrink-0">
                                  <XCircle className="w-3 h-3 text-red-600 shrink-0" />
                                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider whitespace-nowrap">Not Registered</span>
                                </div>
                              )}
                            </div>
                          )}
                          {!user?.isSubscribed && (
                            <div className="flex items-center flex-wrap gap-2">
                              {(company.totalReviews || 0) > 0 && (
                                <>
                                  <div className="text-xs sm:text-sm text-slate-500 font-medium">
                                    {company.totalReviews} Reviews
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100/80 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    <Lock className="w-3 h-3 text-slate-400 stroke-[2.5]" />
                                    <span>Rating locked</span>
                                  </div>
                                </>
                              )}
                              {company.submittedBy ? (
                                <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-50 to-emerald-100/50 flex items-center gap-1 border border-emerald-200 shrink-0">
                                  <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider whitespace-nowrap">Registered</span>
                                </div>
                              ) : (
                                <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-red-50 to-red-100/50 flex items-center gap-1 border border-red-200 shrink-0">
                                  <XCircle className="w-3 h-3 text-red-600 shrink-0" />
                                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider whitespace-nowrap">Not Registered</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="w-full sm:w-auto mt-2 sm:mt-0">
                          <div className="w-full sm:w-auto text-sm text-brand-600 group-hover:text-white group-hover:bg-brand-600 px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg border border-brand-100 group-hover:border-brand-600 font-medium flex items-center justify-center gap-1.5 transition-all min-h-[44px] touch-target">
                            View Profile
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}

              {hasSearched && companies.length === 0 && !loading && (
                <div className="text-center py-12 sm:py-16 md:py-24 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-md px-4 fade-in-up">
                  <div className="bg-slate-50 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 ring-1 ring-slate-100 shadow-sm float-animation">
                    <SearchIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    No companies found
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-slate-500 mb-6 sm:mb-8 px-2">
                    Try searching for a different name, GST, or PAN.
                  </p>
                  {user && !user.registeredCompanyId && (
                    <div className="bg-brand-50/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl inline-block border border-brand-100/50 max-w-xs mx-auto">
                      <p className="text-brand-800 font-medium mb-3 sm:mb-4 text-sm">
                        Is your business listed?
                      </p>
                      <Button to="/subscription" variant="primary" className="w-full shadow-lg shadow-brand-500/10 text-sm py-2.5 min-h-[44px]">
                        Get Listed Now
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components
const DetailItem = ({ label, value, icon, span }) => (
  <div className={`${span ? 'sm:col-span-2' : ''}`}>
    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
      {icon}
      {label}
    </div>
    <p className="text-sm text-gray-800 font-medium leading-relaxed">{value}</p>
  </div>
);

const formatAddress = (addr) => {
  if (!addr) return 'N/A';
  const parts = [addr.bno, addr.flno, addr.bnm, addr.st, addr.loc, addr.dst, addr.stcd, addr.pncd].filter(Boolean);
  return parts.join(', ') || 'N/A';
};

export default Search;
