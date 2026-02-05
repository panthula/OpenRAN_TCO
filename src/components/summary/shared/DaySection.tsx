'use client';

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BucketCategoryTable } from './BucketCategoryTable';
import type { FactDetail } from '@/lib/types';
import type { BucketGroup } from '@/lib/config/domain-summary-config';

interface DaySectionProps {
  day: 'day0' | 'day1' | 'day2';
  title: string;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  bucketGroups: BucketGroup[];
  factsByGroup: Record<string, FactDetail[]>;
  /** Generic day2 details when not using bucket groups */
  day2Details?: FactDetail[];
}

const DAY_COLORS = {
  day0: { text: 'text-cyan-400', subtotal: 'text-cyan-400' },
  day1: { text: 'text-purple-400', subtotal: 'text-purple-400' },
  day2: { text: 'text-amber-400', subtotal: 'text-amber-400' },
};

const DAY_TITLES = {
  day0: 'DAY 0 - DESIGN & PROCUREMENT',
  day1: 'DAY 1 - BUILD & INTEGRATION',
  day2: 'DAY 2 - OPERATIONS (Annual)',
};

export function DaySection({
  day,
  title,
  total,
  isExpanded,
  onToggle,
  bucketGroups,
  factsByGroup,
  day2Details,
}: DaySectionProps) {
  if (total <= 0) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const colors = DAY_COLORS[day];
  const displayTitle = title || DAY_TITLES[day];

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className={`w-4 h-4 ${colors.text}`} />
          ) : (
            <ChevronRight className={`w-4 h-4 ${colors.text}`} />
          )}
          <span className={`${colors.text} font-semibold`}>{displayTitle}</span>
        </div>
        <span className={`${colors.text} font-bold`}>
          {formatCurrency(total)}{day === 'day2' ? ' /yr' : ''}
        </span>
      </button>
      {isExpanded && (
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          {/* Render bucket groups */}
          {bucketGroups.map((group) => {
            const groupFacts = factsByGroup[group.key] || [];
            return (
              <BucketCategoryTable
                key={group.key}
                title={group.label}
                details={groupFacts}
                subtotalColor={colors.subtotal}
              />
            );
          })}
          {/* For day2, render generic details if provided and no bucket groups */}
          {day === 'day2' && bucketGroups.length === 0 && day2Details && day2Details.length > 0 && (
            <BucketCategoryTable
              title="Recurring Annual Costs"
              details={day2Details}
              subtotalColor={colors.subtotal}
            />
          )}
        </div>
      )}
    </div>
  );
}
