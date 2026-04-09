import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="text-center max-w-lg mx-auto">
        {/* Animated 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-500 to-indigo-600 leading-none select-none opacity-20">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center float-animation shadow-lg shadow-brand-500/10">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-brand-500" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          Page Not Found
        </h2>
        <p className="text-slate-500 text-sm sm:text-base mb-8 leading-relaxed max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all duration-200 min-h-[48px] btn-shine"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 rounded-xl font-semibold text-sm border border-slate-300 hover:border-slate-400 transition-all duration-200 min-h-[48px]"
          >
            <Search className="w-4 h-4" />
            Search Companies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
