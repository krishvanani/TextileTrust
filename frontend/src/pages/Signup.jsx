import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader, Phone, Eye, EyeOff, Building2, RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import LiquidEther from '../components/effects/liquid';
import Logo from '../components/ui/Logo';
import api from '../services/api';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    contactNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // GST verification state
  const [gstNumber, setGstNumber] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [captchaImage, setCaptchaImage] = useState(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState('');
  const [gstVerified, setGstVerified] = useState(false);
  const [gstData, setGstData] = useState(null);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (error) setError('');
  };

  const handleGstChange = (e) => {
    const val = e.target.value.toUpperCase();
    setGstNumber(val);
    // Reset verification when GST number changes
    if (gstVerified) {
      setGstVerified(false);
      setGstData(null);
    }
    setGstError('');
  };

  // Fetch captcha from backend
  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setGstError('');
    try {
      const { data } = await api.get('/gst/captcha');
      setCaptchaImage(data.image);
      setSessionId(data.sessionId);
      setCaptchaInput('');
    } catch {
      setGstError('Failed to load captcha. Please try again.');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  // Verify GST via captcha
  const handleVerifyGst = async () => {
    if (!gstNumber.trim() || !GST_REGEX.test(gstNumber.trim())) {
      setGstError('Please enter a valid 15-character GST number.');
      return;
    }
    if (!sessionId || !captchaInput.trim()) {
      setGstError('Please solve the captcha first.');
      return;
    }

    setGstLoading(true);
    setGstError('');
    try {
      const { data } = await api.post('/gst/verify', {
        sessionId,
        GSTIN: gstNumber.trim(),
        captcha: captchaInput.trim()
      });
      setGstData(data);
      setGstVerified(true);
      setCaptchaImage(null);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Verification failed';
      setGstError(msg);
      setGstVerified(false);
      setGstData(null);
      // Auto-refresh captcha on failure
      fetchCaptcha();
    } finally {
      setGstLoading(false);
    }
  };

  // Start verification flow
  const handleStartVerify = () => {
    if (!gstNumber.trim() || !GST_REGEX.test(gstNumber.trim())) {
      setGstError('Please enter a valid 15-character GST number.');
      return;
    }
    setGstError('');
    fetchCaptcha();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!formData.email.trim() || !formData.contactNumber.trim() || !formData.password) {
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
    
    // Build registration payload
    const payload = {
      email: formData.email.trim(),
      contactNumber: formData.contactNumber.trim(),
      password: formData.password
    };

    // Include verified GST data if available
    if (gstVerified && gstData) {
      payload.gstData = {
        gstNumber: gstData.gstin || gstNumber.trim(),
        companyName: gstData.tradeNam || gstData.lgnm || '',
        legalName: gstData.lgnm || '',
        status: gstData.sts || '',
        businessType: gstData.ctb || '',
        registrationDate: gstData.rgdt || '',
        city: gstData.pradr?.addr?.dst || gstData.pradr?.addr?.stcd || '',
      };
    }

    console.log("Registering payload:", {
      email: payload.email,
      contactNumber: payload.contactNumber,
      hasGstData: !!payload.gstData,
    });

    const result = await register(payload);
    
    setIsLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  const isGstValid = gstNumber.trim().length === 15 && GST_REGEX.test(gstNumber.trim());

  return (
    <div className="min-h-screen w-full flex bg-future-midnight lg:bg-transparent">
      {/* Left Side - Interactive Visual */}
      <div className="hidden lg:flex w-1/2 bg-future-midnight relative overflow-hidden items-center justify-center p-12">
        {/* Liquid Ether Effect */}
        <div className="absolute inset-0 z-0">
          <LiquidEther
            mouseForce={20}
            cursorSize={100}
            isViscous={true}
            viscous={20}
            iterationsViscous={8}
            iterationsPoisson={8}
            dt={0.016}
            BFECC={false}
            resolution={0.25}
            isBounce={false}
            colors={['#1a1a2e', '#16213e', '#0f3460', '#533483', '#9d4edd']}
            autoDemo={true}
            autoSpeed={0.2}
            autoIntensity={1.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
            className="absolute inset-0"
          />
        </div>

        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 z-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full blur-[120px] opacity-20 animate-pulse z-5"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 z-5"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-white mb-8 shadow-sm">
             <ShieldCheck className="w-4 h-4 mr-2 text-indigo-400" />
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
        <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-600/20 blur-[80px] lg:hidden pointer-events-none orb-float-2"></div>

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

            {/* ── GST Verification Section ── */}
            <div className="rounded-xl border border-future-smoke bg-white/30 p-3 sm:p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-future-steel" />
                <span className="text-xs sm:text-sm font-semibold text-future-carbon">GST Verification</span>
                <span className="text-[10px] text-future-steel">(Optional)</span>
              </div>

              {/* GST Input + Verify Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="gstNumber"
                    type="text"
                    maxLength={15}
                    placeholder="Enter 15-digit GST Number"
                    className="block w-full px-3 py-2.5 sm:py-3 bg-white/50 border border-future-smoke rounded-lg text-future-carbon placeholder-future-steel focus:outline-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all duration-300 text-sm min-h-[44px] font-mono uppercase tracking-wider"
                    value={gstNumber}
                    onChange={handleGstChange}
                    disabled={gstVerified}
                  />
                </div>
                {!gstVerified && !captchaImage && !captchaLoading && (
                  <button
                    type="button"
                    onClick={handleStartVerify}
                    disabled={!isGstValid}
                    className="px-3 sm:px-4 py-2.5 bg-future-graphite hover:bg-future-carbon text-white rounded-lg font-semibold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap min-h-[44px] flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Verify
                  </button>
                )}
              </div>

              {/* Captcha Section */}
              {captchaLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader className="animate-spin h-6 w-6 text-future-steel" />
                </div>
              )}

              {captchaImage && !gstVerified && !captchaLoading && (
                <div className="space-y-2.5 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="bg-white border border-future-smoke rounded-lg p-2 inline-block">
                      <img src={captchaImage} alt="Captcha" className="h-10 sm:h-11" />
                    </div>
                    <button
                      type="button"
                      onClick={fetchCaptcha}
                      className="flex items-center gap-1 text-xs text-future-steel hover:text-future-carbon font-medium transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter captcha..."
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleVerifyGst())}
                      className="flex-1 px-3 py-2.5 bg-white/50 border border-future-smoke rounded-lg text-sm focus:outline-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all min-h-[40px]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyGst}
                      disabled={!captchaInput.trim() || gstLoading}
                      className="px-3 sm:px-4 py-2.5 bg-future-graphite hover:bg-future-carbon text-white rounded-lg font-semibold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 min-h-[40px]"
                    >
                      {gstLoading ? <Loader className="animate-spin h-4 w-4" /> : <><ShieldCheck className="w-3.5 h-3.5" /> Submit</>}
                    </button>
                  </div>
                </div>
              )}

              {/* GST Error */}
              {gstError && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{gstError}</span>
                </div>
              )}

              {/* GST Verified Result */}
              {gstVerified && gstData && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-fadeIn">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-800 truncate">
                      {gstData.tradeNam || gstData.lgnm || 'Company Verified'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        gstData.sts === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {gstData.sts || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-mono">{gstData.gstin}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGstVerified(false);
                      setGstData(null);
                      setGstNumber('');
                      setCaptchaImage(null);
                      setSessionId(null);
                      setGstError('');
                    }}
                    className="text-emerald-400 hover:text-emerald-600 transition-colors"
                    title="Clear and re-verify"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {/* ── End GST Section ── */}

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
