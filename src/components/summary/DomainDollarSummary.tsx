'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { DollarSign, Server, Radio, TrendingUp, Cloud, ChevronDown, ChevronRight, Calendar, BarChart3 } from 'lucide-react';
import { YearlyCostBreakdown } from './YearlyCostBreakdown';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { type Domain, DomainLabels, getBucketLabel, type Bucket } from '@/lib/model/taxonomy';
import { applyAdjustmentsToFacts } from '@/lib/utils/apply-adjustments';

// Bucket groupings for detailed breakdown - Day 0
const SITE_HW_BOM_BUCKETS = ['du_server', 'radios', 'antennas', 'cell_site_router',
  'gps_equipment', 'power_systems', 'outdoor_infrastructure', 'ancillary_and_passive', 'other_ran_site'];
const CU_DC_HW_BOM_BUCKETS = ['cu_server', 'switches_tor_oob', 'iptx_equipment', 'rack_accessories', 'other_ran_cu'];
const SITE_SOFTWARE_BUCKETS = ['du_software_per_site', 'ru_software_per_site'];
const CU_DC_SOFTWARE_BUCKETS = ['cu_software_per_dc', '3pp_licenses_per_dc', 'other_ran_software'];

// OSS Day 0 Hardware BoM (network_global scope)
const OSS_HW_BOM_BUCKETS = ['site_mgmt_servers', 'intelligent_ops_servers', 'platform_apps_servers',
  'cnp_platform_servers', 'cns_platform_servers', 'other_oss_servers'];

// OSS Day 0 Software (network_global scope)
const OSS_SOFTWARE_BUCKETS = ['site_manager', 'netpulse', 'inventory_manager', 'fault_monitoring',
  'performance_monitoring', 'configuration_manager', 'service_desk', 'network_navigator',
  'smo_orchestrator', 'non_rt_ric', 'near_rt_ric', 'rapps_license', 'xapps_license',
  'ai_platform_license', 'other_oss_software'];

// Day 0 Services (Network Planning) - all domains
const DAY0_RAN_SERVICES_BUCKETS = ['rf_survey', 'rf_planning', 'rf_design', 'interop_testing', 'ip_planning', 'other_ran_planning'];
const DAY0_CLOUD_SERVICES_BUCKETS = ['cloud_design', 'cloud_architecture'];
const DAY0_OSS_SERVICES_BUCKETS = ['oss_dimensioning', 'oss_planning'];
const DAY0_SERVICES_BUCKETS = [...DAY0_RAN_SERVICES_BUCKETS, ...DAY0_CLOUD_SERVICES_BUCKETS, ...DAY0_OSS_SERVICES_BUCKETS];

// Day 1 Deployment Services (per_year_deployment driver)
// These buckets use per_year_deployment driver and store values in valueJson
// RAN: ran_engineering_support, core_engineering_support, ip_transport_support, product_support
// Cloud: cloud_deployment_support, other_cloud_caas_support
// OSS: oss_deployment_support, rapp_development_support, oss_integration_support

// Bucket groupings for detailed breakdown - Day 1
const SITE_INSTALLATION_BUCKETS = ['site_installation', 'du_config', 'iptx_config'];
const CU_INSTALLATION_BUCKETS = ['racks_cu_pdu_tor_install', 'all_iptx_config'];
const TESTING_BUCKETS = ['site_acceptance_testing', 'cluster_acceptance_testing',
  'network_acceptance_testing', 'drive_tests', 'security_validation'];
const INTEGRATION_BUCKETS = ['site_integration', 'core_integration', 'other_integration'];

// Buckets that should always have multiplier = 1 (fixed cost, not scaled)
const FIXED_MULTIPLIER_BUCKETS = [
  // Testing - all except site_acceptance_testing
  'cluster_acceptance_testing',
  'network_acceptance_testing',
  'drive_tests',
  'security_validation',
  // Integration - all except site_integration
  'core_integration',
  'other_integration',
];

