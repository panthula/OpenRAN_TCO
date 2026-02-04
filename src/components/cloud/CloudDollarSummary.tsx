'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Cloud, DollarSign, TrendingUp, ChevronDown, ChevronRight, Calendar, BarChart3, Server } from 'lucide-react';
import { YearlyCostBreakdown } from '@/components/summary/YearlyCostBreakdown';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { getBucketLabel, type Bucket } from '@/lib/model/taxonomy';

// ============================================================================
// Cloud-Specific Bucket Groupings
// ============================================================================

// Day 0 - Platform Licenses (One-Time)
const CLOUD_PLATFORM_LICENSE_BUCKETS = ['cloud_native_platform', 'cloud_native_orchestrator'];

// Day 0 - Unit Licenses
const CLOUD_UNIT_LICENSE_BUCKETS = ['cloud_per_du_at_site', 'cloud_per_cu_server', 'cloud_per_oss_server', 'storage_licenses'];

// Day 0 - Cloud Design Services
const CLOUD_DESIGN_BUCKETS = ['cloud_design', 'cloud_architecture'];

// Day 1 - Cluster Services (per DC)
const CLOUD_CLUSTER_BUCKETS = ['cloud_deployment_services', 'cluster_bringup', 'cicd_pipeline_setup', 'observability_setup'];

// Day 1 - Deployment Services (per_year_deployment)
const CLOUD_DEPLOYMENT_SERVICE_BUCKETS = ['cloud_deployment_support', 'other_cloud_caas_support'];

// Day 2 - Platform Operations
const CLOUD_PLATFORM_OPS_BUCKETS = ['observability_ops', 'cicd_ops', 'security_ops', 'backup_dr'];

// Day 2 - License Support (uses same buckets as Day 0 licenses)
// CLOUD_PLATFORM_LICENSE_BUCKETS and CLOUD_UNIT_LICENSE_BUCKETS

// ============================================================================
// Types
// ============================================================================

interface FactDetail {
  bucket: Bucket;
  unitCost: number;
  multiplier: number;
  total: number;
  driver: string;
}

interface CloudArchetypeSummary {
  archetypeId: string | null;
  archetypeName: string;
  numSites: number;
  numCus: number;
  numDcs: number;
  deploymentYears: number;

  // Day 0 details (Cloud-specific)
  day0Details: {
    platformLicenses: FactDetail[];
    unitLicenses: FactDetail[];
    designServices: FactDetail[];
  };

  // Day 1 details (Cloud-specific)
  day1Details: {
    clusterServices: FactDetail[];
    deploymentServices: FactDetail[];
  };

  // Day 2 details (Cloud-specific)
  day2Details: {
    platformOps: FactDetail[];
    licenseSupport: FactDetail[];
  };

  // Totals
  day0Total: number;
  day1Total: number;
  day2Total: number;
  oneTimeTotal: number;
  annualTotal: number;
}

// ============================================================================
// Component
// ============================================================================

