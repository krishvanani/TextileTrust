import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader, Building2, Phone, UserCheck, Eye, EyeOff } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import LiquidEther from '../components/effects/liquid';
import Logo from '../components/ui/Logo';

const Signup = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    contactNumber: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (error) setError('');
  };
  
  const handleRoleChange = (e) => {
    setFormData(prev => ({ ...prev, role: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!formData.companyName.trim() || !formData.email.trim() || !formData.contactNumber.trim() || !formData.password) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
    }

    setIsLoading(true);
    
    // Log payload for debugging (can be removed later)
    console.log("Registering payload:", {
      companyName: formData.companyName,
      email: formData.email,
      contactNumber: formData.contactNumber,
      role: formData.role,
      // password not logged for security
    });

    const result = await register({
      companyName: formData.companyName.trim(),
      email: formData.email.trim(),
      contactNumber: formData.contactNumber.trim(),
      role: formData.role, // "TRADER" or "MANUFACTURER" from state
      password: formData.password
    });
    
    setIsLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      // Backend error message should be displayed directly
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-future-midnight lg:bg-transparent">
      {/* Left Side - Interactive Visual */}
      <div className="hidden lg:flex w-1/2 bg-future-midnight relative overflow-hidden items-center justify-center p-12">
        {/* Liquid Ether Effect */}
        <div className="absolute inset-0 z-0">
          <LiquidEther
            mouseForce={30}
            cursorSize={120}
            isViscous={true}
            viscous={25}
            iterationsViscous={32}
            iterationsPoisson={32}
            dt={0.014}
            BFECC={true}
            resolution={0.5}
            isBounce={false}
            colors={['#1a1a2e', '#16213e', '#0f3460', '#533483', '#9d4edd']}
            autoDemo={true}
            autoSpeed={0.3}
            autoIntensity={1.8}
            takeoverDuration={0.25}
            autoResumeDelay={2000}
            autoRampDuration={0.6}
            className="absolute inset-0"
          />
        </div>

        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 z-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full blur-[120px] opacity-20 animate-pulse z-5"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 z-5"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-white mb-8 shadow-sm">
             <ShieldCheck className="w-4 h-4 mr-2 text-emerald-400" />
             Join Verified Network
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight text-white drop-shadow-xl">
            Start Your Journey.<br/>Trade Securely.
          </h1>
          <p className="text-brand-100 text-lg leading-relaxed mb-10 font-light">
             Create your account to access verified profiles, check credit scores, and build lasting business relationships.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-all duration-300">
              <div className="text-3xl font-bold mb-1 text-white">Free</div>
              <div className="text-brand-200 text-sm">Account Forever</div>
            </div>
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-all duration-300">
              <div className="text-3xl font-bold mb-1 text-white">100%</div>
              <div className="text-brand-200 text-sm">Real Data</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Unique Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-16 relative overflow-y-auto pt-20 sm:pt-24 lg:pt-28 overflow-hidden">
        {/* Mobile Background Decor */}
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-brand-500/20 blur-[80px] lg:hidden pointer-events-none orb-float-1"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-teal-600/20 blur-[80px] lg:hidden pointer-events-none orb-float-2"></div>

        {/* Link removed - handled by Navbar */}
        
        <div className="w-full max-w-md space-y-6 sm:space-y-8 mt-10 lg:mt-0 glass p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl relative z-10 gradient-border-card">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-4 sm:mb-6 flex justify-center">
                <Logo variant="dark" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-future-carbon tracking-tight text-glow">Create account</h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-future-steel">
              Enter your details to join the network.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs sm:text-sm flex items-center animate-shake">
                <div className="w-1 h-4 bg-red-500 rounded mr-2 sm:mr-3"></div>
                {error}
              </div>
            )}
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-future-steel group-focus-within:text-future-carbon transition-colors">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <input
                id="companyName"
                type="text"
                placeholder="Company Name"
                className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/50 border border-future-smoke rounded-xl text-future-carbon placeholder-future-steel focus:outline-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 input-glow transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-future-steel group-focus-within:text-future-carbon transition-colors">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="Work Email Address"
                className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/50 border border-future-smoke rounded-xl text-future-carbon placeholder-future-steel focus:outline-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 input-glow transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

             <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-future-steel group-focus-within:text-future-carbon transition-colors">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <input
                id="contactNumber"
                type="tel"
                placeholder="Mobile Number"
                className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/50 border border-future-smoke rounded-xl text-future-carbon placeholder-future-steel focus:outline-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 input-glow transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-future-steel group-focus-within:text-future-carbon transition-colors">
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <select
                id="role"
                value={formData.role}
                onChange={handleRoleChange}
                className="block w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-4 bg-white/50 border border-future-smoke rounded-xl text-future-carbon placeholder-future-steel focus:outline-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 input-glow transition-all duration-300 appearance-none text-sm sm:text-base min-h-[48px]"
              >
                <option value="" disabled selected hidden>Business Type</option>
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="TRADER">Trader</option>
                <option value="WHOLESALER">Wholesaler</option>
                <option value="RETAILER">Retailer</option>
                <option value="YARN_SUPPLIER">Yarn Supplier</option>
                <option value="FABRIC_MANUFACTURER">Fabric Manufacturer</option>
                <option value="DYEING_UNIT">Dyeing Unit</option>
                <option value="PRINTING_UNIT">Printing Unit</option>
                <option value="EXPORTER">Exporter</option>
              </select>
               <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none text-future-steel">
                 <ArrowRight className="h-4 w-4 rotate-90" />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative group w-full">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-future-steel group-focus-within:text-future-carbon transition-colors">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="block w-full pl-10 sm:pl-12 pr-12 py-3 sm:py-4 bg-white/50 border border-future-smoke rounded-xl text-future-carbon placeholder-future-steel focus:outline-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 input-glow transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-future-steel hover:text-future-carbon min-w-[44px] justify-center touch-target"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>

              <div className="relative group w-full">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-future-steel group-focus-within:text-future-carbon transition-colors">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  className="block w-full pl-10 sm:pl-12 pr-12 py-3 sm:py-4 bg-white/50 border border-future-smoke rounded-xl text-future-carbon placeholder-future-steel focus:outline-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 input-glow transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-future-steel hover:text-future-carbon min-w-[44px] justify-center touch-target"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
            </div>

            <div className="pt-1 sm:pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 sm:py-4 px-4 bg-future-graphite hover:bg-future-carbon text-white rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-future-graphite/20 hover:shadow-future-graphite/30 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed min-h-[48px] touch-target"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                  <>
                    Create Account <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-future-steel text-xs sm:text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-future-graphite hover:text-future-carbon hover:underline">
              Sign in
            </Link>
          </p>
          
          <div className="relative pb-4 sm:pb-8">
             <div className="relative flex justify-center text-[10px] sm:text-xs text-future-steel">
                By signing up, you agree to our Terms & Privacy Policy
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