// Buckets that should use DC count as multiplier (regardless of stored driver)
const DC_SCOPED_BUCKETS = [
  // Hardware (per DC)
  ...CU_DC_HW_BOM_BUCKETS,
  // Software Licenses (per DC)
  ...CU_DC_SOFTWARE_BUCKETS,
  // Installation (per DC)
  ...CU_INSTALLATION_BUCKETS,
];

interface FactDetail {
  bucket: Bucket;
  unitCost: number;
  multiplier: number;
  total: number;
  driver: string;
}

interface ArchetypeSummary {
  archetypeId: string | null;      // null for network_global
  archetypeName: string;
  numSites: number;
  numCus: number;
  deploymentYears: number;         // Number of years for phased deployment

  // Costs by layer for each day
  day0: Record<string, number>;    // layer -> total cost
  day1: Record<string, number>;
  day2: Record<string, number>;

  // Subtotals
  day0Total: number;
  day1Total: number;
  day2Total: number;
  oneTimeTotal: number;            // day0 + day1
  annualTotal: number;             // day2

  // Detailed breakdown by category
  day0Details: {
    siteHwBom: FactDetail[];
    cuDcHwBom: FactDetail[];
    siteSoftware: FactDetail[];
    cuDcSoftware: FactDetail[];
    services: FactDetail[];
    ossHwBom: FactDetail[];
    ossSoftware: FactDetail[];
  };
  day1Details: {
    siteInstallation: FactDetail[];
    cuInstallation: FactDetail[];
    testing: FactDetail[];
    integration: FactDetail[];
    deploymentServices: FactDetail[];
  };
  day2Details: FactDetail[];
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
    adjustmentSets,
  } = useScenarioStore();

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
  // Key format: `${archetypeId}_${day}` e.g., "network_global_day0"
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
        // Use archetype's numDcs for per_dc driver
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

  // Compute archetype summaries
  const archetypeSummaries = useMemo(() => {
    const domainFacts = adjustedFacts.filter(f => f.domain === domain);

    // Build a map from archetype ID -> SiteArchetype
    const archetypeMap: Record<string, { name: string; numSites: number; numCus: number; deploymentYears: number }> = {};
    for (const arch of siteArchetypes) {
      archetypeMap[arch.id] = { name: arch.name, numSites: arch.numSites, numCus: arch.numCus, deploymentYears: arch.deploymentYears || 1 };
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
      const createFactDetail = (fact: typeof facts[0], multiplier: number, scopeId: string | null): FactDetail => {
        // Override multiplier to 1 for specific buckets
        if (FIXED_MULTIPLIER_BUCKETS.includes(fact.bucket)) {
          return {
            bucket: fact.bucket as Bucket,
            unitCost: fact.valueNumber,
            multiplier: 1,
            total: fact.valueNumber * 1,
            driver: 'fixed',
          };
        }

        // Override to use DC count for DC-scoped buckets
        if (DC_SCOPED_BUCKETS.includes(fact.bucket)) {
          const dcCount = scopeId
            ? (networkCounts.dcsByScopeId[scopeId] || 0)
            : networkCounts.totalDcs;
          return {
            bucket: fact.bucket as Bucket,
            unitCost: fact.valueNumber,
            multiplier: dcCount,
            total: fact.valueNumber * dcCount,
            driver: 'per_dc',
          };
        }

        // Default behavior
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
        const multiplier = getMultiplier(fact.driver, fact.scopeType, fact.scopeId);

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

        const factDetail = createFactDetail(fact, multiplier, fact.scopeId);

        const layer = fact.layer;
        const dayKey = fact.day;

        if (dayKey === 'day0') {
          summary.day0[layer] = (summary.day0[layer] || 0) + factDetail.total;
          summary.day0Total += factDetail.total;

          // Categorize into Day 0 detail buckets
          if (SITE_HW_BOM_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.siteHwBom.push(factDetail);
          } else if (CU_DC_HW_BOM_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.cuDcHwBom.push(factDetail);
          } else if (SITE_SOFTWARE_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.siteSoftware.push(factDetail);
          } else if (CU_DC_SOFTWARE_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.cuDcSoftware.push(factDetail);
          } else if (DAY0_SERVICES_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.services.push(factDetail);
          } else if (OSS_HW_BOM_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.ossHwBom.push(factDetail);
          } else if (OSS_SOFTWARE_BUCKETS.includes(fact.bucket)) {
            summary.day0Details.ossSoftware.push(factDetail);
          }
        } else if (dayKey === 'day1') {
          summary.day1[layer] = (summary.day1[layer] || 0) + factDetail.total;
          summary.day1Total += factDetail.total;

          // Categorize into Day 1 detail buckets
          if (SITE_INSTALLATION_BUCKETS.includes(fact.bucket)) {
            summary.day1Details.siteInstallation.push(factDetail);
          } else if (CU_INSTALLATION_BUCKETS.includes(fact.bucket)) {
            summary.day1Details.cuInstallation.push(factDetail);
          } else if (TESTING_BUCKETS.includes(fact.bucket)) {
            summary.day1Details.testing.push(factDetail);
          } else if (INTEGRATION_BUCKETS.includes(fact.bucket)) {
            summary.day1Details.integration.push(factDetail);
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
  }, [adjustedFacts, siteArchetypes, domain, networkCounts, getMultiplier]);

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
      }),
      { day0: 0, day1: 0, day2: 0, oneTime: 0, annual: 0, sites: 0, cus: 0 }
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
            description="Summary across all archetypes"
          />
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Archetype</th>
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

  // Extracted render function for archetype cards (hoisted, can be defined after return)
  function renderArchetypeCard(summary: ArchetypeSummary, archetypeKey: string, isExpanded: boolean) {
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
                        {/* DAY 0 - DESIGN & PROCUREMENT */}
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
                                <span className="text-cyan-400 font-semibold">DAY 0 - DESIGN & PROCUREMENT</span>
                              </div>
                              <span className="text-cyan-400 font-bold">{formatCurrency(summary.day0Total)}</span>
                            </button>
                            {isDayExpanded(archetypeKey, 'day0') && (
                            <div className="border border-gray-700 rounded-lg overflow-hidden">
                              {/* Site HW BoM */}
                              {summary.day0Details.siteHwBom.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    Hardware BoM (Site)
                                  </div>
                                  {summary.day0Details.siteHwBom.map((detail, idx) => (
                                    <div key={`site-hw-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)}{detail.driver === 'per_site' ? '/site' : ''} × {detail.multiplier.toLocaleString()} {detail.driver === 'per_site' ? 'sites' : detail.driver === 'fixed' ? '(fixed)' : ''} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.siteHwBom.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* CU/DC HW BoM */}
                              {summary.day0Details.cuDcHwBom.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    Hardware (per DC)
                                  </div>
                                  {summary.day0Details.cuDcHwBom.map((detail, idx) => (
                                    <div key={`cu-hw-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {detail.driver === 'per_dc' ? 'DCs' : detail.driver === 'per_cu' ? 'CUs' : '(fixed)'} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.cuDcHwBom.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* Site Software */}
                              {summary.day0Details.siteSoftware.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    Software Licenses (Site)
                                  </div>
                                  {summary.day0Details.siteSoftware.map((detail, idx) => (
                                    <div key={`site-sw-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)}/site × {detail.multiplier.toLocaleString()} sites = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.siteSoftware.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* CU/DC Software */}
                              {summary.day0Details.cuDcSoftware.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    Software Licenses (per DC)
                                  </div>
                                  {summary.day0Details.cuDcSoftware.map((detail, idx) => (
                                    <div key={`cu-sw-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {detail.driver === 'per_dc' ? 'DCs' : '(fixed)'} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.cuDcSoftware.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* OSS Hardware BoM */}
                              {summary.day0Details.ossHwBom.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    OSS Hardware BoM
                                  </div>
                                  {summary.day0Details.ossHwBom.map((detail, idx) => (
                                    <div key={`oss-hw-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} (servers) = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.ossHwBom.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* OSS Modules SW Pricing */}
                              {summary.day0Details.ossSoftware.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    OSS Modules SW Pricing
                                  </div>
                                  {summary.day0Details.ossSoftware.map((detail, idx) => (
                                    <div key={`oss-sw-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} (licenses) = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.ossSoftware.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* Day 0 Services (Network Planning) */}
                              {summary.day0Details.services.length > 0 && (
                                <div>
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    Network Planning Services
                                  </div>
                                  {summary.day0Details.services.map((detail, idx) => (
                                    <div key={`day0-svc-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} (fixed) = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-cyan-400 font-semibold">{formatCurrency(summary.day0Details.services.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}
                            </div>
                            )}
                          </div>
                        )}

                        {/* DAY 1 - BUILD & INTEGRATION */}
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
                                <span className="text-purple-400 font-semibold">DAY 1 - BUILD & INTEGRATION</span>
                              </div>
                              <span className="text-purple-400 font-bold">{formatCurrency(summary.day1Total)}</span>
                            </button>
                            {isDayExpanded(archetypeKey, 'day1') && (
                            <div className="border border-gray-700 rounded-lg overflow-hidden">
                              {/* Site Installation */}
                              {summary.day1Details.siteInstallation.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    Installation (Site)
                                  </div>
                                  {summary.day1Details.siteInstallation.map((detail, idx) => (
                                    <div key={`site-inst-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)}/site × {detail.multiplier.toLocaleString()} sites = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-purple-400 font-semibold">{formatCurrency(summary.day1Details.siteInstallation.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* CU Installation */}
                              {summary.day1Details.cuInstallation.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    Installation (per DC)
                                  </div>
                                  {summary.day1Details.cuInstallation.map((detail, idx) => (
                                    <div key={`cu-inst-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {detail.driver === 'per_dc' ? 'DCs' : detail.driver === 'per_cu' ? 'CUs' : detail.driver === 'per_site' ? 'sites' : '(fixed)'} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-purple-400 font-semibold">{formatCurrency(summary.day1Details.cuInstallation.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* Testing & Acceptance */}
                              {summary.day1Details.testing.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    Testing & Acceptance
                                  </div>
                                  {summary.day1Details.testing.map((detail, idx) => (
                                    <div key={`test-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {detail.driver === 'per_site' ? 'sites' : ''} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-purple-400 font-semibold">{formatCurrency(summary.day1Details.testing.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* Integration */}
                              {summary.day1Details.integration.length > 0 && (
                                <div className="border-b border-gray-700">
                                  <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                    Integration
                                  </div>
                                  {summary.day1Details.integration.map((detail, idx) => (
                                    <div key={`integ-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                      <span className="text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">├─</span>
                                        {getBucketLabel(detail.bucket)}
                                      </span>
                                      <span className="text-gray-400 font-mono">
                                        {formatCurrency(detail.unitCost)} × {detail.multiplier.toLocaleString()} {detail.driver === 'per_site' ? 'sites' : ''} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                      </span>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 flex justify-end text-sm border-t border-gray-700 bg-gray-800/30">
                                    <span className="text-gray-400">Subtotal: <span className="text-purple-400 font-semibold">{formatCurrency(summary.day1Details.integration.reduce((sum, d) => sum + d.total, 0))}</span></span>
                                  </div>
                                </div>
                              )}

                              {/* Deployment Services */}
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
                              <div className="px-4 py-2 bg-gray-800/50 text-sm font-medium text-gray-300">
                                Recurring Annual Costs
                              </div>
                              {summary.day2Details.map((detail, idx) => (
                                <div key={`day2-${idx}`} className="px-4 py-2 flex items-center justify-between text-sm border-t border-gray-800">
                                  <span className="text-gray-300 flex items-center gap-2">
                                    <span className="text-gray-500">├─</span>
                                    {getBucketLabel(detail.bucket)}
                                  </span>
                                  <span className="text-gray-400 font-mono">
                                    {formatCurrency(detail.unitCost)}{detail.driver === 'per_site' ? '/site' : detail.driver === 'per_year' ? '/yr' : ''} × {detail.multiplier.toLocaleString()} {detail.driver === 'per_site' ? 'sites' : detail.driver === 'per_year' ? '(annual)' : '(fixed)'} = <span className="text-gray-200">{formatCurrency(detail.total)}</span>
                                  </span>
                                </div>
                              ))}
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
