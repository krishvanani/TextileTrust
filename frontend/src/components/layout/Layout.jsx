import React from 'react';
import Navbar from './Navbar';
import Logo from '../ui/Logo';
import ScrollToTopButton from '../ui/ScrollToTopButton';
import { Linkedin, Facebook, Instagram, Send, MapPin, Mail, Phone } from 'lucide-react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-300">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <ScrollToTopButton />
      <footer className="bg-[#020617] border-t border-white/5 pt-20 pb-10 text-white relative overflow-hidden">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="space-y-6">
              <div className="mb-4">
                <Logo variant="white" className="justify-start" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                The global standard for trust in the textile industry. Verify partners, assess risk, and trade with absolute confidence.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-600 hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300 group">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-600 hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-600 hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="footer-link hover:text-brand-400 transition-colors w-fit">Features</a></li>
                <li><a href="#" className="footer-link hover:text-brand-400 transition-colors w-fit">Pricing Plans</a></li>
                <li><a href="#" className="footer-link hover:text-brand-400 transition-colors w-fit">API Documentation</a></li>
                <li><a href="#" className="footer-link hover:text-brand-400 transition-colors w-fit">Success Stories</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 text-brand-500 shrink-0" />
                  <span>101, Textile Market Tower,<br/>Ring Road, Surat, Gujarat</span>
                </li>
                <li className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-brand-500 shrink-0" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-brand-500 shrink-0" />
                  <span>support@textiletrust.com</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Stay Updated</h4>
              <p className="text-gray-400 text-sm mb-4">
                Get the latest market trends and credit updates directly to your inbox.
              </p>
              <form className="relative">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 input-glow transition-all autofill-dark"
                />
                <button 
                  type="button"
                  className="absolute right-1.5 top-1.5 p-2 bg-brand-600 rounded-md text-white hover:bg-brand-500 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <div>
              © {new Date().getFullYear()} TextileTrust. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="footer-link hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="footer-link hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="footer-link hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
