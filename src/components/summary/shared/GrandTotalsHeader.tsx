'use client';

import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface GrandTotalsHeaderProps {
  oneTimeTotal: number;
  annualTotal: number;
}

export function GrandTotalsHeader({ oneTimeTotal, annualTotal }: GrandTotalsHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-5 bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 rounded-xl border border-emerald-700/50">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">One-Time Total (Day 0 + Day 1)</span>
        </div>
        <p className="text-3xl font-bold text-emerald-400">{formatCurrency(oneTimeTotal)}</p>
      </div>
      <div className="p-5 bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-xl border border-amber-700/50">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium text-amber-300">Annual Run Rate (Day 2)</span>
        </div>
        <p className="text-3xl font-bold text-amber-400">{formatCurrency(annualTotal)} /yr</p>
      </div>
    </div>
  );
}