export function CloudDollarSummary() {
  const {
    currentVersion,
    inputFacts,
    siteArchetypes,
  } = useScenarioStore();

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

  // Compute network counts
  const networkCounts = useMemo(() => {
    const totalSites = siteArchetypes.reduce((sum, a) => sum + a.numSites, 0);
    const totalCus = siteArchetypes.reduce((sum, a) => sum + a.numCus, 0);
    const totalDcs = siteArchetypes.reduce((sum, a) => sum + a.numDcs, 0);
    const totalDus = siteArchetypes.reduce((sum, a) => sum + (a.numSites * (a.numDusPerSite || 1)), 0);

    const sitesByScopeId: Record<string, number> = {};
    const cusByScopeId: Record<string, number> = {};
    const dcsByScopeId: Record<string, number> = {};
    const dusByScopeId: Record<string, number> = {};

    for (const arch of siteArchetypes) {
      sitesByScopeId[arch.id] = arch.numSites;
      cusByScopeId[arch.id] = arch.numCus;
      dcsByScopeId[arch.id] = arch.numDcs;
      dusByScopeId[arch.id] = arch.numSites * (arch.numDusPerSite || 1);
    }

    return { totalSites, totalCus, totalDcs, totalDus, sitesByScopeId, cusByScopeId, dcsByScopeId, dusByScopeId };
  }, [siteArchetypes]);

  // Get multiplier based on driver and scope
  const getMultiplier = useCallback((
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
        if (scopeType === 'site_archetype' && scopeId) {
          return networkCounts.dcsByScopeId[scopeId] || 0;
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
      case 'per_year_deployment':
        return 1;
      default:
        return 1;
    }
  }, [networkCounts]);

  // Get bucket-specific multiplier override for Cloud domain
  // Returns { multiplier, driver } if bucket needs override, or null to use default getMultiplier
  const getCloudBucketMultiplier = useCallback((
    bucket: string,
    scopeType: string,
    scopeId: string | null
  ): { multiplier: number; driver: string } | null => {
    // Platform Licenses - always fixed (×1)
    if (CLOUD_PLATFORM_LICENSE_BUCKETS.includes(bucket)) {
      return { multiplier: 1, driver: 'fixed' };
    }

    // Unit Licenses - based on bucket name
    switch (bucket) {
      case 'cloud_per_du_at_site':
        // Per DU - uses DU count (sites × numDusPerSite)
        const duCount = scopeType === 'site_archetype' && scopeId
          ? networkCounts.dusByScopeId[scopeId] || 0
          : networkCounts.totalDus;
        return { multiplier: duCount, driver: 'per_du' };

      case 'cloud_per_cu_server':
        // Per CU
        const cuCount = scopeType === 'site_archetype' && scopeId
          ? networkCounts.cusByScopeId[scopeId] || 0
          : networkCounts.totalCus;
        return { multiplier: cuCount, driver: 'per_cu' };

      case 'cloud_per_oss_server':
        // OSS Server count not available - use 0
        return { multiplier: 0, driver: 'per_server' };

      case 'storage_licenses':
        // Storage server count not available - use 0
        return { multiplier: 0, driver: 'per_server' };

      default:
        // Fall back to original driver-based logic
        return null;
    }
  }, [networkCounts]);

  // Compute archetype summaries for Cloud domain
  const archetypeSummaries = useMemo(() => {
    // Filter to Cloud domain only
    const cloudFacts = inputFacts.filter(f => f.domain === 'cloud');

    // Build a map from archetype ID -> SiteArchetype
    const archetypeMap: Record<string, { name: string; numSites: number; numCus: number; numDcs: number; deploymentYears: number }> = {};
    for (const arch of siteArchetypes) {
      archetypeMap[arch.id] = {
        name: arch.name,
        numSites: arch.numSites,
        numCus: arch.numCus,
        numDcs: arch.numDcs,
        deploymentYears: arch.deploymentYears || 1
      };
    }

    // Group facts by scopeId (or 'network_global' if null)
    const factsByScopeId: Record<string, typeof cloudFacts> = {};
    for (const fact of cloudFacts) {
      const key = fact.scopeId || 'network_global';
      if (!factsByScopeId[key]) {
        factsByScopeId[key] = [];
      }
      factsByScopeId[key].push(fact);
    }

    // Build CloudArchetypeSummary for each scope
    const summaries: CloudArchetypeSummary[] = [];

    for (const [scopeKey, facts] of Object.entries(factsByScopeId)) {
      const isNetworkGlobal = scopeKey === 'network_global';
      const archInfo = isNetworkGlobal ? null : archetypeMap[scopeKey];

      // Skip orphaned scopes (scopeId doesn't match any archetype)
      if (!isNetworkGlobal && !archInfo) {
        continue;
      }

      const summary: CloudArchetypeSummary = {
        archetypeId: isNetworkGlobal ? null : scopeKey,
        archetypeName: isNetworkGlobal ? 'Network Global' : (archInfo?.name || 'Unknown'),
        numSites: archInfo?.numSites || 0,
        numCus: archInfo?.numCus || 0,
        numDcs: archInfo?.numDcs || 0,
        deploymentYears: archInfo?.deploymentYears || 1,
        day0Details: {
          platformLicenses: [],
          unitLicenses: [],
          designServices: [],
        },
        day1Details: {
          clusterServices: [],
          deploymentServices: [],
        },
        day2Details: {
          platformOps: [],
          licenseSupport: [],
        },
        day0Total: 0,
        day1Total: 0,
        day2Total: 0,
        oneTimeTotal: 0,
        annualTotal: 0,
      };

      // Helper to create FactDetail with correct multiplier
      const createFactDetail = (fact: typeof facts[0]): FactDetail => {
        // Try bucket-specific override first
        const bucketOverride = getCloudBucketMultiplier(fact.bucket, fact.scopeType, fact.scopeId);

        if (bucketOverride) {
          return {
            bucket: fact.bucket as Bucket,
            unitCost: fact.valueNumber,
            multiplier: bucketOverride.multiplier,
            total: fact.valueNumber * bucketOverride.multiplier,
            driver: bucketOverride.driver,
          };
        }

        // Fall back to driver-based multiplier
        const multiplier = getMultiplier(fact.driver, fact.scopeType, fact.scopeId);
        return {
          bucket: fact.bucket as Bucket,
          unitCost: fact.valueNumber,
          multiplier,
          total: fact.valueNumber * multiplier,
          driver: fact.driver,
        };
      };

      // Helper function to sum year values from valueJson for per_year_deployment
      const sumYearValues = (valueJson: string | null): number => {
        if (!valueJson) return 0;
        try {
          const yearValues = JSON.parse(valueJson);
          let total = 0;
          for (let y = 0; y < 5; y++) {  // Default to 5 TCO years
            total += yearValues[`year_${y}`] ?? 0;
          }
          return total;
        } catch {
          return 0;
        }
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

          if (fact.day === 'day1' && CLOUD_DEPLOYMENT_SERVICE_BUCKETS.includes(fact.bucket)) {
            summary.day1Total += total;
            summary.day1Details.deploymentServices.push(factDetail);
          }
          continue;
        }

        const factDetail = createFactDetail(fact);
        const dayKey = fact.day;

        if (dayKey === 'day0') {
          summary.day0Total += factDetail.total;

          // Categorize into Cloud Day 0 detail buckets
          if (CLOUD_PLATFORM_LICENSE_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.platformLicenses.push(factDetail);
          } else if (CLOUD_UNIT_LICENSE_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.unitLicenses.push(factDetail);
          } else if (CLOUD_DESIGN_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.designServices.push(factDetail);
          }
        } else if (dayKey === 'day1') {
          summary.day1Total += factDetail.total;

          // Categorize into Cloud Day 1 detail buckets
          if (CLOUD_CLUSTER_BUCKETS.includes(fact.bucket)) {
            summary.day1Details.clusterServices.push(factDetail);
          }
        } else if (dayKey === 'day2') {
          summary.day2Total += factDetail.total;

          // Categorize into Cloud Day 2 detail buckets
          if (CLOUD_PLATFORM_OPS_BUCKETS.includes(fact.bucket)) {
            summary.day2Details.platformOps.push(factDetail);
          } else if (CLOUD_PLATFORM_LICENSE_BUCKETS.includes(fact.bucket) ||
                     CLOUD_UNIT_LICENSE_BUCKETS.includes(fact.bucket)) {
            summary.day2Details.licenseSupport.push(factDetail);
          }
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
  }, [inputFacts, siteArchetypes, getMultiplier, getCloudBucketMultiplier]);

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
        dcs: acc.dcs + s.numDcs,
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

  // Get driver display label (unit only, no count)
  const getDriverLabel = (driver: string): string => {
    switch (driver) {
      case 'per_site':
        return 'sites';
      case 'per_du':
        return 'DUs';
      case 'per_cu':
        return 'CUs';
      case 'per_dc':
        return 'DCs';
      case 'per_server':
        return 'servers';
      case 'per_year':
        return '(annual)';
      case 'fixed':
        return '(fixed)';
      case 'per_year_deployment':
        return '(sum across years)';
      default:
        return '';
    }
  };

  if (!currentVersion) {
    return (
      <div className="text-center py-12 text-gray-500">
        Select or create a scenario to view the Cloud summary
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grand Totals Header */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 rounded-xl border border-emerald-700/50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">One-Time Total (Day 0 + Day 1)</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(grandTotals.oneTime)}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-xl border border-amber-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Annual Run Rate (Day 2)</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{formatCurrency(grandTotals.annual)} /yr</p>
        </div>
      </div>

      {/* Deployment Counts */}
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-5 h-5 text-sky-400" />
          <span className="text-sm font-semibold text-gray-200">DEPLOYMENT COUNTS</span>
        </div>
        <div className={`grid ${networkCounts.totalDus > networkCounts.totalSites ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
          <div className="text-center">
            <p className="text-2xl font-bold text-sky-400">{networkCounts.totalDcs.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Total DCs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-sky-400">{networkCounts.totalSites.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Total Sites</p>
          </div>
          {networkCounts.totalDus > networkCounts.totalSites && (
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{networkCounts.totalDus.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total DUs</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-2xl font-bold text-sky-400">{networkCounts.totalCus.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Total CUs</p>
          </div>
        </div>
      </div>

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
              domain="cloud"
              inputFacts={inputFacts}
              siteArchetypes={siteArchetypes}
            />
          </CardContent>
        </Card>
      )}

      {/* Archetype Breakdown */}
      {archetypeSummaries.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 py-4 text-center">No costs entered for Cloud</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Cloud Cost Breakdown"
            description="Costs grouped by scope with Day 0, Day 1, and Day 2 breakdown"
          />
          <CardContent>
            <div className="space-y-4">
              {archetypeSummaries.map((summary) => {
                const archetypeKey = summary.archetypeId || 'network_global';
                const isExpanded = expandedArchetypes.has(archetypeKey);
                return renderArchetypeCard(summary, archetypeKey, isExpanded);
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grand Total Rollup Table */}
      {archetypeSummaries.length > 0 && (
        <Card>
          <CardHeader
            title="Grand Total Rollup"
            description="Summary across all scopes"
          />
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Scope</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">DCs</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Sites</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">CUs</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Day 0</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Day 1</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Day 2 (/yr)</th>
                  </tr>
                </thead>
                <tbody>
                  {archetypeSummaries.map((summary) => (
                    <tr key={summary.archetypeId || 'network_global'} className="border-t border-gray-800">
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-200">{summary.archetypeName}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-300">
                          {summary.archetypeId ? summary.numDcs.toLocaleString() : '-'}
                        </span>
                      </td>
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
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-100">{grandTotals.dcs.toLocaleString()}</span>
                    </td>
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
      )}
    </div>
  );

  // ============================================================================
  // Render Helper Functions
  // ============================================================================

  function renderArchetypeCard(summary: CloudArchetypeSummary, archetypeKey: string, isExpanded: boolean) {
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
              <div className="p-1.5 rounded bg-sky-500/20">
                <Cloud className="w-5 h-5 text-sky-400" />
              </div>
              <span className="font-semibold text-gray-100">{summary.archetypeName.toUpperCase()}</span>
              {summary.archetypeId && (
                <span className="text-sm text-gray-400">
                  ({summary.numDcs.toLocaleString()} DCs, {summary.numSites.toLocaleString()} sites, {summary.numCus.toLocaleString()} CUs)
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
            {/* DAY 0 - LICENSING & DESIGN */}
            {summary.day0Total > 0 && (
              <div>
                <button
                  onClick={() => toggleDay(archetypeKey, 'day0')}
                  className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    {isDayExpanded(archetypeKey, 'day0') ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-cyan-400" />
                    )}
                    <span className="text-cyan-400 font-semibold">DAY 0 - LICENSING & DESIGN</span>
                  </div>
                  <span className="text-cyan-400 font-bold">{formatCurrency(summary.day0Total)}</span>
                </button>
                {isDayExpanded(archetypeKey, 'day0') && (
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    {/* Platform Licenses (One-Time) */}
                    {summary.day0Details.platformLicenses.length > 0 && (
                      <div className="border-b border-gray-700">
                        <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                          Platform Licenses (One-Time)
                        </div>
                        {summary.day0Details.platformLicenses.map((detail, idx) => (
                          <div key={`platform-lic-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                            <span className="text-gray-300 flex items-center gap-2">
                              <span className="text-gray-500">├─</span>
                              {getBucketLabel(detail.bucket)}
                            </span>
                            <span className="text-gray-400 font-mono">
                              {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {getDriverLabel(detail.driver)} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                            </span>
                          </div>
                        ))}
                        <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                          <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.platformLicenses.reduce((sum, d) => sum + d.total, 0))}</span></span>
                        </div>
                      </div>
                    )}

                    {/* Unit Licenses */}
                    {summary.day0Details.unitLicenses.length > 0 && (
                      <div className="border-b border-gray-700">
                        <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                          Unit Licenses
                        </div>
                        {summary.day0Details.unitLicenses.map((detail, idx) => (
                          <div key={`unit-lic-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                            <span className="text-gray-300 flex items-center gap-2">
                              <span className="text-gray-500">├─</span>
                              {getBucketLabel(detail.bucket)}
                            </span>
                            <span className="text-gray-400 font-mono">
                              {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {getDriverLabel(detail.driver)} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                            </span>
                          </div>
                        ))}
                        <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                          <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.unitLicenses.reduce((sum, d) => sum + d.total, 0))}</span></span>
                        </div>
                      </div>
                    )}

                    {/* Cloud Design Services */}
                    {summary.day0Details.designServices.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                          Cloud Design Services
                        </div>
                        {summary.day0Details.designServices.map((detail, idx) => (
                          <div key={`design-svc-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                            <span className="text-gray-300 flex items-center gap-2">
                              <span className="text-gray-500">├─</span>
                              {getBucketLabel(detail.bucket)}
                            </span>
                            <span className="text-gray-400 font-mono">
                              {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {getDriverLabel(detail.driver)} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                            </span>
                          </div>
                        ))}
                        <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                          <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.designServices.reduce((sum, d) => sum + d.total, 0))}</span></span>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* DAY 1 - DEPLOYMENT & INTEGRATION */}
            {summary.day1Total > 0 && (
              <div>
                <button
                  onClick={() => toggleDay(archetypeKey, 'day1')}
                  className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    {isDayExpanded(archetypeKey, 'day1') ? (
                      <ChevronDown className="w-4 h-4 text-purple-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-purple-400" />
                    )}
                    <span className="text-purple-400 font-semibold">DAY 1 - DEPLOYMENT & INTEGRATION</span>
                  </div>
                  <span className="text-purple-400 font-bold">{formatCurrency(summary.day1Total)}</span>
                </button>
                {isDayExpanded(archetypeKey, 'day1') && (
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    {/* Cluster Services (per DC) */}
                    {summary.day1Details.clusterServices.length > 0 && (
                      <div className="border-b border-gray-700">
                        <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                          Cluster Services (per DC)
                        </div>
                        {summary.day1Details.clusterServices.map((detail, idx) => (
                          <div key={`cluster-svc-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                            <span className="text-gray-300 flex items-center gap-2">
                              <span className="text-gray-500">├─</span>
                              {getBucketLabel(detail.bucket)}
                            </span>
                            <span className="text-gray-400 font-mono">
                              {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {getDriverLabel(detail.driver)} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                            </span>
                          </div>
                        ))}
                        <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                          <span className="text-gray-400">Subtotal: <span className="text-purple-400 font-semibold">{formatCurrency(summary.day1Details.clusterServices.reduce((sum, d) => sum + d.total, 0))}</span></span>
                        </div>
                      </div>
                    )}

                    {/* Deployment Services (Network-wide) */}
                    {summary.day1Details.deploymentServices.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                          Deployment Services (Network-wide)
                        </div>
                        {summary.day1Details.deploymentServices.map((detail, idx) => (
                          <div key={`deploy-svc-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                            <span className="text-gray-300 flex items-center gap-2">
                              <span className="text-gray-500">├─</span>
                              {getBucketLabel(detail.bucket)}
                            </span>
                            <span className="text-gray-400 font-mono">
                              <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                              <span className="text-xs ml-1">(sum across years)</span>
                            </span>
                          </div>
                        ))}
                        <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                          <span className="text-gray-400">Subtotal: <span className="text-purple-400 font-semibold">{formatCurrency(summary.day1Details.deploymentServices.reduce((sum, d) => sum + d.total, 0))}</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DAY 2 - OPERATIONS (Annual) */}
            {summary.day2Total > 0 && (
              <div>
                <button
                  onClick={() => toggleDay(archetypeKey, 'day2')}
                  className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    {isDayExpanded(archetypeKey, 'day2') ? (
                      <ChevronDown className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-amber-400 font-semibold">DAY 2 - OPERATIONS (Annual)</span>
                  </div>
                  <span className="text-amber-400 font-bold">{formatCurrency(summary.day2Total)} /yr</span>
                </button>
                {isDayExpanded(archetypeKey, 'day2') && (
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    {/* Platform Operations */}
                    {summary.day2Details.platformOps.length > 0 && (
                      <div className="border-b border-gray-700">
                        <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                          Platform Operations
                        </div>
                        {summary.day2Details.platformOps.map((detail, idx) => (
                          <div key={`platform-ops-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                            <span className="text-gray-300 flex items-center gap-2">
                              <span className="text-gray-500">├─</span>
                              {getBucketLabel(detail.bucket)}
                            </span>
                            <span className="text-gray-400 font-mono">
                              {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {getDriverLabel(detail.driver)} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                            </span>
                          </div>
                        ))}
                        <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                          <span className="text-gray-400">Subtotal: <span className="text-amber-400 font-semibold">{formatCurrency(summary.day2Details.platformOps.reduce((sum, d) => sum + d.total, 0))}</span></span>
                        </div>
                      </div>
                    )}

                    {/* License Support */}
                    {summary.day2Details.licenseSupport.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                          License Support
                        </div>
                        {summary.day2Details.licenseSupport.map((detail, idx) => (
                          <div key={`lic-support-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                            <span className="text-gray-300 flex items-center gap-2">
                              <span className="text-gray-500">├─</span>
                              {getBucketLabel(detail.bucket)}
                            </span>
                            <span className="text-gray-400 font-mono">
                              {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {getDriverLabel(detail.driver)} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                            </span>
                          </div>
                        ))}
                        <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                          <span className="text-gray-400">Subtotal: <span className="text-amber-400 font-semibold">{formatCurrency(summary.day2Details.licenseSupport.reduce((sum, d) => sum + d.total, 0))}</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
  }
}
