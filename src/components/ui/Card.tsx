'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'gradient' | 'glow';
  glowColor?: 'amber' | 'success' | 'danger' | 'info';
}

export function Card({ children, className = '', variant = 'default', glowColor }: CardProps) {
  const variants = {
    default: `
      bg-gradient-to-br from-[#12151c] to-[#0d0f14]
      border border-white/[0.06]
    `,
    elevated: `
      bg-gradient-to-br from-[#181c25] to-[#12151c]
      border border-white/10
      shadow-xl shadow-black/20
    `,
    gradient: `
      bg-gradient-to-br from-[#181c25] to-[#12151c]
      border border-white/10
      shadow-lg
    `,
    glow: `
      bg-gradient-to-br from-[#12151c] to-[#0d0f14]
      border border-white/[0.06]
      shadow-lg
    `,
  };

  const glowColors = {
    amber: 'shadow-[0_0_20px_rgba(245,158,11,0.15),0_0_40px_rgba(245,158,11,0.05)] border-amber-500/20',
    success: 'shadow-[0_0_20px_rgba(34,197,94,0.15),0_0_40px_rgba(34,197,94,0.05)] border-green-500/20',
    danger: 'shadow-[0_0_20px_rgba(239,68,68,0.15),0_0_40px_rgba(239,68,68,0.05)] border-red-500/20',
    info: 'shadow-[0_0_20px_rgba(59,130,246,0.15),0_0_40px_rgba(59,130,246,0.05)] border-blue-500/20',
  };

  const glowClass = variant === 'glow' && glowColor ? glowColors[glowColor] : '';

  return (
    <div className={`
      rounded-xl p-6 relative overflow-hidden
      ${variants[variant]}
      ${glowClass}
      ${className}
    `}>
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function CardHeader({ title, description, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/[0.06]">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-serif text-slate-100 tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>;
}
