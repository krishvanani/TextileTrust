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
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";
  
  const variants = {
    primary: "bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-700 hover:to-brand-800 hover:shadow-brand-glow focus:ring-brand-500 border border-brand-700/50 shadow-lg shadow-brand-500/15 btn-shine",
    secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md focus:ring-slate-300 shadow-sm",
    ghost: "text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-transparent",
    outline: "border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400",
    glass: "glass text-slate-900 hover:bg-white hover:shadow-card-hover border-slate-200/60",
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
