import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSearch } from '../../context/SearchContext';

const API_BASE = 'http://localhost:5002';

const SearchBar = ({ variant = 'default', placeholder = 'Search companies, GST, or PAN...' }) => {
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm } = useSearch();
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // For navbar variant, we might want local state if we don't want to sync perfectly with hero
  // But per requirements, "never show both". 
  
  const isNavbar = variant === 'navbar';

  // Debounce Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
        if (!searchTerm) {
            setSuggestions([]);
            return;
        }

      if (searchTerm.length >= 2) {
        try {
          const { data } = await api.get(`/companies/suggestions?query=${searchTerm}`);
          
          // Enrich with real-time review stats (Parallel Fetch)
          // Limit to top 5 to prevent excessive API calls
          const enrichedData = await Promise.all(data.slice(0, 6).map(async (company) => {
             try {
                // Only fetch if it looks like a valid ID (not a mock number ID)
                if (company._id && typeof company._id === 'string' && company._id.length > 10) { 
                   const reviewsRes = await api.get(`/reviews/${company._id}`);
                   const reviews = reviewsRes.data || [];
                   const count = reviews.length;
                   const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
                   const avg = count > 0 ? totalRating / count : 0;
                   
                   return { 
                     ...company, 
                     avgRating: avg, 
                     totalReviews: count 
                   };
                }
                return company;
             } catch (e) {
                console.warn(`Failed to fetch stats for ${company.name}`, e);
                return company; // Fallback to existing data
             }
          }));

          setSuggestions(enrichedData);
          if (!isNavbar) setShowDropdown(true); 
        } catch (error) {
          console.error("Autocomplete Error:", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isNavbar]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
       handleSelectCompany(suggestions[activeIndex]._id);
       return;
    }
    // Navigate with query param so Search page can read it
    const query = searchTerm.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
    setShowDropdown(false);
  };

  const handleSelectCompany = (companyId) => {
    navigate(`/company/${companyId}`);
    setShowDropdown(false);
    setSearchTerm(''); // Clear on select
  };

  if (variant === 'navbar') {
      return (
        <form onSubmit={handleSearch} className="relative w-full animate-in fade-in zoom-in duration-300">
           <div className="relative">
            <div className="flex items-center bg-white/10 backdrop-blur-xl rounded-full shadow-2xl shadow-brand-500/20 p-1 sm:p-1.5 border border-white/10 hover:shadow-brand-500/30 hover:bg-white/15 transition-all duration-300 relative z-20">
                <div className="pl-3 sm:pl-5 pr-2 sm:pr-3 text-brand-200">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <input
                    type="text"
                    className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder-brand-200/50 text-sm sm:text-base lg:text-lg py-1.5 sm:py-2 focus:outline-none min-w-0"
                    placeholder="Search by Name or GSTN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                <button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-full font-medium transition-all duration-300 shadow-lg shadow-brand-600/30 text-xs sm:text-sm whitespace-nowrap">
                    Search
                </button>
            </div>
            
             {/* Dropdown Logic (Copied for navbar) */}
             {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 text-left">
                     <div className="py-2">
                         <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Companies</div>
                         {suggestions.map((company, index) => {
                            // Ensure we use the aggregate/average data
                            const rating = company.avgRating ?? company.rating ?? 0;
                            const reviewCount = company.totalReviews ?? company.reviews ?? 0;
                            
                            let ratingColor = "bg-red-900"; // Default/0 stars (Dark Red)
                            if (rating >= 5.0) ratingColor = "bg-green-800"; // 5 Stars (Dark Green)
                            else if (rating >= 4.0) ratingColor = "bg-lime-500"; // 4 Stars (Light Green)
                            else if (rating >= 3.0) ratingColor = "bg-yellow-400"; // 3 Stars (Yellow)
                            else if (rating >= 2.0) ratingColor = "bg-orange-500"; // 2 Stars (Orange)
                            else if (rating >= 1.0) ratingColor = "bg-red-600"; // 1 Star (Red)

                            return (
                            <button
                               key={company._id}
                               type="button"
                               onMouseDown={() => handleSelectCompany(company._id)}
                               className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 group transition-colors`}
                            >
                               <div className="flex items-center gap-3 overflow-hidden">
                                   <div className="w-12 h-12 min-w-[48px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm uppercase overflow-hidden">
                                      {company.submittedBy?.profilePhoto ? (
                                        <img src={`${API_BASE}${company.submittedBy.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        company.name.substring(0, 2)
                                      )}
                                   </div>
                                   
                                   <div className="flex flex-col overflow-hidden">
                                      <span className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                                        {company.name}
                                      </span>
                                      <span className="text-xs text-gray-400 font-normal truncate flex items-center gap-1.5">
                                        <span className="font-mono bg-gray-100 px-1 rounded text-[10px]">GST: {company.gst}</span>
                                        <span>•</span>
                                        <span>{reviewCount} reviews</span>
                                      </span>
                                   </div>
                               </div>

                               <div className={`ml-3 px-2 py-1 rounded-md text-white font-bold text-xs flex items-center gap-1 min-w-[50px] justify-center ${ratingColor}`}>
                                  <Star className="w-3 h-3 fill-current" />
                                  {rating.toFixed(1)}
                               </div>
                            </button>
                         )})} 
                      </div>
                </div>
             )}
           </div>
        </form>
      );
  }

  // Hero Variant (or Default)
  return (
    <form onSubmit={handleSearch} className="relative w-full">
       <div className="relative">
        <div className="flex items-center bg-white/10 backdrop-blur-xl rounded-full shadow-2xl shadow-brand-500/20 p-1 sm:p-1.5 border border-white/10 hover:shadow-brand-500/30 hover:bg-white/15 transition-all duration-300 relative z-20">
            <div className="pl-3 sm:pl-4 lg:pl-5 pr-2 sm:pr-3 text-brand-200">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <input
                type="text"
                className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder-brand-200/50 text-sm sm:text-base lg:text-lg py-1.5 sm:py-2 focus:outline-none min-w-0"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            <button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-full font-medium transition-all duration-300 shadow-lg shadow-brand-600/30 text-sm sm:text-base whitespace-nowrap">
                Search
            </button>
        </div>
        
         {/* Dropdown Logic (Simplified for this file) */}
         {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 text-left">
                 <div className="py-2">
                     <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Companies</div>
                     {suggestions.map((company, index) => {
                        // Ensure we use the aggregate/average data
                        const rating = company.avgRating ?? company.rating ?? 0;
                        const reviewCount = company.totalReviews ?? company.reviews ?? 0;
                        
                        let ratingColor = "bg-red-900"; // Default/0 stars (Dark Red)
                        if (rating >= 5.0) ratingColor = "bg-green-800"; // 5 Stars (Dark Green)
                        else if (rating >= 4.0) ratingColor = "bg-lime-500"; // 4 Stars (Light Green)
                        else if (rating >= 3.0) ratingColor = "bg-yellow-400"; // 3 Stars (Yellow)
                        else if (rating >= 2.0) ratingColor = "bg-orange-500"; // 2 Stars (Orange)
                        else if (rating >= 1.0) ratingColor = "bg-red-600"; // 1 Star (Red)

                        return (
                        <button
                           key={company._id}
                           type="button"
                           onMouseDown={() => handleSelectCompany(company._id)}
                           className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 group transition-colors`}
                        >
                           <div className="flex items-center gap-3 overflow-hidden">
               {/* Logo / Profile Photo */}
               <div className="w-12 h-12 min-w-[48px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm uppercase overflow-hidden">
                  {company.submittedBy?.profilePhoto ? (
                    <img src={`${API_BASE}${company.submittedBy.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    company.name.substring(0, 2)
                  )}
               </div>
                               
                               <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                                    {company.name}
                                  </span>
                                  <span className="text-xs text-gray-400 font-normal truncate flex items-center gap-1.5">
                                    <span className="font-mono bg-gray-100 px-1 rounded text-[10px]">GST: {company.gst}</span>
                                    <span>•</span>
                                    <span>{reviewCount} reviews</span>
                                  </span>
                               </div>
                           </div>

                           {/* Rating Box */}
                           <div className={`ml-3 px-2 py-1 rounded-md text-white font-bold text-xs flex items-center gap-1 min-w-[50px] justify-center ${ratingColor}`}>
                              <Star className="w-3 h-3 fill-current" />
                              {rating.toFixed(1)}
                           </div>
                        </button>
                     )})} 
                  </div>
            </div>
         )}
       </div>
    </form>
  );
};

export default SearchBar;
