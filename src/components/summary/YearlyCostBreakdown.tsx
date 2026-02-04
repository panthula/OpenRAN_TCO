'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { type Domain } from '@/lib/model/taxonomy';
import { computeYearlyBreakdown, type YearlySummary } from '@/lib/utils/yearly-breakdown';
import { type AdjustmentSet } from '@/lib/utils/apply-adjustments';

// Types from scenario store
interface DeploymentYear {
  id?: string;
  archetypeId?: string;
  yearIndex: number;
  sitesDeployed: number;
  cusDeployed: number;
  dcsDeployed: number;
}

interface SiteArchetype {
  id: string;
  scenarioVersionId: string;
  name: string;
  numSites: number;
  numCus: number;
  numDcs: number;
  numDusPerSite: number;
  description: string | null;
  deploymentYears: number;
  deploymentSchedule: DeploymentYear[];
}

interface InputFact {
  id: string;
  scenarioVersionId: string;
  day: string;
  domain: string;
  layer: string;
  bucket: string;
  scopeType: string;
  scopeId: string | null;
  driver: string;
  valueNumber: number;
  valueJson: string | null;
  unit: string;
  currency: string;
  notes: string | null;
  licenseModel: string | null;
  spreadYears: number | null;
}

interface YearlyCostBreakdownProps {
  domain: Domain;
  inputFacts: InputFact[];
  siteArchetypes: SiteArchetype[];
  tcoYears?: number;
  adjustmentSets?: AdjustmentSet[];
}

export function YearlyCostBreakdown({
  domain,
  inputFacts,
  siteArchetypes,
  tcoYears = 5,
  adjustmentSets,
}: YearlyCostBreakdownProps) {
  // Track which years are expanded
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([0])); // Year 0 expanded by default

  const toggleYear = (yearIndex: number) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(yearIndex)) {
        newSet.delete(yearIndex);
      } else {
        newSet.add(yearIndex);
      }
      return newSet;
    });
  };

  // Compute the yearly breakdown
  const breakdown = useMemo(() => {
    return computeYearlyBreakdown(inputFacts, siteArchetypes, domain, tcoYears, adjustmentSets);
  }, [inputFacts, siteArchetypes, domain, tcoYears, adjustmentSets]);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Get the max cumulative sites for a year (for display)
  const getYearCumulativeSites = (year: YearlySummary): number => {
    return Math.max(...year.archetypes.map(a => a.cumulativeSites), 0);
  };

  // Get total deployed sites for a year
  const getYearDeployedSites = (year: YearlySummary): number => {
    // Sum only archetype sites (not network_global which would double count)
    return year.archetypes
      .filter(a => a.archetypeId !== null)
      .reduce((sum, a) => sum + a.sitesDeployedThisYear, 0);
  };

  // Check if there are any costs
  if (breakdown.grandTotal.total === 0 && breakdown.grandTotal.sites === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No yearly cost data available. Add cost inputs and deployment schedules to see the breakdown.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Table Header */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800/70">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300 w-16">Year</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Archetype</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-300 w-24">Sites</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-cyan-400 w-28">Day 0</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-purple-400 w-28">Day 1</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-amber-400 w-28">Day 2</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-300 w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.years.map((year) => {
              const isExpanded = expandedYears.has(year.yearIndex);
              const deployedSites = getYearDeployedSites(year);
              const hasDeployments = deployedSites > 0 || year.totalCost > 0;

              // Skip years with no activity
              if (!hasDeployments && year.yearIndex > 0) {
                return null;
              }

              return (
                <React.Fragment key={year.yearIndex}>
                  {/* Year Summary Row (Collapsible Header) */}
                  <tr
                    className="border-t border-gray-700 bg-gray-800/40 hover:bg-gray-800/60 cursor-pointer transition-colors"
                    onClick={() => toggleYear(year.yearIndex)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-semibold text-gray-100">Y{year.yearIndex + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium text-gray-200">Year {year.yearIndex + 1} Total</span>
                        {deployedSites > 0 && (
                          <span className="text-xs text-gray-500">
                            (+{deployedSites} sites deployed)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-300">
                        {getYearCumulativeSites(year).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-cyan-400">{formatCurrency(year.totalDay0)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-purple-400">{formatCurrency(year.totalDay1)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-amber-400">{formatCurrency(year.totalDay2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-100">{formatCurrency(year.totalCost)}</span>
                    </td>
                  </tr>

                  {/* Expanded Archetype Detail Rows */}
                  {isExpanded && year.archetypes.map((arch) => (
                    <tr
                      key={`${year.yearIndex}-${arch.archetypeId || 'global'}`}
                      className="border-t border-gray-800/50 bg-gray-900/30"
                    >
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2 pl-4">
                          <span className="text-gray-500">├─</span>
                          <span className="text-sm text-gray-300">{arch.archetypeName}</span>
                          {arch.sitesDeployedThisYear > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">
                              +{arch.sitesDeployedThisYear}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-sm text-gray-400">
                          {arch.archetypeId ? arch.cumulativeSites.toLocaleString() : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-sm ${arch.day0 > 0 ? 'text-cyan-300' : 'text-gray-600'}`}>
                          {arch.day0 > 0 ? formatCurrency(arch.day0) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-sm ${arch.day1 > 0 ? 'text-purple-300' : 'text-gray-600'}`}>
                          {arch.day1 > 0 ? formatCurrency(arch.day1) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-sm ${arch.day2 > 0 ? 'text-amber-300' : 'text-gray-600'}`}>
                          {arch.day2 > 0 ? formatCurrency(arch.day2) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-sm text-gray-400">{formatCurrency(arch.total)}</span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {/* Grand Total Row */}
            <tr className="border-t-2 border-gray-600 bg-gray-800/70">
              <td className="px-4 py-3" colSpan={2}>
                <span className="text-sm font-bold text-gray-100">GRAND TOTAL</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-gray-100">
                  {breakdown.grandTotal.sites.toLocaleString()}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-cyan-400">{formatCurrency(breakdown.grandTotal.day0)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-purple-400">{formatCurrency(breakdown.grandTotal.day1)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-amber-400">{formatCurrency(breakdown.grandTotal.day2)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(breakdown.grandTotal.total)}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 flex flex-wrap gap-4 justify-end">
        <div className="px-3 py-2 bg-cyan-900/30 rounded-lg border border-cyan-700/50">
          <span className="text-xs text-cyan-300">Day 0 (Procurement): </span>
          <span className="text-sm font-bold text-cyan-400">{formatCurrency(breakdown.grandTotal.day0)}</span>
        </div>
        <div className="px-3 py-2 bg-purple-900/30 rounded-lg border border-purple-700/50">
          <span className="text-xs text-purple-300">Day 1 (Installation): </span>
          <span className="text-sm font-bold text-purple-400">{formatCurrency(breakdown.grandTotal.day1)}</span>
        </div>
        <div className="px-3 py-2 bg-amber-900/30 rounded-lg border border-amber-700/50">
          <span className="text-xs text-amber-300">Day 2 (Operations): </span>
          <span className="text-sm font-bold text-amber-400">{formatCurrency(breakdown.grandTotal.day2)}</span>
        </div>
      </div>
    </div>
  );
}
