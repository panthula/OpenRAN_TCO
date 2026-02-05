'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-medium
    transition-all duration-200 rounded-lg relative overflow-hidden
    focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090c]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-amber-500 to-orange-500 text-[#08090c] font-semibold
      shadow-lg shadow-amber-500/20
      hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5
      active:translate-y-0
    `,
    secondary: `
      bg-[#232933] text-slate-100 border border-white/10
      hover:bg-[#2e3542] hover:border-amber-500/50
    `,
    ghost: `
      text-slate-400 bg-transparent
      hover:text-slate-100 hover:bg-[#181c25]
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white
      shadow-lg shadow-red-500/20
      hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-0.5
      active:translate-y-0
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shine overlay on hover */}
      <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

      {isLoading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
