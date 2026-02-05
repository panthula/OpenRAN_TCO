'use client';

import React from 'react';
import { getBucketLabel } from '@/lib/model/taxonomy';
import type { FactDetail } from '@/lib/types';

interface BucketCategoryTableProps {
  title: string;
  details: FactDetail[];
  subtotalColor?: string;
}

export function BucketCategoryTable({ title, details, subtotalColor = 'text-cyan-400' }: BucketCategoryTableProps) {
  if (details.length === 0) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDriverLabel = (driver: string, multiplier: number): string => {
    switch (driver) {
      case 'per_site':
        return `${multiplier.toLocaleString()} sites`;
      case 'per_du':
        return `${multiplier.toLocaleString()} DUs`;
      case 'per_cu':
        return `${multiplier.toLocaleString()} CUs`;
      case 'per_dc':
        return `${multiplier.toLocaleString()} DCs`;
      case 'per_server':
        return `${multiplier.toLocaleString()} servers`;
      case 'per_year':
        return '(annual)';
      case 'fixed':
        return '(fixed)';
      case 'per_year_deployment':
        return '(sum across years)';
      default:
        return `${multiplier.toLocaleString()}`;
    }
  };

  const subtotal = details.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="border-b border-gray-700 last:border-b-0">
      <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
        {title}
      </div>
      {details.map((detail, idx) => (
        <div key={`${detail.bucket}-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
          <span className="text-gray-300 flex items-center gap-2">
            <span className="text-gray-500">├─</span>
            {getBucketLabel(detail.bucket)}
          </span>
          <span className="text-gray-400 font-mono">
            {detail.driver === 'per_year_deployment' ? (
              <>
                <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                <span className="text-xs ml-1">(sum across years)</span>
              </>
            ) : (
              <>
                {formatCurrency(detail.unitCost)} × {getDriverLabel(detail.driver, detail.multiplier)} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
              </>
            )}
          </span>
        </div>
      ))}
      <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
        <span className="text-gray-400">Subtotal: <span className={`${subtotalColor} font-semibold`}>{formatCurrency(subtotal)}</span></span>
      </div>
    </div>
  );
}
