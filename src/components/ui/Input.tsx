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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 rounded-lg
          bg-gray-800/50 border border-gray-700
          text-gray-100 placeholder-gray-500
          transition-all duration-200
          focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
      {helperText && !error && (
        <span className="text-xs text-gray-500">{helperText}</span>
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

