import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search as SearchIcon,
  MapPin,
  Star,
  ShieldCheck,
  ArrowRight,
  Loader,
} from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import useScrollReveal from "../hooks/useScrollReveal";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { useSearch } from "../context/SearchContext";

const API_BASE = "http://localhost:5003";

const Search = () => {
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(queryFromUrl);
  const [category, setCategory] = useState("All");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useAuth();
  const { setShowNavbarSearch, setSearchTerm: setGlobalSearchTerm } = useSearch();
  const searchContainerRef = React.useRef(null);
  useScrollReveal(loading);

  const BUSINESS_TYPES = [
    "All",
    "Manufacturer",
    "Trader",
    "Wholesaler",
    "Retailer",
    "Yarn Supplier",
    "Fabric Manufacturer",
    "Dyeing Unit",
    "Printing Unit",
    "Exporter",
  ];

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

  // Initial load - fetch companies based on URL query or default
  useEffect(() => {
    // Sync local state
    setSearchTerm(queryFromUrl);
    // Clear global state to ensure nav search is empty
    setGlobalSearchTerm('');
    // Use query from URL if present
    fetchCompanies(queryFromUrl, "All");
  }, [user, queryFromUrl, setGlobalSearchTerm]);

  // Scroll Listener for Navbar Search
  useEffect(() => {
    const handleScroll = () => {
      if (!searchContainerRef.current) return;

      const rect = searchContainerRef.current.getBoundingClientRect();
      // Trigger when the main search bar scrolls out of view (or hits top)
      // Adjust threshold as needed.
      if (rect.bottom <= 80) {
        // 80px approxt navbar height
        setShowNavbarSearch(true);
      } else {
        setShowNavbarSearch(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll);
      setShowNavbarSearch(false); // Reset on unmount
    };
  }, [setShowNavbarSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCompanies(searchTerm, category);
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    fetchCompanies(searchTerm, newCategory);
  };

  return (
    <div className="min-h-screen pb-20 bg-white">
      {/* Modern Header */}
      {/* Modern Header */}
      {/* Modern Header */}
      <div className="bg-gray-50 rounded-b-2xl sm:rounded-b-3xl pt-24 sm:pt-28 pb-8 sm:pb-12 px-4 shadow-md border-b border-gray-100">
        <div className="container-custom max-w-4xl mx-auto text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 mb-4 sm:mb-6 md:mb-8 tracking-tight drop-shadow-sm">
            Search Verified Companies
          </h1>

          <div className="relative max-w-3xl mx-auto flex flex-col gap-3 sm:gap-4">
            {/* Category Filter - Full width on mobile */}
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>

            {/* Search Form - Stacks on smallest screens */}
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
                disabled={loading}
              >
                {loading ? (
                  <Loader className="animate-spin h-5 w-5" />
                ) : (
                  "Search"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Ref for intersection observer */}
      <div
        ref={searchContainerRef}
        className="absolute top-0 h-[300px] w-full pointer-events-none -z-10"
      />

      {/* Results */}
      <div className="container-custom max-w-4xl mt-6 sm:mt-8 md:mt-12">
        <div className="flex justify-between items-center mb-4 sm:mb-6 px-1 sm:px-2">
          {hasSearched && (
            <h2 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest pl-2 border-l-2 border-brand-500/30">
              {companies.length} Result{companies.length !== 1 ? "s" : ""} Found
            </h2>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4">
          <>
            {loading &&
              /* Skeleton Loading Cards */
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 sm:p-6 bg-gray-50 rounded-3xl sm:rounded-[32px] border border-gray-100 shadow-md skeleton-pulse"
                >
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
                let ratingColor =
                  "bg-gray-50 text-gray-600 border border-gray-200"; // Default (New)
                if (rating >= 4.5)
                  ratingColor =
                    "bg-emerald-100 text-emerald-800 border border-emerald-200"; // Excellent
                else if (rating >= 3.6)
                  ratingColor =
                    "bg-lime-100 text-lime-800 border border-lime-200"; // Good
                else if (rating >= 2.6)
                  ratingColor =
                    "bg-yellow-100 text-yellow-800 border border-yellow-200"; // Average
                else if (rating >= 1.1)
                  ratingColor =
                    "bg-orange-100 text-orange-800 border border-orange-200"; // Poor
                else if (rating > 0)
                  ratingColor = "bg-red-100 text-red-800 border border-red-200"; // Bad

                return (
                  <Link
                    to={`/company/${company._id}`}
                    key={company._id}
                    className={`block group slide-in-left slide-in-delay-${Math.min(index + 1, 5)}`}
                  >
                    <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between card-hover-lift active:scale-[0.995] bg-gray-50 rounded-3xl sm:rounded-[32px] shadow-md border border-gray-100 hover:border-brand-200/50 hover:bg-gray-50/90">
                      <div className="flex-1 w-full">
                        <div className="flex items-center justify-start mb-2">
                          <div className="w-14 h-14 min-w-[56px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-base uppercase overflow-hidden mr-3 border border-gray-200">
                            {company.submittedBy?.profilePhoto ? (
                              <img
                                src={`${API_BASE}${company.submittedBy.profilePhoto}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              company.name?.substring(0, 2)
                            )}
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mr-2 group-hover:text-brand-600 transition-colors truncate tracking-tight">
                              {company.name}
                            </h3>
                          </div>
                          <ShieldCheck
                            className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500 flex-shrink-0 drop-shadow-sm ml-2"
                            aria-label="Verified Company"
                          />
                        </div>
                        <div className="flex flex-wrap items-center text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4 gap-1 sm:gap-0">
                          {company.city && (
                            <>
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-slate-400" />
                              <span className="truncate max-w-[100px] sm:max-w-none">
                                {company.city}
                              </span>
                              <span className="mx-2 sm:mx-3 text-slate-300">
                                |
                              </span>
                            </>
                          )}
                          <span className="font-mono bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded text-slate-600 text-[10px] sm:text-xs tracking-wide border border-slate-100 truncate">
                            GST: {company.gst}
                          </span>
                        </div>
                        {user?.isSubscribed && (
                          <div className="flex items-center space-x-3 sm:space-x-6">
                            <div
                              className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm ${ratingColor}`}
                            >
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current mr-1 sm:mr-1.5" />
                              {rating > 0 ? rating.toFixed(1) : "New"}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-500 font-medium">
                              {company.totalReviews || 0} Reviews
                            </div>
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

                {/* Show "Get Listed" prompt only if logged in but not registered a company yet.
                      Previously strictly checked subscription, but logic might vary. 
                      Keeping simplistic check: if user exists and no company, prompt them. */}
                {user && !user.registeredCompanyId && (
                  <div className="bg-brand-50/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl inline-block border border-brand-100/50 max-w-xs mx-auto">
                    <p className="text-brand-800 font-medium mb-3 sm:mb-4 text-sm">
                      Is your business listed?
                    </p>
                    <Button
                      to="/subscription"
                      variant="primary"
                      className="w-full shadow-lg shadow-brand-500/10 text-sm py-2.5 min-h-[44px]"
                    >
                      Get Listed Now
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        </div>
      </div>
    </div>
  );
};

export default Search;
