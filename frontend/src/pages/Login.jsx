import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader, Eye, EyeOff } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import LiquidEther from '../components/effects/liquid';
import Logo from '../components/ui/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setIsLoading(true);
    
    const result = await login(email, password);
    
    setIsLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      const msg = result.message || '';
      if (msg.includes('User not found')) {
         setEmailError('Invalid email');
         // No generic error if specific error exists
      } else if (msg.includes('Invalid password')) {
         setPasswordError('Invalid password');
      } else {
         setError(msg || 'Invalid email or password');
      }
    }
  };

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
             Bank-Grade Security
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight text-white drop-shadow-xl">
            Verify Trust.<br/>Build Connections.
          </h1>
          <p className="text-brand-100 text-lg leading-relaxed mb-10 font-light">
            Access the largest registry of verified textile traders and manufacturers. Make informed decisions with real-time data.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-all duration-300">
              <div className="text-3xl font-bold mb-1 text-white">10k+</div>
              <div className="text-brand-200 text-sm">Verified Companies</div>
            </div>
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-all duration-300">
              <div className="text-3xl font-bold mb-1 text-white">1M+</div>
              <div className="text-brand-200 text-sm">Monthly Searches</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Unique Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-16 relative pt-20 sm:pt-24 lg:pt-28 overflow-hidden">
        {/* Mobile Background Decor */}
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-brand-500/20 blur-[80px] lg:hidden pointer-events-none orb-float-1"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-600/20 blur-[80px] lg:hidden pointer-events-none orb-float-2"></div>
        
        {/* Link removed - handled by Navbar */}
        
        <div className="w-full max-w-md space-y-6 sm:space-y-8 glass p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl relative z-10 gradient-border-card">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-4 sm:mb-6 flex justify-center">
                <Logo variant="dark" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-future-carbon tracking-tight text-glow">Welcome back</h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-future-steel">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
               {error && (
                <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs sm:text-sm flex items-center animate-shake">
                  <div className="w-1 h-4 bg-red-500 rounded mr-2 sm:mr-3"></div>
                  {error}
                </div>
              )}
            
              <div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-future-steel group-focus-within:text-future-carbon transition-colors">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    className={`block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/50 border rounded-xl text-future-carbon placeholder-future-steel focus:outline-none focus:ring-2 input-glow transition-all duration-300 text-sm sm:text-base min-h-[48px] ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-future-smoke focus:border-future-mist focus:ring-future-mist/20'}`}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    required
                  />
                </div>
                {emailError && <p className="mt-1 text-xs sm:text-sm text-red-500 font-medium pl-3 sm:pl-4 animate-pulse">{emailError}</p>}
              </div>

              <div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-future-steel group-focus-within:text-future-carbon transition-colors">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className={`block w-full pl-10 sm:pl-12 pr-12 py-3 sm:py-4 bg-white/50 border rounded-xl text-future-carbon placeholder-future-steel focus:outline-none focus:ring-2 input-glow transition-all duration-300 text-sm sm:text-base min-h-[48px] ${passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-future-smoke focus:border-future-mist focus:ring-future-mist/20'}`}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
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
                {passwordError && <p className="mt-1 text-xs sm:text-sm text-red-500 font-medium pl-3 sm:pl-4 animate-pulse">{passwordError}</p>}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-future-graphite focus:ring-future-mist border-future-smoke rounded" />
                <span className="ml-2 text-future-steel">Remember for 30 days</span>
              </label>
              <a href="#" className="font-medium text-future-graphite hover:text-future-carbon hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 sm:py-4 px-4 bg-future-graphite hover:bg-future-carbon text-white rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-future-graphite/20 hover:shadow-future-graphite/30 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed min-h-[48px] touch-target"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-future-steel text-xs sm:text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-future-graphite hover:text-future-carbon hover:underline">
              Create free account
            </Link>
          </p>
          
          <div className="relative">
             <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-future-smoke"></div>
             </div>
             <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-future-steel">Secure & Encrypted</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
