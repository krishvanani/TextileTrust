import React from 'react';

const Input = ({ 
  label, 
  id, 
  type = 'text', 
  placeholder, 
  className = '', 
  error,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-future-carbon mb-2 ml-1"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`
          appearance-none block w-full px-4 py-3.5
          bg-future-silver/50 border border-future-mist 
          rounded-xl text-future-midnight
          placeholder-future-steel
          shadow-inner
          transition-all duration-300
          focus:outline-none focus:bg-white focus:ring-4 focus:ring-future-accent/10 focus:border-future-accent/50
          hover:bg-white hover:border-future-smoke
          text-sm
          disabled:bg-future-silver disabled:text-future-steel
          ${error ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : ''}
          ${className}
        `}
        placeholder={placeholder}
        {...props}
      />
      {error && (
        <p className="mt-1.5 ml-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
