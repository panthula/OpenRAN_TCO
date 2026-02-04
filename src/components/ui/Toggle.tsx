'use client';

import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}: ToggleProps) {
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
  };

  const { track, thumb, translate } = sizes[size];

  return (
    <label
      className={`inline-flex items-center gap-3 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex shrink-0 ${track} rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#0a0e17]
          ${checked
            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
            : 'bg-gray-700'
          }
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block ${thumb} rounded-full bg-white shadow-lg
            transform transition-transform duration-200 ease-in-out
            ${checked ? translate : 'translate-x-0.5'}
            ${size === 'md' ? 'mt-0.5' : 'mt-0.5'}
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-gray-200">{label}</span>
          )}
          {description && (
            <span className="text-xs text-gray-400">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
