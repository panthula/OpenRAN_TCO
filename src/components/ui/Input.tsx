'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3.5 py-2.5 rounded-lg
          bg-[#12151c] border border-white/10
          text-slate-100 placeholder-slate-500
          font-sans text-sm
          transition-all duration-200
          focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="text-xs text-slate-500">{helperText}</span>
      )}
    </div>
  );
}

interface NumberInputProps extends Omit<InputProps, 'type' | 'onChange'> {
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  ...props
}: NumberInputProps) {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
          onChange(val);
        }
      }}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
}
