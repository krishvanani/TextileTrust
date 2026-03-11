import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Zap,
  Search,
  Crown,
  ShieldCheck,
  Home,
  Building2,
} from "lucide-react";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import SearchBar from "../ui/SearchBar";
import { useAuth } from "../../context/AuthContext";
import { useSearch } from "../../context/SearchContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile Search State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showNavbarSearch } = useSearch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const API_BASE = 'http://localhost:5003';

  // Initialize theme - Always Dark for consistent style
  const isDarkTheme = true; 
  const [scrolled, setScrolled] = useState(false); // Track scroll for moving effect
  
  // Adaptive Scroll Logic & Auto-Close
  useEffect(() => {
    const initialScrollY = window.scrollY; // Capture scroll position when effect runs (search opens)

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Check Scroll Position (Trigger "moving" effect)
      setScrolled(currentScrollY > 20);

      // 2. Auto-close Search and Profile Menu on Scroll (User Request)
      // Close if scrolled more than 10px from where we started
      if (isSearchOpen && Math.abs(currentScrollY - initialScrollY) > 10) {
        setIsSearchOpen(false);
      }
      if (isProfileMenuOpen && Math.abs(currentScrollY - initialScrollY) > 10) {
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, isSearchOpen, isProfileMenuOpen]);

  // Auto-close Profile Menu on Navigation is handled by onClick in the nav links

  // Click outside to close profile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (isProfileMenuOpen && !event.target.closest('#profile-menu-container')) {
            setIsProfileMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  const navLinks = [
    { name: "Subscription", path: "/subscription", hideIfSubscribed: true },
  ].filter((link) => !(link.hideIfSubscribed && user?.isSubscribed === true));

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setIsSearchOpen(false); // Close search if opening menu
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) setIsOpen(false); // Close menu if opening search
  };

  // Determine if we are on an auth page
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  // Dynamic Styles based on Theme & Scroll
  let navClasses = "transition-all duration-500 ease-in-out ";
  
  if (isAuthPage) {
     // Auth Page Styles: Absolute, transparent, spacious
     navClasses += "absolute top-0 w-full z-50 p-6 pointer-events-none border-b border-transparent";
  } else {
     // Main Page Styles
     navClasses += "fixed top-0 w-full z-50 ";
     if (!scrolled) {
       const isSubscriptionMarketing = location.pathname === '/subscription' && (!view || view === 'marketing');
       if (['/'].includes(location.pathname) || isSubscriptionMarketing) {
           navClasses += "bg-transparent border-b border-transparent py-6";
       } else {
           navClasses += "bg-future-midnight border-b border-white/5 py-6";
       }
     } else {
       navClasses += "py-3 shadow-lg backdrop-blur-xl bg-future-midnight/80 border-b border-white/5 shadow-brand-900/20";
     }
  }

  // Text Colors (Chameleon Logic)
  const textClasses = isDarkTheme
    ? "text-gray-300 hover:text-white"
    : "text-future-steel hover:text-brand-600";
  const logoTextClasses =
    isDarkTheme
      ? "text-white group-hover:text-brand-100"
      : "text-future-midnight group-hover:text-future-carbon";
  const logoIconClasses =
    isDarkTheme
      ? "text-brand-400 group-hover:text-brand-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
      : "text-brand-600";
  
  const hamburgerClasses =
    isDarkTheme
      ? "text-white hover:text-brand-400 bg-white/5"
      : "text-future-carbon hover:text-brand-600 bg-brand-50";

  const handleProfileClick = () => setIsProfileMenuOpen((prev) => !prev);

  return (
    <nav className={navClasses}>
      <div className={isAuthPage ? "w-full px-6 flex justify-between items-center relative" : "container-custom relative"}>
        <div className="flex justify-between items-center w-full">
          {/* Logo - Always Present and Shared */}
          <div className="pointer-events-auto z-50">
            <Link to="/" className="flex items-center space-x-2 group">
               <Logo 
                 className="transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                 iconClassName={`h-8 w-8 ${logoIconClasses}`}
                 textClassName={`text-lg transition-colors ${logoTextClasses}`}
                 showText={true}
                 variant={isAuthPage ? 'white' : (isDarkTheme ? 'white' : 'dark')}
               />
            </Link>
          </div>

          {/* Center Search Bar - In Flow (Desktop Only) */}
          <div className="flex-1 flex justify-center px-4 md:px-8">
            {!isAuthPage && ((location.pathname !== '/search' && location.pathname !== '/') || (showNavbarSearch)) && (
               <div className="hidden lg:block w-full max-w-sm xl:max-w-md transition-all duration-300">
                   <SearchBar variant="navbar" />
               </div>
            )}
          </div>


          {/* Right Side Actions Container */}
          <div className="flex items-center">
            
            {/* AUTH PAGE: Back Button */}
            <div 
              className={`transition-all duration-500 transform absolute right-0 ${
                isAuthPage 
                  ? "opacity-100 translate-y-0 pointer-events-auto" 
                  : "opacity-0 -translate-y-4 pointer-events-none"
              }`}
            >
              <Link 
                to="/" 
                className="group flex items-center text-sm font-medium text-future-slate hover:text-future-carbon transition-colors bg-white/80 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md hover:bg-white"
              >
                 <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-300">←</span>
                 Back to Home
              </Link>
            </div>

            {/* MAIN PAGE: Menu & Search */}
            <div 
              className={`flex items-center transition-all duration-500 ${
                !isAuthPage 
                  ? "opacity-100 translate-y-0 pointer-events-auto" 
                  : "opacity-0 -translate-y-4 pointer-events-none hidden lg:flex" 
              }`}
            >
              {/* Desktop Nav Links */}
              <div className="hidden lg:flex items-center space-x-5 lg:space-x-8">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <a
                      key={link.name}
                      href={link.path}
                      className={`${textClasses} font-medium text-sm transition-colors relative group ${isActive ? (isDarkTheme ? "text-white" : "text-brand-600") : ""}`}
                    >
                      {link.name}
                      <span
                        className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"} ${isDarkTheme ? "bg-brand-400" : "bg-brand-600"}`}
                      ></span>
                    </a>
                  );
                })}

                <div
                  className={`flex items-center space-x-4 pl-6 border-l ${isDarkTheme ? "border-white/10" : "border-future-smoke"}`}
                >
                  {user ? (
                    <div className="flex items-center space-x-4">
                      {/* Company Action */}
                      {user.isSubscribed === true && (
                        (() => {
                          const companyPath = user.registeredCompanyId ? `/company/${user.registeredCompanyId}` : '/register-company';
                          const isCompanyActive = location.pathname === companyPath;
                          return (
                            <Link 
                              to={companyPath} 
                              className={`text-sm font-medium hidden lg:block relative group transition-colors ${isCompanyActive ? (isDarkTheme ? 'text-white' : 'text-brand-600') : (isDarkTheme ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-brand-600')}`}
                            >
                              My Company
                              <span className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${isCompanyActive ? 'w-full' : 'w-0 group-hover:w-full'} ${isDarkTheme ? 'bg-brand-400' : 'bg-brand-600'}`}></span>
                            </Link>
                          );
                        })()
                      )}

                      <div id="profile-menu-container" className="relative">
                        <button
                          type="button"
                          onClick={handleProfileClick}
                          className={`flex items-center font-medium text-sm px-3 py-1.5 rounded-full border shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkTheme ? "bg-white/10 border-white/10 text-white focus:ring-white/30 focus:ring-offset-future-midnight" : "bg-white border-brand-100 text-future-carbon shadow-sm focus:ring-brand-200 focus:ring-offset-white"}`}
                        >
                          {user.profilePhoto ? (
                            <img src={`${API_BASE}${user.profilePhoto}`} alt="" className="w-6 h-6 rounded-full object-cover mr-2" />
                          ) : (
                            <User className={`h-4 w-4 mr-2 ${isDarkTheme ? "text-brand-400" : "text-brand-600"}`} />
                          )}
                          {user.companyName || user.email?.split('@')[0] || 'Account'}
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className={`absolute top-full mt-2 right-0 w-48 rounded-xl border shadow-lg transition-all duration-200 transform origin-top-right ${isProfileMenuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"} ${isDarkTheme ? "bg-future-midnight/95 border-white/10" : "bg-white border-brand-100"}`}>
                            <button
                              className={`w-full text-left px-4 py-3 text-sm rounded-t-xl ${isDarkTheme ? "text-white hover:bg-white/5" : "text-future-carbon hover:bg-brand-50"}`}
                              onClick={() => {
                                navigate("/profile");
                                setIsProfileMenuOpen(false);
                              }}
                            >
                              Profile
                            </button>
                            {user.role === "ADMIN" && (
                              <button
                                  className={`w-full text-left px-4 py-3 text-sm ${isDarkTheme ? "text-brand-300 hover:bg-white/5" : "text-brand-600 hover:bg-brand-50"}`}
                                  onClick={() => {
                                  navigate("/admin");
                                  setIsProfileMenuOpen(false);
                                  }}
                              >
                                  Admin Dashboard
                              </button>
                            )}
                            <button
                              className={`w-full text-left px-4 py-3 text-sm border-t rounded-b-xl ${isDarkTheme ? "border-white/5 text-red-200 hover:bg-white/5" : "border-brand-50 text-red-500 hover:bg-red-50"}`}
                              onClick={() => {
                                logout();
                                setIsProfileMenuOpen(false);
                              }}
                            >
                              Log out
                            </button>
                          </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className={`${textClasses} font-medium text-sm px-4 py-2 transition-colors`}
                      >
                        Log in
                      </Link>
                      <Button
                        variant="primary"
                        to="/signup"
                        className={`shadow-lg border !py-2.5 ${isDarkTheme ? "shadow-brand-500/20 border-white/10" : "shadow-brand-500/10 border-transparent"}`}
                      >
                        Create free account
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Search & Menu Buttons */}
            <div className={`lg:hidden flex items-center space-x-2 ${isAuthPage ? 'hidden' : ''}`}>
                
                {/* Search Toggle Icon */}
                {location.pathname !== '/search' && ((location.pathname === '/' && showNavbarSearch) || location.pathname !== '/') && (
                  <button
                    onClick={toggleSearch}
                    className={`focus:outline-none p-2 rounded-lg ${hamburgerClasses} min-h-[44px] min-w-[44px] touch-target flex items-center justify-center transition-colors ${isSearchOpen ? 'bg-white/10 text-white' : ''}`}
                  >
                    {isSearchOpen ? (
                       <X className="h-5 w-5" />
                    ) : (
                       <Search className="h-5 w-5" />
                    )}
                  </button>
                )}

                {/* Info: Hamburger Menu */}
                <button
                  onClick={toggleMenu}
                  className={`focus:outline-none p-2 rounded-lg ${hamburgerClasses} min-h-[44px] min-w-[44px] touch-target flex items-center justify-center transition-colors ${isOpen ? 'bg-white/10 text-white' : ''}`}
                >
                  {isOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
            </div>

          </div>
        </div>

        {/* Mobile Search Panel - DROPDOWN */}
        <div 
          className={`lg:hidden absolute left-0 top-full w-full bg-future-midnight/95 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-300 origin-top overflow-visible z-[60] ${
            isSearchOpen ? "max-h-40 opacity-100 visible py-4" : "max-h-0 opacity-0 invisible py-0"
          }`}
        >
           <div className="container-custom">
               <SearchBar variant="navbar" />
           </div>
        </div>

        {/* Mobile Nav Dropdown - COMPACT REDESIGN */}
        <div 
          className={`lg:hidden absolute left-0 top-full w-full bg-future-midnight/95 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-300 origin-top overflow-hidden ${
            isOpen ? "max-h-[80vh] opacity-100 visible" : "max-h-0 opacity-0 invisible"
          }`}
        >
            <div className="px-6 py-6 space-y-6">
              
              {/* Navigation Links - Enhanced Design */}
              <div className="space-y-2">
                
                {/* Home Link */}
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${
                    location.pathname === '/' 
                      ? "bg-brand-600/10 text-brand-400 border border-brand-500/20" 
                      : "text-future-smoke hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium text-sm">Home</span>
                </Link>

                {/* Dynamic Links */}
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${
                        isActive 
                          ? "bg-brand-600/10 text-brand-400 border border-brand-500/20" 
                          : "text-future-smoke hover:bg-white/5 hover:text-white"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Crown className="w-5 h-5" /> {/* Assuming Subscription is the only dynamic link for now */}
                      <span className="font-medium text-sm">{link.name}</span>
                    </Link>
                  );
                })}

                {/* Company Link (if subscribed) */}
                {user?.isSubscribed && (
                  <Link
                    to={user.registeredCompanyId ? `/company/${user.registeredCompanyId}` : '/register-company'}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${
                      location.pathname.includes('/company') 
                        ? "bg-brand-600/10 text-brand-400 border border-brand-500/20" 
                        : "text-future-smoke hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="font-medium text-sm">My Company</span>
                  </Link>
                )}

              </div>

              {/* Auth / Profile Section */}
              <div className="pt-4 border-t border-white/10">
                {user ? (
                   <div className="space-y-4">
                       <div className="flex items-center space-x-3 px-2">
                           {user.profilePhoto ? (
                             <img src={`${API_BASE}${user.profilePhoto}`} alt="" className="w-9 h-9 rounded-full object-cover border border-brand-500/30" />
                           ) : (
                             <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-300 font-bold border border-brand-500/30 text-sm">
                               {(user.companyName || user.email || 'U').charAt(0).toUpperCase()}
                             </div>
                           )}
                          <div className="overflow-hidden">
                             <p className="text-white font-medium text-sm truncate">{user.companyName || user.email?.split('@')[0] || 'Account'}</p>
                             <p className="text-brand-300 text-xs truncate">{user.role}</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                           <Link 
                              to="/profile"
                              onClick={() => setIsOpen(false)}
                              className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-center text-sm text-future-smoke hover:bg-white/10 hover:text-white transition-colors"
                           >
                              Profile
                           </Link>
                           <button 
                              onClick={() => {
                                logout();
                                setIsOpen(false);
                              }}
                              className="py-2.5 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                           >
                              Logout
                           </button>
                       </div>
                       
                       {user.role === "ADMIN" && (
                           <Link 
                               to="/admin"
                               onClick={() => setIsOpen(false)}
                               className="block w-full py-2.5 px-4 rounded-lg bg-brand-500/10 border border-brand-500/20 text-center text-sm text-brand-300 hover:bg-brand-500/20 hover:text-white transition-colors mt-3"
                           >
                               Admin Dashboard
                           </Link>
                       )}
                   </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <Link
                      to="/login"
                       onClick={() => setIsOpen(false)}
                      className="flex justify-center items-center py-2.5 rounded-xl border border-white/10 text-white font-medium text-sm hover:bg-white/5 transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                       onClick={() => setIsOpen(false)}
                      className="flex justify-center items-center py-2.5 rounded-xl bg-brand-600 text-white font-medium text-sm hover:bg-brand-500 shadow-lg shadow-brand-600/20 transition-all"
                    >
                      Create free account
                    </Link>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </nav>
  );
};


export default Navbar;
