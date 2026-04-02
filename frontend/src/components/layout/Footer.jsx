import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { Linkedin, Instagram, Send, MapPin, Mail, Phone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatus('error');
      setMessage('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      // Mock API call to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
      setMessage('Successfully subscribed!');
      setEmail('');
      
      // Reset success message after 4 seconds
      setTimeout(() => {
        if (status !== 'error') {
          setStatus('idle');
          setMessage('');
        }
      }, 4000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <footer className="bg-[#020617] border-t border-white/5 pt-20 pb-10 text-white relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container-custom relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="space-y-6 flex flex-col">
            <div className="mb-2">
              <Logo variant="white" className="justify-start" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              The global standard for trust in the textile industry. Verify partners, assess risk, and trade with absolute confidence.
            </p>
            <div className="flex gap-4 pt-2">
              <a 
                href="https://twitter.com/texotrust" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Twitter (X)"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/20 transition-all duration-300"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
              </a>
              <a 
                href="https://linkedin.com/company/texotrust" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/20 transition-all duration-300"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com/texotrust" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/20 transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Platform</h4>
            <nav aria-label="Footer Platform Navigation">
              <ul className="space-y-4 text-sm text-gray-400">
                <li>
                  <Link to="/search" className="hover:text-brand-400 transition-colors duration-200 inline-block focus:outline-none focus:text-brand-400">Search Companies</Link>
                </li>
                <li>
                  <Link to="/search" className="hover:text-brand-400 transition-colors duration-200 inline-block focus:outline-none focus:text-brand-400">Write a Review</Link>
                </li>
                <li>
                  <Link to="/subscription" className="hover:text-brand-400 transition-colors duration-200 inline-block focus:outline-none focus:text-brand-400">Pricing Plans</Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-brand-400 transition-colors duration-200 inline-block focus:outline-none focus:text-brand-400">My Dashboard</Link>
                </li>
              </ul>
            </nav>
          </div>
          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start group">
                <MapPin className="w-5 h-5 mr-3 text-brand-500 shrink-0 group-hover:text-brand-400 transition-colors mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">101, Textile Market Tower,<br/>Ring Road, Surat, Gujarat</span>
              </li>
              <li className="flex items-center group">
                <Phone className="w-5 h-5 mr-3 text-brand-500 shrink-0 group-hover:text-brand-400 transition-colors" aria-hidden="true" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors duration-200 focus:outline-none focus:text-white" aria-label="Call +91 98765 43210">+91 98765 43210</a>
              </li>
              <li className="flex items-center group">
                <Mail className="w-5 h-5 mr-3 text-brand-500 shrink-0 group-hover:text-brand-400 transition-colors" aria-hidden="true" />
                <a href="mailto:support@texotrust.com" className="hover:text-white transition-colors duration-200 focus:outline-none focus:text-white" aria-label="Email support@texotrust.com">support@texotrust.com</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Get the latest market trends and credit updates directly to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="relative w-full" noValidate>
              <label htmlFor="email-subscribe" className="sr-only">Email address</label>
              <input 
                id="email-subscribe"
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="Enter your email" 
                disabled={status === 'loading'}
                className={`w-full bg-white/5 border ${status === 'error' ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-brand-500 focus:ring-brand-500'} rounded-lg py-3 px-4 pr-12 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all disabled:opacity-70`}
                aria-invalid={status === 'error'}
                aria-describedby={message ? "subscribe-message" : undefined}
              />
              <button 
                type="submit"
                disabled={status === 'loading'}
                aria-label="Subscribe to newsletter"
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center bg-brand-600 rounded-md text-white hover:bg-brand-500 transition-colors duration-200 disabled:opacity-70 disabled:hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 focus:ring-offset-[#020617]"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </form>
            
            {/* Feedback Message */}
            <div id="subscribe-message" aria-live="polite" className="mt-3 min-h-[24px]">
              {status === 'success' && (
                <p className="text-sm text-green-400 flex items-center transition-all duration-300">
                  <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
                  {message}
                </p>
              )}
              {status === 'error' && (
                <p className="text-sm text-red-400 flex items-center transition-all duration-300">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div className="text-center md:text-left">
            © {new Date().getFullYear()} TexoTrust. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors duration-200 focus:outline-none focus:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors duration-200 focus:outline-none focus:text-white">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-white transition-colors duration-200 focus:outline-none focus:text-white">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
