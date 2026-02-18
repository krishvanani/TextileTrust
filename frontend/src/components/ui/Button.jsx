import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  to, 
  onClick,
  type = 'button',
  fullWidth = false,
  disabled = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-future-carbon to-future-midnight text-white hover:opacity-90 hover:shadow-xl hover:shadow-brand-500/20 hover:scale-[1.02] focus:ring-future-midnight border border-transparent shadow-lg shadow-brand-500/10 btn-shine",
    secondary: "bg-white text-future-carbon border border-future-mist hover:bg-future-snow hover:border-future-smoke hover:shadow-md focus:ring-future-mist shadow-sm",
    ghost: "text-future-graphite hover:text-future-midnight hover:bg-future-silver/50 bg-transparent",
    outline: "border border-future-mist text-future-carbon hover:bg-future-silver/30 hover:border-future-smoke",
    glass: "glass text-future-midnight hover:bg-white/80 hover:shadow-glow border-white/50",
  };

  const sizes = "px-6 py-3";
  const widthClass = fullWidth ? "w-full" : "";

  const classes = `${baseStyles} ${variants[variant]} ${sizes} ${widthClass} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
