import React, { useState } from 'react';
import { Search, ArrowRight, Shield, CheckCircle, Users, Star, FileCheck, Lock, Briefcase, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import useScrollReveal from '../hooks/useScrollReveal';
import Silk from '../components/effects/Silk';
import api from '../services/api'; 
import SearchBar from '../components/ui/SearchBar';
import { useSearch } from '../context/SearchContext';
import LogoLoop from '../components/ui/LogoLoop';
import StatsCounter from '../components/ui/StatsCounter';
import RecentReviews from '../components/sections/RecentReviews';
import TypewriterText from '../components/ui/TypewriterText';

const API_BASE = import.meta.env.VITE_API_URL;

const LandingPage = () => {
  const { showNavbarSearch, setShowNavbarSearch, setSearchTerm } = useSearch();
  const heroRef = React.useRef(null);
  const searchContainerRef = React.useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Clear search term when landing on Home
  React.useEffect(() => {
    setSearchTerm('');
  }, [setSearchTerm]);
  
  // Enable scroll animations
  useScrollReveal();

  const [trending, setTrending] = useState([]); // Trending Data

  // Scroll Listener for Navbar Search
  React.useEffect(() => {
    const handleScroll = () => {
        if (!searchContainerRef.current) return;
        
        const rect = searchContainerRef.current.getBoundingClientRect();
        // Trigger when the search bar hits the navbar area (approx 80px)
        const triggerPoint = 90; 
        
        if (rect.top <= triggerPoint) {
            setShowNavbarSearch(true);
        } else {
            setShowNavbarSearch(false);
        }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();

    return () => {
        window.removeEventListener('scroll', handleScroll);
        // Clean up: Always reset on unmount to prevent stuck navbar search
        setShowNavbarSearch(false); 
    };
  }, [setShowNavbarSearch]);

  // Fetch Trending on Mount
  React.useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await api.get('/companies/trending');
        setTrending(data);
      } catch (error) {
        console.error("Failed to load trending:", error);
      }
    };
    fetchTrending();
  }, []);

  const handleSelectCompany = (companyId) => {
    navigate(`/company/${companyId}`);
  };

  return (
    <div className="flex flex-col w-full overflow-x-hidden min-h-screen">
      {/* Hero Section */}
      {/* Hero Section - Premium Dark Mode */}
      <section ref={heroRef} className="relative pt-24 pb-20 sm:pt-28 sm:pb-32 md:pt-32 md:pb-40 px-4 sm:px-6 lg:px-8 overflow-hidden bg-future-midnight" data-nav-theme="dark">
        {/* Silk Background Effect */}
        <div className="absolute inset-0 z-0 opacity-30">
          <Silk
            speed={5}
            scale={1}
            color="#4F46E5"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>

        {/* Dark Background Effects - hidden on mobile for performance */}
        <div className="hidden sm:block absolute top-0 right-0 w-[400px] md:w-[600px] lg:w-[800px] h-[400px] md:h-[600px] lg:h-[800px] bg-brand-500/20 rounded-full blur-[120px] opacity-40 -translate-y-1/3 translate-x-1/3 animate-float z-5"></div>
        <div className="hidden sm:block absolute bottom-0 left-0 w-[300px] md:w-[450px] lg:w-[600px] h-[300px] md:h-[450px] lg:h-[600px] bg-indigo-900/40 rounded-full blur-[120px] opacity-50 translate-y-1/3 -translate-x-1/3 animate-float animation-delay-2000 z-5"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] z-5"></div>

        <div className="container-custom relative z-10 text-center max-w-5xl mx-auto reveal">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-brand-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 shadow-sm">
            <Shield className="w-3 h-3 mr-1.5 sm:mr-2 text-brand-400" />
            <span className="hidden sm:inline">The New Standard in Textile Verification</span>
            <span className="sm:hidden">Textile Verification</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white tracking-tight leading-tight mb-4 sm:mb-6 md:mb-8">
            Trade with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-200 to-brand-500 text-shimmer relative">Confidence
            <svg className="absolute w-full h-2 sm:h-3 -bottom-0.5 sm:-bottom-1 left-0 text-brand-500/50 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
            </span>
            <br className="hidden sm:block" />
            <span className="sm:hidden"> – </span>
            <TypewriterText 
              phrases={['Verify Every Partner.', 'Assess Credit Risk.', 'Build Trust Networks.']}
              className=""
            />
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-brand-100/80 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed font-light px-2 sm:px-0">
            TextileTrust is the B2B verification platform that connects reliable traders and manufacturers using official GST records and authentic feedback.
          </p>
          
          {/* Conditional Search Bar */}
          <div ref={searchContainerRef} className="max-w-2xl mx-auto mb-10 sm:mb-16 md:mb-20 min-h-[50px] sm:min-h-[60px] px-2 sm:px-0"> 
            {!showNavbarSearch && (
                <div className="animate-in fade-in zoom-in duration-500">
                    <SearchBar placeholder="Search by Name or GSTN..." />
                </div>
            )}
          </div>

   {/* Trending Section Dashboard */}
          {trending.length > 0 && user?.isSubscribed && (
             <div className="mb-10 sm:mb-16 md:mb-20 text-left w-full relative z-20">
                <div className="flex items-center mb-4 sm:mb-6 px-2 sm:px-0">
                   <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg mr-2 sm:mr-3">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                   </div>
                   <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">Most Trusted Companies</h3>
                </div>

                {/* Mobile: LogoLoop */}
                <div className="block sm:hidden w-screen relative left-1/2 -translate-x-1/2">
                   <LogoLoop
                      logos={trending.slice(0, 5).map(company => ({
                        node: (
                          <div 
                            key={company._id}
                            onClick={() => handleSelectCompany(company._id)}
                            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 w-[290px] flex flex-col gap-2 mx-2 cursor-pointer active:scale-95 transition-transform shadow-soft text-left relative"
                          >
                             <div className="flex items-center gap-2 mb-1">
                                <div className="w-9 h-9 min-w-[36px] rounded-lg bg-white/10 flex items-center justify-center text-white/70 font-bold text-xs uppercase overflow-hidden border border-white/20">
                                   {company.submittedBy?.profilePhoto ? (
                                     <img src={`${API_BASE}${company.submittedBy.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                                   ) : (
                                     company.name?.substring(0, 2)
                                   )}
                                </div>
                                <h4 className="font-bold text-white text-sm truncate max-w-[140px]">{company.name}</h4>
                             </div>
                             <div className="text-[10px] text-brand-200/50 ml-1">
                                Deal Again: {company.dealAgainPercentage || 0}%
                             </div>
                             <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                   company.trustStatus === 'TRUSTED' ? 'bg-emerald-500/20 text-emerald-300' :
                                   company.trustStatus === 'CAUTION' ? 'bg-amber-500/20 text-amber-300' :
                                   'bg-gray-500/20 text-gray-300'
                                }`}>
                                   {company.trustStatus}
                                </div>
                                <div className="flex items-center justify-end text-xs text-brand-100/70">
                                   <Star className="w-3 h-3 text-orange-400 fill-orange-400 mr-1" />
                                   <span className="font-bold text-white mr-1">{company.avgRating}</span>
                                   <span>({company.totalReviews})</span>
                                </div>
                             </div>
                          </div>
                        )
                      }))}
                      speed={50}
                      direction="left"
                      logoHeight={100}
                      gap={0}
                      hoverSpeed={0}
                      useCustomRender={true}
                      fadeOut={false}
                   />
                </div>

                {/* Tablet/Desktop: Grid */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-0">
                   {trending.slice(0, 3).map((company) => (
                      <div 
                        key={company._id}
                        onClick={() => handleSelectCompany(company._id)}
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-3 sm:p-4 hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98] shadow-soft"
                      >
                         <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] sm:min-w-[44px] rounded-lg bg-white/10 flex items-center justify-center text-white/70 font-bold text-sm uppercase overflow-hidden border border-white/20 flex-shrink-0">
                               {company.submittedBy?.profilePhoto ? (
                                 <img src={`${API_BASE}${company.submittedBy.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 company.name?.substring(0, 2)
                               )}
                            </div>
                            <h4 className="font-bold text-white group-hover:text-brand-300 transition-colors text-sm sm:text-base truncate mr-2">{company.name}</h4>
                            <div className={`flex-shrink-0 ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                               company.trustStatus === 'TRUSTED' ? 'bg-emerald-500/20 text-emerald-300' :
                               company.trustStatus === 'CAUTION' ? 'bg-amber-500/20 text-amber-300' :
                               'bg-gray-500/20 text-gray-300'
                            }`}>
                               {company.trustStatus}
                            </div>
                         </div>
                         <div className="flex items-center text-xs sm:text-sm text-brand-100/70">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400 fill-orange-400 mr-1 sm:mr-1.5" />
                            <span className="font-bold text-white mr-1">{company.avgRating}</span>
                            <span className="mr-2 sm:mr-3">({company.totalReviews})</span>
                            <span className="text-[10px] sm:text-xs text-brand-200/50 hidden sm:inline">Deal Again: {company.dealAgainPercentage || 0}%</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* End of Hero Content */}
        </div>
      </section>

      {/* Animated Stats Counter */}
      <StatsCounter />

      {/* What We Do / Core Value */}
      <section className="py-12 sm:py-16 md:py-24 relative z-20">
        <div className="container-custom">
           <div className="text-center mb-8 sm:mb-12 md:mb-16 reveal">
            <h2 className="text-xs sm:text-sm font-bold text-brand-500 uppercase tracking-widest mb-2 sm:mb-3">Core Platform Features</h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-future-carbon">What TextileTrust Does</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 reveal">
            <GlassCard className="p-8 reveal reveal-delay-1 card-hover-lift group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-future-carbon mb-3">GST & PAN Verification</h4>
              <p className="text-future-steel leading-relaxed">
                We cross-reference every company against official government databases to ensure they are a registered, legal business entity.
              </p>
            </GlassCard>
            
            <GlassCard className="p-8 reveal reveal-delay-2 card-hover-lift group">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-green-500/20 transition-all duration-300">
                <Star className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-future-carbon mb-3">Authentic Reviews</h4>
              <p className="text-future-steel leading-relaxed">
                Read unbiased feedback from other textile professionals. See payment habits, quality ratings, and delivery reliability.
              </p>
            </GlassCard>
            
            <GlassCard className="p-8 reveal reveal-delay-3 card-hover-lift group">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all duration-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-future-carbon mb-3">Credit Risk Assessment</h4>
              <p className="text-future-steel leading-relaxed">
                Make safer credit decisions by checking a company's "Deal Again" percentage and long-term reputation score.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Why Trust Us - High Contrast Dark Section */}
      <section className="py-24 bg-future-midnight relative overflow-hidden" data-nav-theme="dark">
        {/* Dark Background Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] opacity-30 orb-float-1"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/40 rounded-full blur-[120px] opacity-40 orb-float-2"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05]"></div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <h2 className="text-sm font-bold text-brand-400 uppercase tracking-widest mb-3">Trust Indicators</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Built on transparency.<br />Verified by humans.
              </h3>
              <p className="text-future-smoke text-lg mb-8 leading-relaxed">
                Unlike open marketplaces, TextileTrust prioritizes quality over quantity. We maintain a clean ecosystem free from spam and fake profiles.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "No Anonymous Reviews", desc: "Every review is linked to a verified user account." },
                  { title: "Admin-Verified Listings", desc: "Our team manually approves every company profile." },
                  { title: "One User, One Review", desc: "Prevents ballot-stuffing and reputation manipulation." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start group">
                    <CheckCircle className="w-6 h-6 text-brand-400 mt-1 mr-4 flex-shrink-0 group-hover:text-brand-300 transition-colors" />
                    <div>
                      <h4 className="text-lg font-bold text-white">{item.title}</h4>
                      <p className="text-future-smoke/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual abstracted UI - Dark Mode Version */}
            <div className="relative reveal">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 hover:shadow-2xl hover:shadow-brand-500/10 hover:bg-white/10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center border border-brand-500/20">
                    <Lock className="w-8 h-8 text-brand-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">Verification Status</div>
                    <div className="text-indigo-400 font-mono text-sm tracking-wider">100% SECURE</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  <div className="h-4 bg-white/10 rounded w-5/6"></div>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 text-center text-xs text-future-smoke uppercase tracking-widest">
                  Data processed via 256-bit encryption
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-24">
        <div className="container-custom">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl font-bold text-future-carbon">Who is TextileTrust for?</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 reveal">
            <GlassCard className="p-8 text-center reveal reveal-delay-1 card-hover-lift group">
              <div className="w-16 h-16 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all duration-300">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-future-carbon mb-3">Textile Traders</h3>
              <p className="text-future-steel">
                Verify suppliers before booking orders and check creditworthiness of new buyers.
              </p>
            </GlassCard>
            
            <GlassCard className="p-8 text-center reveal reveal-delay-2 card-hover-lift group">
              <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-future-carbon mb-3">Manufacturers</h3>
              <p className="text-future-steel">
                Showcase your verified reputation to attract premium buyers and secure better terms.
              </p>
            </GlassCard>
            
            <GlassCard className="p-8 text-center reveal reveal-delay-3 card-hover-lift group">
              <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-future-carbon mb-3">Sourcing Agents</h3>
              <p className="text-future-steel">
                Build a portfolio of reliable vendors and protect your clients from fraud.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white/50 backdrop-blur-sm border-t border-white/40">
        <div className="container-custom">
          <div className="text-center mb-16 reveal">
            <h2 className="text-sm font-bold text-brand-500 uppercase tracking-widest mb-3">How to Get Started</h2>
            <h3 className="text-3xl font-bold text-future-carbon">3 Steps to Safer Trade</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {/* Animated Dashed Connector */}
            <svg className="hidden md:block absolute top-14 left-[20%] right-[20%] w-[60%] h-2 -z-10" preserveAspectRatio="none">
              <line x1="0" y1="4" x2="100%" y2="4" stroke="#C7D2FE" strokeWidth="2" className="dash-animate" />
            </svg>

            {[
              {
                num: "1",
                title: "Create Account",
                desc: "Sign up with your business details to join the network."
              },
              {
                num: "2",
                title: "Search Company",
                desc: "Use GST or PAN to find specific company records."
              },
              {
                num: "3",
                title: "View Reputation",
                desc: "Unlock detailed reviews and trust scores."
              }
            ].map((step, idx) => (
              <div key={idx} className={`flex flex-col items-center text-center group reveal reveal-delay-${idx + 1}`}>
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-8 step-pulse group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-brand-500/20">
                  <span className="text-4xl font-bold text-white">{step.num}</span>
                </div>
                <h4 className="text-xl font-bold text-future-carbon mb-3">{step.title}</h4>
                <p className="text-future-steel leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clean CTA - High Contrast Midnight Version */}
      {!user && (
        <section className="py-24 bg-future-midnight border-t border-white/5 relative overflow-hidden" data-nav-theme="dark">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none orb-float-1"></div>

          <div className="container-custom relative z-10 reveal">
            <div className="text-center max-w-4xl mx-auto px-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight text-glow">
                Ready to verify your next partner?
              </h2>
              <p className="text-xl text-brand-100 mb-12 max-w-xl mx-auto font-light">
                Join verified textile professionals who trust TextileTrust for their due diligence.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button to="/signup" variant="primary" className="py-4 px-12 text-lg shadow-2xl shadow-brand-500/40 hover:shadow-brand-500/50 border border-white/10">
                  Create Free Account
                </Button>
                <Button to="/login" variant="ghost" className="py-4 px-12 text-lg text-white hover:bg-white/10 hover:text-white border border-white/20">
                  Login to Account
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Reviews Section - Hidden if not subscribed */}
      {user?.isSubscribed && <RecentReviews />}

      {/* Footer is in Layout.jsx, so we just end here */}
    </div>
  );
};

export default LandingPage;
