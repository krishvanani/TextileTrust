import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader, Phone, Eye, EyeOff, Building2, RefreshCw, CheckCircle, AlertCircle, XCircle, Smartphone } from 'lucide-react';
import Logo from '../components/ui/Logo';
import api from '../services/api';
import { setupRecaptcha, sendOTP, getFirebaseIdToken, firebaseSignOut } from '../services/firebase';

const GST_REGEX = /^[0-9A-Z]{15}$/i;

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

  // OTP verification state
  const [otpStep, setOtpStep] = useState('idle'); // idle | sending | sent | verifying | verified | error
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [firebaseIdToken, setFirebaseIdToken] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef([]);
  const recaptchaContainerRef = useRef(null);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (error) setError('');
  };

  // When phone number changes, reset OTP state
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, contactNumber: val }));
    if (otpStep === 'verified') {
      // Don't reset if already verified — user must clear explicitly
    } else if (otpStep !== 'idle') {
      setOtpStep('idle');
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setConfirmationResult(null);
      setFirebaseIdToken(null);
    }
    if (error) setError('');
  };

  const handleGstChange = (e) => {
    const val = e.target.value.toUpperCase();
    setGstNumber(val);
    if (gstVerified || captchaImage) {
      setGstVerified(false);
      setGstData(null);
      setCaptchaImage(null);
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
      fetchCaptcha();
    } finally {
      setGstLoading(false);
    }
  };

  // Start GST verification flow
  const handleStartVerify = async () => {
    if (!gstNumber.trim() || !GST_REGEX.test(gstNumber.trim())) {
      setGstError('Please enter a valid 15-character GST number.');
      return;
    }
    setGstError('');
    
    setGstLoading(true);
    try {
      await api.post('/auth/check-gst', { gst: gstNumber.trim().toUpperCase() });
      fetchCaptcha();
    } catch (err) {
      setGstError(err.response?.data?.message || err.response?.data?.error || 'A user with this GST number is already registered.');
    } finally {
      setGstLoading(false);
    }
  };

  // ── OTP Functions ──

  const handleSendOTP = async () => {
    const phone = formData.contactNumber.trim();
    if (phone.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setOtpStep('sending');
    setOtpError('');
    setOtp(['', '', '', '', '', '']);

    try {
      // Setup invisible reCAPTCHA
      setupRecaptcha('recaptcha-container');

      const phoneWithCode = `+91${phone}`;
      const result = await sendOTP(phoneWithCode);
      setConfirmationResult(result);
      setOtpStep('sent');
      setResendTimer(30);

      // Auto-focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error('Send OTP error:', err);
      setOtpStep('error');
      
      if (err.code === 'auth/billing-not-enabled') {
        setOtpError('SMS service not enabled. Please contact support.');
      } else if (err.code === 'auth/invalid-app-credential') {
        setOtpError('App verification failed. Please refresh and try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setOtpError('Too many requests. Please try again later.');
      } else if (err.code === 'auth/quota-exceeded') {
        setOtpError('SMS quota exceeded. Please try again later.');
      } else {
        setOtpError(err.message || 'Failed to send OTP. Please try again.');
      }

      // Re-create reCAPTCHA on failure
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
        window.recaptchaVerifier = null;
      }
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    // Clear old reCAPTCHA
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
      window.recaptchaVerifier = null;
    }
    await handleSendOTP();
  };

  const handleOtpChange = (index, value) => {
    // Only allow single digit
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (value && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        verifyOTP(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const fullOtp = otp.join('');
      if (fullOtp.length === 6) {
        verifyOTP(fullOtp);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);

    if (pasted.length === 6) {
      verifyOTP(pasted);
    } else {
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const verifyOTP = async (code) => {
    if (!confirmationResult) {
      setOtpError('Session expired. Please resend OTP.');
      setOtpStep('error');
      return;
    }

    setOtpStep('verifying');
    setOtpError('');

    try {
      await confirmationResult.confirm(code);
      const token = await getFirebaseIdToken();
      setFirebaseIdToken(token);
      setOtpStep('verified');
    } catch (err) {
      console.error('OTP verification error:', err);
      setOtpStep('error');
      if (err.code === 'auth/invalid-verification-code') {
        setOtpError('Invalid OTP. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setOtpError('OTP expired. Please resend.');
      } else {
        setOtpError(err.message || 'Verification failed. Please try again.');
      }
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  };

  const resetOtp = () => {
    setOtpStep('idle');
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setConfirmationResult(null);
    setFirebaseIdToken(null);
    setResendTimer(0);
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
      window.recaptchaVerifier = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.contactNumber.trim() || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }

    // Check phone verification
    if (otpStep !== 'verified') {
      setError("Please verify your mobile number with OTP first.");
      return;
    }

    // Check GST verification
    if (!gstVerified || !gstData) {
      setError("Please verify your GST number before creating an account.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    
    const payload = {
      email: formData.email.trim(),
      contactNumber: formData.contactNumber.trim(),
      password: formData.password,
      firebaseIdToken: firebaseIdToken,
    };

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

    const result = await register(payload);
    
    setIsLoading(false);
    
    if (result.success) {
      // Clean up Firebase auth state
      await firebaseSignOut();
      navigate('/');
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  const isGstValid = gstNumber.trim().length === 15 && GST_REGEX.test(gstNumber.trim());
  const isPhoneValid = formData.contactNumber.trim().length === 10;

  return (
    <div className="min-h-screen w-full flex bg-future-midnight lg:bg-transparent">
      {/* Left Side - Interactive Visual */}
      <div className="hidden lg:flex w-1/2 bg-future-midnight relative overflow-hidden items-center justify-center p-12">
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

        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
        
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
            
            {/* Email */}
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

            {/* ── Phone + OTP Section ── */}
            <div className="rounded-xl border border-future-smoke bg-white/30 p-3 sm:p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="h-4 w-4 text-future-steel" />
                <span className="text-xs sm:text-sm font-semibold text-future-carbon">Phone Verification</span>
                {otpStep === 'verified' && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>

              {/* Phone Input + Send OTP Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-future-steel">
                    <span className="text-sm font-semibold">+91</span>
                  </div>
                  <input
                    id="contactNumber"
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="block w-full pl-12 pr-4 py-2.5 sm:py-3 bg-white/50 border border-future-smoke rounded-lg text-future-carbon placeholder-future-steel focus:outline-none focus:border-future-mist focus:ring-2 focus:ring-future-mist/20 transition-all duration-300 text-sm min-h-[44px] tracking-wider"
                    value={formData.contactNumber}
                    onChange={handlePhoneChange}
                    disabled={otpStep === 'verified'}
                  />
                </div>
                {otpStep === 'idle' || otpStep === 'error' ? (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={!isPhoneValid}
                    className="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap min-h-[44px] flex items-center gap-1.5 shadow-md shadow-indigo-200/50"
                  >
                    <Phone className="w-3.5 h-3.5" /> Send OTP
                  </button>
                ) : otpStep === 'sending' ? (
                  <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-xs sm:text-sm min-h-[44px] flex items-center gap-1.5 opacity-80">
                    <Loader className="w-3.5 h-3.5 animate-spin" /> Sending...
                  </div>
                ) : otpStep === 'verified' ? (
                  <button
                    type="button"
                    onClick={resetOtp}
                    className="px-3 py-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors min-h-[44px] flex items-center gap-1"
                    title="Change number"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              {/* OTP Input Section */}
              {(otpStep === 'sent' || otpStep === 'verifying' || otpStep === 'error') && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="text-center">
                    <p className="text-xs text-future-steel">
                      Enter the 6-digit code sent to <span className="font-semibold text-future-carbon">+91 {formData.contactNumber}</span>
                    </p>
                  </div>

                  {/* 6-digit OTP boxes */}
                  <div className="flex justify-center gap-2 sm:gap-2.5">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => otpInputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        disabled={otpStep === 'verifying'}
                        className={`w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-bold rounded-xl border-2 transition-all duration-300 focus:outline-none
                          ${digit 
                            ? 'border-indigo-400 bg-indigo-50/80 text-indigo-700 shadow-sm shadow-indigo-100' 
                            : 'border-future-smoke bg-white/50 text-future-carbon'
                          }
                          ${otpStep === 'verifying' ? 'opacity-60' : ''}
                          focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 focus:bg-white
                        `}
                        style={{ caretColor: '#6366f1' }}
                      />
                    ))}
                  </div>

                  {/* Verifying spinner */}
                  {otpStep === 'verifying' && (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <Loader className="w-4 h-4 animate-spin text-indigo-500" />
                      <span className="text-xs text-indigo-600 font-medium">Verifying...</span>
                    </div>
                  )}

                  {/* Resend */}
                  <div className="flex justify-center">
                    {resendTimer > 0 ? (
                      <p className="text-xs text-future-steel">
                        Resend OTP in <span className="font-semibold text-indigo-600">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* OTP Verified Badge */}
              {otpStep === 'verified' && (
                <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Phone Verified</p>
                    <p className="text-[10px] text-emerald-500">+91 {formData.contactNumber}</p>
                  </div>
                </div>
              )}

              {/* OTP Error */}
              {otpError && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}
            </div>
            {/* ── End Phone + OTP Section ── */}

            {/* ── GST Verification Section ── */}
            <div className="rounded-xl border border-future-smoke bg-white/30 p-3 sm:p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-future-steel" />
                <span className="text-xs sm:text-sm font-semibold text-future-carbon">GST Verification</span>
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

            {/* Passwords */}
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

            {/* Submit Button */}
            <div className="pt-1 sm:pt-2">
              <button
                type="submit"
                disabled={isLoading || otpStep !== 'verified' || !gstVerified}
                className={`w-full flex items-center justify-center py-3 sm:py-4 px-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transform transition-all duration-300 min-h-[48px] touch-target
                  ${otpStep === 'verified' && gstVerified 
                    ? 'bg-future-graphite hover:bg-future-carbon text-white shadow-future-graphite/20 hover:shadow-future-graphite/30 hover:-translate-y-0.5' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                  disabled:opacity-70 disabled:cursor-not-allowed
                `}
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                  <>
                    Create Account <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
              {(otpStep !== 'verified' || !gstVerified) && (
                <p className="text-center text-[10px] text-future-steel mt-2">
                  {otpStep !== 'verified' && !gstVerified
                    ? 'Verify your mobile number and GST to enable account creation'
                    : otpStep !== 'verified'
                    ? 'Verify your mobile number to enable account creation'
                    : 'Verify your GST number to enable account creation'}
                </p>
              )}
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
