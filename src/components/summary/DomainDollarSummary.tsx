'use client';

import React, { useMemo } from 'react';
import { DollarSign, Building2, Server, Radio, TrendingUp, Cloud } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { type Domain, DomainLabels } from '@/lib/model/taxonomy';

interface SummaryRow {
  label: string;
  perUnitValue: number;
  unitLabel: string;
  multiplier: number;
  networkTotal: number;
}

interface DaySummary {
  label: string;
  description: string;
  rows: SummaryRow[];
  total: number;
}

interface DomainDollarSummaryProps {
  domain: Domain;
  emptyText?: string;
}

export function DomainDollarSummary({ domain, emptyText }: DomainDollarSummaryProps) {
  const {
    currentVersion,
    inputFacts,
    siteArchetypes,
    dcTypes,
  } = useScenarioStore();

  // Compute network counts
  const networkCounts = useMemo(() => {
    const totalSites = siteArchetypes.reduce((sum, a) => sum + a.numSites, 0);
    const totalCus = siteArchetypes.reduce((sum, a) => sum + a.numCus, 0);
    const totalDcs = dcTypes.reduce((sum, d) => sum + d.numDcs, 0);

    const sitesByScopeId: Record<string, number> = {};
    const cusByScopeId: Record<string, number> = {};
    const dcCountsByScopeId: Record<string, number> = {};

    for (const arch of siteArchetypes) {
      sitesByScopeId[arch.id] = arch.numSites;
      cusByScopeId[arch.id] = arch.numCus;
    }

    for (const dc of dcTypes) {
      dcCountsByScopeId[dc.id] = dc.numDcs;
    }

    return { totalSites, totalCus, totalDcs, sitesByScopeId, cusByScopeId, dcCountsByScopeId };
  }, [siteArchetypes, dcTypes]);

  // Get multiplier based on driver and scope
  const getMultiplier = (
    driver: string,
    scopeType: string,
    scopeId: string | null
  ): number => {
    switch (driver) {
      case 'per_site':
        if (scopeType === 'site_archetype' && scopeId) {
          return networkCounts.sitesByScopeId[scopeId] || 0;
        }
        return networkCounts.totalSites;
      case 'per_cu':
        if (scopeType === 'site_archetype' && scopeId) {
          return networkCounts.cusByScopeId[scopeId] || 0;
        }
        return networkCounts.totalCus;
      case 'per_dc':
        if (scopeType === 'dc_type' && scopeId) {
          return networkCounts.dcCountsByScopeId[scopeId] || 0;
        }
        return networkCounts.totalDcs;
      case 'per_server':
      case 'per_license_unit':
      case 'per_cluster':
      case 'per_rapp':
      case 'per_xapp':
      case 'per_integration':
      case 'fixed':
      case 'per_year':
        return 1;
      default:
        return 1;
    }
  };

  // Compute summaries for each day
  const daySummaries = useMemo(() => {
    const domainFacts = inputFacts.filter(f => f.domain === domain);

    const computeDaySummary = (day: string, label: string, description: string): DaySummary => {
      const dayFacts = domainFacts.filter(f => f.day === day);

      // Group by driver type for breakdown
      const byDriver: Record<string, { perUnit: number; networkTotal: number; unitLabel: string; multiplier: number }> = {};

      for (const fact of dayFacts) {
        const multiplier = getMultiplier(fact.driver, fact.scopeType, fact.scopeId);
        const networkTotal = fact.valueNumber * multiplier;

        const driverKey = fact.driver;
        if (!byDriver[driverKey]) {
          byDriver[driverKey] = { perUnit: 0, networkTotal: 0, unitLabel: getUnitLabel(fact.driver), multiplier: 0 };
        }
        byDriver[driverKey].perUnit += fact.valueNumber;
        byDriver[driverKey].networkTotal += networkTotal;
        byDriver[driverKey].multiplier = getMultiplierCount(fact.driver);
      }

      const rows: SummaryRow[] = Object.entries(byDriver).map(([driver, data]) => ({
        label: getDriverLabel(driver),
        perUnitValue: data.perUnit,
        unitLabel: data.unitLabel,
        multiplier: data.multiplier,
        networkTotal: data.networkTotal,
      }));

      const total = rows.reduce((sum, r) => sum + r.networkTotal, 0);

      return { label, description, rows, total };
    };

    const getUnitLabel = (driver: string): string => {
      switch (driver) {
        case 'per_site': return '/ site';
        case 'per_cu': return '/ CU';
        case 'per_dc': return '/ DC';
        case 'per_server': return '/ server';
        case 'per_license_unit': return '/ license';
        case 'per_cluster': return '/ cluster';
        case 'per_rapp': return '/ rApp';
        case 'per_xapp': return '/ xApp';
        case 'per_integration': return '/ integration';
        case 'per_year': return '/ year';
        case 'fixed': return '(fixed)';
        default: return '';
      }
    };

    const getMultiplierCount = (driver: string): number => {
      switch (driver) {
        case 'per_site': return networkCounts.totalSites;
        case 'per_cu': return networkCounts.totalCus;
        case 'per_dc': return networkCounts.totalDcs;
        default: return 1;
      }
    };

    const getDriverLabel = (driver: string): string => {
      switch (driver) {
        case 'per_site': return 'Per-Site Costs';
        case 'per_cu': return 'Per-CU Costs';
        case 'per_dc': return 'Per-DC Costs';
        case 'per_server': return 'Per-Server Costs';
        case 'per_license_unit': return 'Per-License Costs';
        case 'per_cluster': return 'Per-Cluster Costs';
        case 'per_rapp': return 'Per-rApp Costs';
        case 'per_xapp': return 'Per-xApp Costs';
        case 'per_integration': return 'Per-Integration Costs';
        case 'per_year': return 'Annual Costs';
        case 'fixed': return 'Fixed Costs';
        default: return driver;
      }
    };

    return {
      day0: computeDaySummary('day0', 'Day 0', 'One-time procurement & planning'),
      day1: computeDaySummary('day1', 'Day 1', 'One-time build & integration'),
      day2: computeDaySummary('day2', 'Day 2', 'Annual run-rate'),
    };
  }, [inputFacts, networkCounts, domain]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get domain-specific icon
  const getDomainIcon = () => {
    switch (domain) {
      case 'ran':
        return <Radio className="w-5 h-5 text-rose-400" />;
      case 'cloud':
        return <Cloud className="w-5 h-5 text-sky-400" />;
      case 'oss':
        return <Server className="w-5 h-5 text-emerald-400" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get domain-specific colors
  const getDomainColors = () => {
    switch (domain) {
      case 'ran':
        return { bg: 'bg-rose-500/20', text: 'text-rose-400' };
      case 'cloud':
        return { bg: 'bg-sky-500/20', text: 'text-sky-400' };
      case 'oss':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    }
  };

  if (!currentVersion) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyText || `Select or create a scenario to view the ${DomainLabels[domain]} summary`}
      </div>
    );
  }

  const grandTotalOneTime = daySummaries.day0.total + daySummaries.day1.total;
  const domainColors = getDomainColors();

  return (
    <div className="space-y-6">
      {/* Network Counts Header */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className={`p-2 rounded-lg ${domainColors.bg}`}>
            {getDomainIcon()}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Sites</p>
            <p className="text-xl font-bold text-gray-100">{networkCounts.totalSites.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Server className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total CUs</p>
            <p className="text-xl font-bold text-gray-100">{networkCounts.totalCus.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Building2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total DCs</p>
            <p className="text-xl font-bold text-gray-100">{networkCounts.totalDcs.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Grand Totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 rounded-xl border border-emerald-700/50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">One-Time Total (Day 0 + Day 1)</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(grandTotalOneTime)}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-xl border border-amber-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Annual Run-Rate (Day 2)</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{formatCurrency(daySummaries.day2.total)}</p>
        </div>
      </div>

      {/* Day Breakdowns */}
      {[daySummaries.day0, daySummaries.day1, daySummaries.day2].map((daySummary) => (
        <Card key={daySummary.label}>
          <CardHeader
            title={`${daySummary.label} - ${daySummary.description}`}
            description={`Network Total: ${formatCurrency(daySummary.total)}`}
          />
          <CardContent>
            {daySummary.rows.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No costs entered for {daySummary.label}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Cost Category</th>
                      <th className="text-right">Per-Unit Value</th>
                      <th className="text-center">x</th>
                      <th className="text-right">Count</th>
                      <th className="text-right">Network Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daySummary.rows.map((row) => (
                      <tr key={row.label}>
                        <td>
                          <span className="text-sm text-gray-200">{row.label}</span>
                        </td>
                        <td className="text-right">
                          <span className="text-sm text-gray-300">
                            {formatCurrency(row.perUnitValue)} <span className="text-gray-500">{row.unitLabel}</span>
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="text-xs text-gray-500">×</span>
                        </td>
                        <td className="text-right">
                          <span className="text-sm font-medium text-gray-300">{row.multiplier.toLocaleString()}</span>
                        </td>
                        <td className="text-right">
                          <span className="text-sm font-semibold text-cyan-400">{formatCurrency(row.networkTotal)}</span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-900/40">
                      <td colSpan={4} className="text-right">
                        <span className="text-sm font-semibold text-gray-300">Total</span>
                      </td>
                      <td className="text-right">
                        <span className="text-sm font-bold text-emerald-400">{formatCurrency(daySummary.total)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
