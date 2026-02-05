'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import type { ArchetypeSummary } from '@/lib/types';

interface GrandTotalRollupTableProps {
  summaries: ArchetypeSummary[];
  grandTotals: {
    day0: number;
    day1: number;
    day2: number;
    oneTime: number;
    annual: number;
    sites: number;
    cus: number;
    dcs?: number;
  };
  showDcs?: boolean;
}

export function GrandTotalRollupTable({ summaries, grandTotals, showDcs = false }: GrandTotalRollupTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader
        title="Grand Total Rollup"
        description="Summary across all archetypes"
      />
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Archetype</th>
                {showDcs && (
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">DCs</th>
                )}
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Sites</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">CUs</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Day 0</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Day 1</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Day 2 (/yr)</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((summary) => (
                <tr key={summary.archetypeId || 'network_global'} className="border-t border-gray-800">
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-200">{summary.archetypeName}</span>
                  </td>
                  {showDcs && (
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-300">
                        {summary.archetypeId ? (summary.numDcs || 0).toLocaleString() : '-'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-300">
                      {summary.archetypeId ? summary.numSites.toLocaleString() : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-300">
                      {summary.archetypeId ? summary.numCus.toLocaleString() : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-300">{formatCurrency(summary.day0Total)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-300">{formatCurrency(summary.day1Total)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-300">{formatCurrency(summary.day2Total)}</span>
                  </td>
                </tr>
              ))}
              {/* Grand Total Row */}
              <tr className="border-t-2 border-gray-600 bg-gray-800/50">
                <td className="px-4 py-3">
                  <span className="text-sm font-bold text-gray-100">TOTAL</span>
                </td>
                {showDcs && (
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-gray-100">{(grandTotals.dcs || 0).toLocaleString()}</span>
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-gray-100">{grandTotals.sites.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-gray-100">{grandTotals.cus.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(grandTotals.day0)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(grandTotals.day1)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-amber-400">{formatCurrency(grandTotals.day2)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Final Summary */}
        <div className="mt-4 flex justify-end gap-8">
          <div className="p-3 bg-emerald-900/30 rounded-lg border border-emerald-700/50">
            <span className="text-sm text-emerald-300">One-Time: </span>
            <span className="text-lg font-bold text-emerald-400">{formatCurrency(grandTotals.oneTime)}</span>
          </div>
          <div className="p-3 bg-amber-900/30 rounded-lg border border-amber-700/50">
            <span className="text-sm text-amber-300">Annual Run Rate: </span>
            <span className="text-lg font-bold text-amber-400">{formatCurrency(grandTotals.annual)} /yr</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
