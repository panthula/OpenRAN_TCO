'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { DollarSign, Server, Radio, Cloud, ChevronDown, ChevronRight, Calendar, BarChart3 } from 'lucide-react';
import { YearlyCostBreakdown } from './YearlyCostBreakdown';
import { GrandTotalsHeader, DaySection, GrandTotalRollupTable } from './shared';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { type Domain, DomainLabels, type Bucket } from '@/lib/model/taxonomy';
import { applyAdjustmentsToFacts } from '@/lib/utils/apply-adjustments';
import { getDomainSummaryConfig, isBucketInGroup } from '@/lib/config/domain-summary-config';
import { computeNetworkCounts } from '@/lib/compute/multipliers';
import { sumYearValues } from '@/lib/utils/json-helpers';
import type { FactDetail, ArchetypeSummary } from '@/lib/types';

interface DomainDollarSummaryProps {
  domain: Domain;
  emptyText?: string;
}

export function DomainDollarSummary({ domain, emptyText }: DomainDollarSummaryProps) {
  const {
    currentVersion,
    inputFacts,
    siteArchetypes,
    adjustmentSets,
  } = useScenarioStore();

  // Get domain-specific configuration
  const config = getDomainSummaryConfig(domain);

  // Apply adjustments to input facts - memoized for performance
  const adjustedFacts = useMemo(() => {
    return applyAdjustmentsToFacts(inputFacts, adjustmentSets);
  }, [inputFacts, adjustmentSets]);

  // Track which archetypes are expanded
  const [expandedArchetypes, setExpandedArchetypes] = useState<Set<string>>(new Set());

  const toggleArchetype = (id: string) => {
    setExpandedArchetypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Track which day sections are expanded within each archetype
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDay = (archetypeKey: string, day: string) => {
    const key = `${archetypeKey}_${day}`;
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isDayExpanded = useCallback((archetypeKey: string, day: string) => {
    return expandedDays.has(`${archetypeKey}_${day}`);
  }, [expandedDays]);

  // Compute network counts using centralized utility
  const networkCounts = useMemo(() => {
    return computeNetworkCounts(siteArchetypes);
  }, [siteArchetypes]);

  // Get multiplier based on driver and scope
  const getMultiplier = useCallback((
    driver: string,
    scopeType: string,
    scopeId: string | null,
    bucket?: string
  ): number => {
    // Check bucket-specific overrides from config
    if (bucket) {
      if (config.fixedMultiplierBuckets.includes(bucket)) {
        return 1;
      }
      if (config.dcScopedBuckets.includes(bucket)) {
        return scopeId ? (networkCounts.dcsByScopeId[scopeId] || 0) : networkCounts.dcs;
      }
      if (config.duScaledBuckets.includes(bucket)) {
        return scopeId ? (networkCounts.dusByScopeId[scopeId] || 0) : networkCounts.dus;
      }
    }

    switch (driver) {
      case 'per_site':
        if (scopeType === 'site_archetype' && scopeId) {
          return networkCounts.sitesByScopeId[scopeId] || 0;
        }
        return networkCounts.sites;
      case 'per_cu':
        if (scopeType === 'site_archetype' && scopeId) {
          return networkCounts.cusByScopeId[scopeId] || 0;
        }
        return networkCounts.cus;
      case 'per_dc':
        if (scopeType === 'site_archetype' && scopeId) {
          return networkCounts.dcsByScopeId[scopeId] || 0;
        }
        return networkCounts.dcs;
      case 'per_server':
      case 'per_license_unit':
      case 'per_cluster':
      case 'per_rapp':
      case 'per_xapp':
      case 'per_integration':
      case 'fixed':
      case 'per_year':
      case 'per_year_deployment':
        return 1;
      default:
        return 1;
    }
  }, [networkCounts, config]);

  // Compute archetype summaries
  const archetypeSummaries = useMemo(() => {
    const domainFacts = adjustedFacts.filter(f => f.domain === domain);

    // Build a map from archetype ID -> SiteArchetype
    const archetypeMap: Record<string, { name: string; numSites: number; numCus: number; numDcs: number; deploymentYears: number }> = {};
    for (const arch of siteArchetypes) {
      archetypeMap[arch.id] = { name: arch.name, numSites: arch.numSites, numCus: arch.numCus, numDcs: arch.numDcs, deploymentYears: arch.deploymentYears || 1 };
    }

    // Group facts by scopeId (or 'network_global' if null)
    const factsByScopeId: Record<string, typeof domainFacts> = {};
    for (const fact of domainFacts) {
      const key = fact.scopeId || 'network_global';
      if (!factsByScopeId[key]) {
        factsByScopeId[key] = [];
      }
      factsByScopeId[key].push(fact);
    }

    // Build ArchetypeSummary for each scope
    const summaries: ArchetypeSummary[] = [];

    for (const [scopeKey, facts] of Object.entries(factsByScopeId)) {
      const isNetworkGlobal = scopeKey === 'network_global';
      const archInfo = isNetworkGlobal ? null : archetypeMap[scopeKey];

      // Skip orphaned scopes (scopeId doesn't match any archetype)
      if (!isNetworkGlobal && !archInfo) {
        continue;
      }

      const summary: ArchetypeSummary = {
        archetypeId: isNetworkGlobal ? null : scopeKey,
        archetypeName: isNetworkGlobal ? 'Network Global' : (archInfo?.name || 'Unknown'),
        numSites: archInfo?.numSites || 0,
        numCus: archInfo?.numCus || 0,
        numDcs: archInfo?.numDcs || 0,
        deploymentYears: archInfo?.deploymentYears || 1,
        day0: {},
        day1: {},
        day2: {},
        day0Total: 0,
        day1Total: 0,
        day2Total: 0,
        oneTimeTotal: 0,
        annualTotal: 0,
        day0Details: {
          siteHwBom: [],
          cuDcHwBom: [],
          siteSoftware: [],
          cuDcSoftware: [],
          services: [],
          ossHwBom: [],
          ossSoftware: [],
        },
        day1Details: {
          siteInstallation: [],
          cuInstallation: [],
          testing: [],
          integration: [],
          deploymentServices: [],
        },
        day2Details: [],
      };

      // Helper to create FactDetail
      const createFactDetail = (fact: typeof facts[0], scopeId: string | null): FactDetail => {
        const bucket = fact.bucket;
        let multiplier = getMultiplier(fact.driver, fact.scopeType, fact.scopeId, bucket);
        let driver = fact.driver;

        // Check for driver override from config
        if (config.bucketDriverOverrides?.[bucket]) {
          driver = config.bucketDriverOverrides[bucket];
        }

        // Override for fixed multiplier buckets
        if (config.fixedMultiplierBuckets.includes(bucket)) {
          multiplier = 1;
          driver = 'fixed';
        }

        // Override to use DC count for DC-scoped buckets
        if (config.dcScopedBuckets.includes(bucket)) {
          const dcCount = scopeId
            ? (networkCounts.dcsByScopeId[scopeId] || 0)
            : networkCounts.dcs;
          multiplier = dcCount;
          driver = 'per_dc';
        }

        return {
          bucket: bucket as Bucket,
          unitCost: fact.valueNumber,
          multiplier,
          total: fact.valueNumber * multiplier,
          driver,
        };
      };

      // Process each fact
      for (const fact of facts) {
        // Handle per_year_deployment specially
        if (fact.driver === 'per_year_deployment') {
          const total = sumYearValues(fact.valueJson);
          const factDetail: FactDetail = {
            bucket: fact.bucket as Bucket,
            unitCost: total,
            multiplier: 1,
            total: total,
            driver: 'per_year_deployment',
          };

          const dayKey = fact.day;
          if (dayKey === 'day1') {
            summary.day1['services'] = (summary.day1['services'] || 0) + total;
            summary.day1Total += total;
            summary.day1Details.deploymentServices.push(factDetail);
          }
          continue;
        }

        const factDetail = createFactDetail(fact, fact.scopeId);
        const layer = fact.layer;
        const dayKey = fact.day;

        if (dayKey === 'day0') {
          summary.day0[layer] = (summary.day0[layer] || 0) + factDetail.total;
          summary.day0Total += factDetail.total;

          // Categorize into Day 0 detail buckets using config
          const day0GroupKey = isBucketInGroup(fact.bucket, config.bucketGroups.day0);
          if (day0GroupKey) {
            // Map group key to the appropriate detail array
            const detailKey = day0GroupKey as keyof typeof summary.day0Details;
            if (summary.day0Details[detailKey]) {
              (summary.day0Details[detailKey] as FactDetail[]).push(factDetail);
            }
          }
        } else if (dayKey === 'day1') {
          summary.day1[layer] = (summary.day1[layer] || 0) + factDetail.total;
          summary.day1Total += factDetail.total;

          // Categorize into Day 1 detail buckets using config
          const day1GroupKey = isBucketInGroup(fact.bucket, config.bucketGroups.day1);
          if (day1GroupKey) {
            const detailKey = day1GroupKey as keyof typeof summary.day1Details;
            if (summary.day1Details[detailKey]) {
              (summary.day1Details[detailKey] as FactDetail[]).push(factDetail);
            }
          }
        } else if (dayKey === 'day2') {
          summary.day2[layer] = (summary.day2[layer] || 0) + factDetail.total;
          summary.day2Total += factDetail.total;
          summary.day2Details.push(factDetail);
        }
      }

      summary.oneTimeTotal = summary.day0Total + summary.day1Total;
      summary.annualTotal = summary.day2Total;

      // Only add if there are any costs
      if (summary.day0Total > 0 || summary.day1Total > 0 || summary.day2Total > 0) {
        summaries.push(summary);
      }
    }

    // Sort: archetypes first (alphabetically), then network_global at the end
    summaries.sort((a, b) => {
      if (a.archetypeId === null) return 1;
      if (b.archetypeId === null) return -1;
      return a.archetypeName.localeCompare(b.archetypeName);
    });

    return summaries;
  }, [adjustedFacts, siteArchetypes, domain, networkCounts, getMultiplier, config]);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    return archetypeSummaries.reduce(
      (acc, s) => ({
        day0: acc.day0 + s.day0Total,
        day1: acc.day1 + s.day1Total,
        day2: acc.day2 + s.day2Total,
        oneTime: acc.oneTime + s.oneTimeTotal,
        annual: acc.annual + s.annualTotal,
        sites: acc.sites + s.numSites,
        cus: acc.cus + s.numCus,
        dcs: acc.dcs + (s.numDcs || 0),
      }),
      { day0: 0, day1: 0, day2: 0, oneTime: 0, annual: 0, sites: 0, cus: 0, dcs: 0 }
    );
  }, [archetypeSummaries]);

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

  const domainColors = getDomainColors();

  // Helper to get facts by group key from day details
  const getFactsByGroup = (summary: ArchetypeSummary, day: 'day0' | 'day1' | 'day2'): Record<string, FactDetail[]> => {
    const result: Record<string, FactDetail[]> = {};
    const groups = config.bucketGroups[day];

    for (const group of groups) {
      if (day === 'day0') {
        const key = group.key as keyof typeof summary.day0Details;
        result[group.key] = (summary.day0Details[key] as FactDetail[]) || [];
      } else if (day === 'day1') {
        const key = group.key as keyof typeof summary.day1Details;
        result[group.key] = (summary.day1Details[key] as FactDetail[]) || [];
      } else {
        // Day2 uses the bucket groups from config to filter
        result[group.key] = summary.day2Details.filter(d => group.buckets.includes(d.bucket));
      }
    }
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Grand Totals Header */}
      <GrandTotalsHeader oneTimeTotal={grandTotals.oneTime} annualTotal={grandTotals.annual} />

      {/* Yearly Cost Breakdown */}
      {archetypeSummaries.length > 0 && (
        <Card>
          <CardHeader
            title="Yearly Cost Breakdown"
            description="Day 0/1/2 costs by year and archetype showing deployment phasing"
            action={
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <BarChart3 className="w-4 h-4" />
                <span>Click rows to expand</span>
              </div>
            }
          />
          <CardContent>
            <YearlyCostBreakdown
              domain={domain}
              inputFacts={inputFacts}
              siteArchetypes={siteArchetypes}
              adjustmentSets={adjustmentSets}
            />
          </CardContent>
        </Card>
      )}

      {/* Archetype Breakdown */}
      {archetypeSummaries.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 py-4 text-center">No costs entered for {DomainLabels[domain]}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Archetype Breakdown"
            description="Costs grouped by site archetype with Day 0, Day 1, and Day 2 breakdown"
          />
          <CardContent>
            <div className="space-y-4">
              {archetypeSummaries.map((summary) => {
                const archetypeKey = summary.archetypeId || 'network_global';
                const isExpanded = expandedArchetypes.has(archetypeKey);
                return (
                  <div key={archetypeKey} className="border border-gray-700 rounded-lg overflow-hidden mb-4">
                    {/* Collapsible Header */}
                    <button
                      onClick={() => toggleArchetype(archetypeKey)}
                      className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${domainColors.bg}`}>
                            {getDomainIcon()}
                          </div>
                          <span className="font-semibold text-gray-100">{summary.archetypeName.toUpperCase()}</span>
                          {summary.archetypeId && (
                            <span className="text-sm text-gray-400">
                              ({summary.numSites.toLocaleString()} sites, {summary.numCus.toLocaleString()} CUs)
                            </span>
                          )}
                          {summary.archetypeId && summary.deploymentYears > 1 && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                              <Calendar className="w-3 h-3" />
                              {summary.deploymentYears}Y rollout
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-400">One-Time: </span>
                          <span className="font-semibold text-emerald-400">{formatCurrency(summary.oneTimeTotal)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Annual: </span>
                          <span className="font-semibold text-amber-400">{formatCurrency(summary.annualTotal)} /yr</span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Content - Detailed Breakdown */}
                    {isExpanded && (
                      <div className="p-4 bg-gray-900/30 space-y-4">
                        {/* Day 0 */}
                        <DaySection
                          day="day0"
                          title="DAY 0 - DESIGN & PROCUREMENT"
                          total={summary.day0Total}
                          isExpanded={isDayExpanded(archetypeKey, 'day0')}
                          onToggle={() => toggleDay(archetypeKey, 'day0')}
                          bucketGroups={config.bucketGroups.day0}
                          factsByGroup={getFactsByGroup(summary, 'day0')}
                        />

                        {/* Day 1 */}
                        <DaySection
                          day="day1"
                          title="DAY 1 - BUILD & INTEGRATION"
                          total={summary.day1Total}
                          isExpanded={isDayExpanded(archetypeKey, 'day1')}
                          onToggle={() => toggleDay(archetypeKey, 'day1')}
                          bucketGroups={config.bucketGroups.day1}
                          factsByGroup={getFactsByGroup(summary, 'day1')}
                        />

                        {/* Day 2 */}
                        <DaySection
                          day="day2"
                          title="DAY 2 - OPERATIONS (Annual)"
                          total={summary.day2Total}
                          isExpanded={isDayExpanded(archetypeKey, 'day2')}
                          onToggle={() => toggleDay(archetypeKey, 'day2')}
                          bucketGroups={config.bucketGroups.day2}
                          factsByGroup={getFactsByGroup(summary, 'day2')}
                          day2Details={summary.day2Details}
                        />

                        {/* Summary Footer */}
                        <div className="mt-4 pt-4 border-t-2 border-gray-700 flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-400">ONE-TIME TOTAL (Day 0 + Day 1): </span>
                            <span className="text-emerald-400 font-bold text-lg">{formatCurrency(summary.oneTimeTotal)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-400">ANNUAL RUN RATE (Day 2): </span>
                            <span className="text-amber-400 font-bold text-lg">{formatCurrency(summary.annualTotal)} /yr</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grand Total Rollup Table */}
      {archetypeSummaries.length > 0 && (
        <GrandTotalRollupTable
          summaries={archetypeSummaries}
          grandTotals={grandTotals}
          showDcs={domain === 'cloud'}
        />
      )}
    </div>
  );
}
