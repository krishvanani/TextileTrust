import React from 'react';

const Logo = ({ 
  className = "", 
  iconClassName = "h-8 w-8", 
  textClassName = "text-xl", 
  variant = "default", // default (colored), white, dark
  showText = true
}) => {
  
  // Variant Styles
  const getIconColor = () => {
    switch(variant) {
      case 'white': return "text-white";
      case 'dark': return "text-brand-600";
      default: return "text-brand-400"; // Default brand color
    }
  };

  const getTextColor = () => {
    switch(variant) {
      case 'white': return "text-white";
      case 'dark': return "text-future-midnight";
      default: return "text-white"; // Default to white for dark backgrounds
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative group flex items-center justify-center">
        <div className={`absolute inset-0 bg-brand-500/20 blur-md rounded-full scale-0 group-hover:scale-110 transition-transform duration-500`}></div>
        {/* Creative Textile 'T' SVG - Ribbon Style */}
        <svg 
          viewBox="0 0 40 40" 
          className={`${iconClassName} ${getIconColor()} relative z-10 transition-all duration-300 drop-shadow-[0_2px_8px_rgba(129,140,248,0.4)]`}
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
           {/* Top Ribbon - Elegant Wave */}
           <path d="M4 14C4 14 12 6 22 9C32 12 36 8 36 8C36 8 38 10 36 12C34 14 26 18 18 15C10 12 6 16 4 16V14Z" opacity="0.95" />
           
           {/* Vertical Ribbon - Flowing Down and Curve */}
           <path d="M22 10C22 10 26 12 24 20C22 28 20 32 16 34C14 35 12 34 12 32C12 32 14 32 16 30C18 28 20 22 20 14L22 10Z" opacity="1" />
           
           {/* Accent Highlight/Shadow */}
           <path d="M22 10C22 10 20 14 20 20" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold tracking-tight ${textClassName} ${getTextColor()}`}>
          TextileTrust
        </span>
      )}
    </div>
  );
};

export default Logo;
