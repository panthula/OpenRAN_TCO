/**
 * TCO Computation Engine
 * Implements scaling rules, CAPEX/OPEX phasing, perpetual spreading, NPV calculation,
 * and deployment schedule phasing.
 */

import prisma from '@/lib/db/client';
import {
  Day,
  Domain,
  Layer,
  DefaultModelAssumptions,
  DefaultCostRates,
  type ModelAssumptions,
} from '@/lib/model/taxonomy';
import type { AdjustmentRule, AdjustmentMetadata } from '@/lib/types';
import { safeJsonParse } from '@/lib/utils/json-helpers';
import {
  getMultiplier,
  DU_SCALED_BUCKETS,
  SCALING_DRIVERS,
} from './multipliers';

// Re-export for backward compatibility
export { safeJsonParse };

export interface ComputeResult {
  year: number;
  capex: number;
  opex: number;
  tco: number;
  npv: number;
}

export interface ComputeBreakdown {
  day: Day;
  domain: Domain;
  layer: Layer;
  bucket: string;
  year: number;
  capex: number;
  opex: number;
  tco: number;
}

// Re-export AdjustmentMetadata for backward compatibility
export type { AdjustmentMetadata };

export interface ComputeSummary {
  totalCapex: number;
  totalOpex: number;
  totalTco: number;
  totalNpv: number;
  byYear: ComputeResult[];
  byDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  breakdown: ComputeBreakdown[];
  adjustments?: AdjustmentMetadata[];
  baselineTco?: number; // TCO before adjustments (for comparison)
}

/**
 * Get model assumptions from InputFacts or use defaults
 */
export async function getModelAssumptions(scenarioVersionId: string): Promise<ModelAssumptions> {
  const assumptions = await prisma.inputFact.findMany({
    where: {
      scenarioVersionId,
      layer: 'assumptions',
    },
  });

  const result = { ...DefaultModelAssumptions };

  for (const fact of assumptions) {
    if (fact.bucket === 'tco_years') {
      result.tco_years = fact.valueNumber;
    } else if (fact.bucket === 'discount_rate') {
      result.discount_rate = fact.valueNumber;
    } else if (fact.bucket === 'perpetual_spread_years') {
      result.perpetual_spread_years = fact.valueNumber;
    }
  }

  return result;
}

// AdjustmentRule imported from @/lib/types

interface AdjustmentSetWithRules {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  rules: AdjustmentRule[];
}

/**
 * Load active adjustment sets with their rules for a scenario version
 */
async function getActiveAdjustments(scenarioVersionId: string): Promise<AdjustmentSetWithRules[]> {
  const adjustmentSets = await prisma.adjustmentSet.findMany({
    where: {
      scenarioVersionId,
      isActive: true,
    },
    include: {
      rules: {
        orderBy: { priority: 'asc' },
      },
    },
  });

  return adjustmentSets;
}

/**
 * Check if an adjustment rule matches an input fact
 */
function ruleMatchesFact(
  rule: AdjustmentRule,
  fact: {
    day: string;
    domain: string;
    layer: string;
    bucket: string;
    scopeType: string;
    scopeId: string | null;
  }
): boolean {
  // null in rule means "match all"
  if (rule.targetDay !== null && rule.targetDay !== fact.day) return false;
  if (rule.targetDomain !== null && rule.targetDomain !== fact.domain) return false;
  if (rule.targetLayer !== null && rule.targetLayer !== fact.layer) return false;
  if (rule.targetBucket !== null && rule.targetBucket !== fact.bucket) return false;
  if (rule.targetScopeType !== null && rule.targetScopeType !== fact.scopeType) return false;
  if (rule.targetScopeId !== null && rule.targetScopeId !== fact.scopeId) return false;
  return true;
}

/**
 * Apply an adjustment rule to a value
 */
function applyAdjustment(value: number, rule: AdjustmentRule): number {
  switch (rule.adjustmentType) {
    case 'percentage':
      // adjustmentValue is the percentage change (e.g., 10 = +10%, -20 = -20%)
      return value * (1 + rule.adjustmentValue / 100);
    case 'fixed':
      // adjustmentValue is added/subtracted to the value
      return value + rule.adjustmentValue;
    case 'replace':
      // adjustmentValue replaces the original value entirely
      return rule.adjustmentValue;
    default:
      return value;
  }
}

/**
 * Get adjusted value for a fact based on all applicable rules
 * Rules are applied in priority order (lower priority first)
 */
function getAdjustedValue(
  originalValue: number,
  fact: {
    day: string;
    domain: string;
    layer: string;
    bucket: string;
    scopeType: string;
    scopeId: string | null;
  },
  allRules: AdjustmentRule[]
): { adjustedValue: number; appliedRules: AdjustmentRule[] } {
  const appliedRules: AdjustmentRule[] = [];
  let adjustedValue = originalValue;

  // Rules should already be sorted by priority
  for (const rule of allRules) {
    if (ruleMatchesFact(rule, fact)) {
      adjustedValue = applyAdjustment(adjustedValue, rule);
      appliedRules.push(rule);
    }
  }

  return { adjustedValue, appliedRules };
}

/**
 * Scaling counts for a specific year
 */
interface YearScalingCounts {
  // Deployments THIS year (for CAPEX)
  deploymentsThisYear: {
    sites: number;
    cus: number;
    dcs: number;
    dus: number;  // Total DUs = sum of (sites × numDusPerSite) per archetype
    sitesByScopeId: Record<string, number>;
    cusByScopeId: Record<string, number>;
    dcsByScopeId: Record<string, number>;
    dusByScopeId: Record<string, number>;
  };
  // Cumulative deployments TO this year (for OPEX)
  cumulativeToYear: {
    sites: number;
    cus: number;
    dcs: number;
    dus: number;  // Total DUs = sum of (sites × numDusPerSite) per archetype
    sitesByScopeId: Record<string, number>;
    cusByScopeId: Record<string, number>;
    dcsByScopeId: Record<string, number>;
    dusByScopeId: Record<string, number>;
  };
}

/**
 * Get scaling counts for a scenario version, optionally for a specific year
 * When forYear is provided, returns per-year counts based on deployment schedule
 * When forYear is undefined, returns total counts (backward compatible)
 */
async function getScalingCounts(
  scenarioVersionId: string,
  forYear?: number
): Promise<YearScalingCounts> {
  const archetypes = await prisma.siteArchetype.findMany({
    where: { scenarioVersionId },
    include: {
      deploymentSchedule: {
        orderBy: { yearIndex: 'asc' },
      },
    },
  });

  // Initialize counts
  const deploymentsThisYear = {
    sites: 0,
    cus: 0,
    dcs: 0,
    dus: 0,
    sitesByScopeId: {} as Record<string, number>,
    cusByScopeId: {} as Record<string, number>,
    dcsByScopeId: {} as Record<string, number>,
    dusByScopeId: {} as Record<string, number>,
  };

  const cumulativeToYear = {
    sites: 0,
    cus: 0,
    dcs: 0,
    dus: 0,
    sitesByScopeId: {} as Record<string, number>,
    cusByScopeId: {} as Record<string, number>,
    dcsByScopeId: {} as Record<string, number>,
    dusByScopeId: {} as Record<string, number>,
  };

  for (const arch of archetypes) {
    const hasSchedule = arch.deploymentSchedule && arch.deploymentSchedule.length > 0;
    const dusPerSite = arch.numDusPerSite || 1;

    if (forYear === undefined || !hasSchedule) {
      // No year specified or no schedule - use total counts (backward compatible)
      // For backward compatibility: all deployments in Year 0
      if (forYear === undefined || forYear === 0) {
        deploymentsThisYear.sites += arch.numSites;
        deploymentsThisYear.cus += arch.numCus;
        deploymentsThisYear.dcs += arch.numDcs;
        deploymentsThisYear.dus += arch.numSites * dusPerSite;
        deploymentsThisYear.sitesByScopeId[arch.id] = arch.numSites;
        deploymentsThisYear.cusByScopeId[arch.id] = arch.numCus;
        deploymentsThisYear.dcsByScopeId[arch.id] = arch.numDcs;
        deploymentsThisYear.dusByScopeId[arch.id] = arch.numSites * dusPerSite;
      } else {
        // No deployments in years > 0 for archetypes without schedule
        deploymentsThisYear.sitesByScopeId[arch.id] = 0;
        deploymentsThisYear.cusByScopeId[arch.id] = 0;
        deploymentsThisYear.dcsByScopeId[arch.id] = 0;
        deploymentsThisYear.dusByScopeId[arch.id] = 0;
      }

      // Cumulative is always the full count for non-scheduled archetypes
      cumulativeToYear.sites += arch.numSites;
      cumulativeToYear.cus += arch.numCus;
      cumulativeToYear.dcs += arch.numDcs;
      cumulativeToYear.dus += arch.numSites * dusPerSite;
      cumulativeToYear.sitesByScopeId[arch.id] = arch.numSites;
      cumulativeToYear.cusByScopeId[arch.id] = arch.numCus;
      cumulativeToYear.dcsByScopeId[arch.id] = arch.numDcs;
      cumulativeToYear.dusByScopeId[arch.id] = arch.numSites * dusPerSite;
    } else {
      // Has deployment schedule - use per-year phasing
      const schedule = arch.deploymentSchedule;

      // Find deployments for this specific year
      const thisYearSchedule = schedule.find((s: (typeof schedule)[number]) => s.yearIndex === forYear);
      if (thisYearSchedule) {
        deploymentsThisYear.sites += thisYearSchedule.sitesDeployed;
        deploymentsThisYear.cus += thisYearSchedule.cusDeployed;
        deploymentsThisYear.dcs += thisYearSchedule.dcsDeployed;
        deploymentsThisYear.dus += thisYearSchedule.sitesDeployed * dusPerSite;
        deploymentsThisYear.sitesByScopeId[arch.id] = thisYearSchedule.sitesDeployed;
        deploymentsThisYear.cusByScopeId[arch.id] = thisYearSchedule.cusDeployed;
        deploymentsThisYear.dcsByScopeId[arch.id] = thisYearSchedule.dcsDeployed;
        deploymentsThisYear.dusByScopeId[arch.id] = thisYearSchedule.sitesDeployed * dusPerSite;
      } else {
        deploymentsThisYear.sitesByScopeId[arch.id] = 0;
        deploymentsThisYear.cusByScopeId[arch.id] = 0;
        deploymentsThisYear.dcsByScopeId[arch.id] = 0;
        deploymentsThisYear.dusByScopeId[arch.id] = 0;
      }

      // Calculate cumulative deployments up to and including this year
      let cumSites = 0;
      let cumCus = 0;
      let cumDcs = 0;
      for (const s of schedule) {
        if (s.yearIndex <= forYear) {
          cumSites += s.sitesDeployed;
          cumCus += s.cusDeployed;
          cumDcs += s.dcsDeployed;
        }
      }
      cumulativeToYear.sites += cumSites;
      cumulativeToYear.cus += cumCus;
      cumulativeToYear.dcs += cumDcs;
      cumulativeToYear.dus += cumSites * dusPerSite;
      cumulativeToYear.sitesByScopeId[arch.id] = cumSites;
      cumulativeToYear.cusByScopeId[arch.id] = cumCus;
      cumulativeToYear.dcsByScopeId[arch.id] = cumDcs;
      cumulativeToYear.dusByScopeId[arch.id] = cumSites * dusPerSite;
    }
  }

  return { deploymentsThisYear, cumulativeToYear };
}

// getMultiplier, SCALING_DRIVERS, DU_SCALED_BUCKETS imported from ./multipliers

/**
 * Compute TCO for a scenario version with deployment schedule support
 */
export async function computeTco(scenarioVersionId: string): Promise<ComputeSummary> {
  // Parallelize independent database queries for better performance
  const [assumptions, inputFacts, adjustmentSets] = await Promise.all([
    getModelAssumptions(scenarioVersionId),
    prisma.inputFact.findMany({
      where: { scenarioVersionId, layer: { not: 'assumptions' } },
    }),
    getActiveAdjustments(scenarioVersionId),
  ]);

  const years = assumptions.tco_years;
  const discountRate = assumptions.discount_rate;
  const spreadYears = assumptions.perpetual_spread_years || 1;

  // Collect all rules from active adjustment sets, sorted by priority
  const allRules: AdjustmentRule[] = adjustmentSets.flatMap((set: AdjustmentSetWithRules) => set.rules);
  allRules.sort((a, b) => a.priority - b.priority);

  // Track adjustment metadata
  const adjustmentTracker = new Map<string, { name: string; rulesApplied: number; totalImpact: number }>();
  for (const set of adjustmentSets) {
    adjustmentTracker.set(set.id, { name: set.name, rulesApplied: 0, totalImpact: 0 });
  }

  // Pre-fetch scaling counts for all years we need
  const countsByYear: YearScalingCounts[] = [];
  for (let y = 0; y < years; y++) {
    countsByYear[y] = await getScalingCounts(scenarioVersionId, y);
  }

  // Initialize year-by-year results
  const byYear: ComputeResult[] = [];
  for (let y = 0; y < years; y++) {
    byYear.push({ year: y, capex: 0, opex: 0, tco: 0, npv: 0 });
  }

  const byDayDomain: Record<string, { capex: number; opex: number; tco: number }> = {};
  const breakdown: ComputeBreakdown[] = [];

  // Helper to get multiplier based on driver, scope, counts, and bucket
  const getMultiplierForCounts = (
    driver: string,
    scopeType: string,
    scopeId: string | null,
    counts: YearScalingCounts['deploymentsThisYear'] | YearScalingCounts['cumulativeToYear'],
    bucket?: string
  ): number => {
    // For this to work correctly, we need to include counts in the cache key
    // But since counts change per year, we'll just compute directly
    return getMultiplier(driver, scopeType, scopeId, counts, bucket);
  };

  // Track baseline TCO (before adjustments) if we have adjustments
  let baselineTco: number | undefined;
  if (allRules.length > 0) {
    // We'll calculate this at the end
    baselineTco = 0;
  }

  // Process each input fact
  for (const fact of inputFacts) {
    const isPerpetual = fact.licenseModel === 'perpetual';

    // Apply adjustments to the fact's valueNumber
    const { adjustedValue, appliedRules } = getAdjustedValue(
      fact.valueNumber,
      {
        day: fact.day,
        domain: fact.domain,
        layer: fact.layer,
        bucket: fact.bucket,
        scopeType: fact.scopeType,
        scopeId: fact.scopeId,
      },
      allRules
    );

    // Track which adjustments were applied and their impact
    if (appliedRules.length > 0) {
      for (const rule of appliedRules) {
        // adjustmentSetId is always present for rules loaded from the database
        if (rule.adjustmentSetId) {
          const tracker = adjustmentTracker.get(rule.adjustmentSetId);
          if (tracker) {
            tracker.rulesApplied++;
            // Impact is the difference between adjusted and original
            tracker.totalImpact += adjustedValue - fact.valueNumber;
          }
        }
      }
    }

    // Use adjusted value for all calculations
    const effectiveValue = adjustedValue;

    // Process each year
    for (let y = 0; y < years; y++) {
      const yearCounts = countsByYear[y];
      let yearCapex = 0;
      let yearOpex = 0;

      if (fact.day === 'day0' || fact.day === 'day1') {
        // Handle per_year_deployment driver specially
        if (fact.driver === 'per_year_deployment') {
          const hasDeploymentActivity =
            yearCounts.deploymentsThisYear.sites > 0 ||
            yearCounts.deploymentsThisYear.cus > 0 ||
            yearCounts.deploymentsThisYear.dcs > 0;

          if (hasDeploymentActivity) {
            // Parse valueJson for year-specific value
            const yearValues = safeJsonParse<Record<string, number>>(fact.valueJson, {});
            yearCapex = yearValues[`year_${y}`] ?? 0;
          }
          // If no deployment activity, yearCapex stays 0
        } else if (fact.driver === 'per_integration') {
          // Integration costs: effectiveValue × count, one-time in Year 0
          if (y === 0) {
            const data = safeJsonParse<{ count?: number }>(fact.valueJson, {});
            const count = data.count ?? 1;
            yearCapex = effectiveValue * count;
          }
          // Years > 0: no additional CAPEX for integrations
        } else {
          // CAPEX: Use deployments THIS year
          const multiplier = getMultiplierForCounts(
            fact.driver,
            fact.scopeType,
            fact.scopeId,
            yearCounts.deploymentsThisYear,
            fact.bucket
          );
          const totalValue = effectiveValue * multiplier;

          if (isPerpetual && spreadYears > 1) {
            // Spread perpetual CAPEX over years
            if (y < spreadYears) {
              yearCapex = totalValue / spreadYears;
            }
          } else {
            yearCapex = totalValue;
          }

          // Support/maintenance OPEX for perpetual licenses (cumulative based)
          if (isPerpetual && fact.layer === 'software') {
            const opexMultiplier = getMultiplierForCounts(
              fact.driver,
              fact.scopeType,
              fact.scopeId,
              yearCounts.cumulativeToYear,
              fact.bucket
            );
            yearOpex = effectiveValue * opexMultiplier * DefaultCostRates.SOFTWARE_PERPETUAL_MAINTENANCE_RATE;
          }
        }
      } else if (fact.day === 'day2') {
        // OPEX: Use CUMULATIVE deployments (you pay to operate all deployed assets)
        const multiplier = getMultiplierForCounts(
          fact.driver,
          fact.scopeType,
          fact.scopeId,
          yearCounts.cumulativeToYear,
          fact.bucket
        );
        yearOpex = effectiveValue * multiplier;
      }

      byYear[y].capex += yearCapex;
      byYear[y].opex += yearOpex;
      byYear[y].tco += yearCapex + yearOpex;

      // Track breakdown
      if (yearCapex > 0 || yearOpex > 0) {
        breakdown.push({
          day: fact.day as Day,
          domain: fact.domain as Domain,
          layer: fact.layer as Layer,
          bucket: fact.bucket,
          year: y,
          capex: yearCapex,
          opex: yearOpex,
          tco: yearCapex + yearOpex,
        });
      }
    }

    // Aggregate by day/domain (using total cumulative counts for the summary)
    // This represents the "steady state" annual cost at full deployment
    const finalYearCounts = countsByYear[years - 1] || countsByYear[0];
    let totalCapex = 0;
    let totalOpex = 0;

    if (fact.day === 'day0' || fact.day === 'day1') {
      if (fact.driver === 'per_year_deployment') {
        // Sum all year values from valueJson for total
        const yearValues = safeJsonParse<Record<string, number>>(fact.valueJson, {});
        for (let y = 0; y < years; y++) {
          totalCapex += yearValues[`year_${y}`] ?? 0;
        }
      } else if (fact.driver === 'per_integration') {
        // Integration costs: effectiveValue × count (one-time)
        const data = safeJsonParse<{ count?: number }>(fact.valueJson, {});
        const count = data.count ?? 1;
        totalCapex = effectiveValue * count;
      } else {
        // For summary: use first year's deployment counts for CAPEX
        const multiplier = getMultiplierForCounts(
          fact.driver,
          fact.scopeType,
          fact.scopeId,
          countsByYear[0].deploymentsThisYear,
          fact.bucket
        );
        totalCapex = effectiveValue * multiplier;
      }
    } else if (fact.day === 'day2') {
      // For summary: use final cumulative counts for annual OPEX rate
      const multiplier = getMultiplierForCounts(
        fact.driver,
        fact.scopeType,
        fact.scopeId,
        finalYearCounts.cumulativeToYear,
        fact.bucket
      );
      totalOpex = effectiveValue * multiplier;
    }

    const key = `${fact.day}:${fact.domain}`;
    if (!byDayDomain[key]) {
      byDayDomain[key] = { capex: 0, opex: 0, tco: 0 };
    }
    byDayDomain[key].capex += totalCapex;
    byDayDomain[key].opex += totalOpex;
    byDayDomain[key].tco += totalCapex + totalOpex;
  }

  // Calculate NPV for each year
  for (let y = 0; y < years; y++) {
    const discountFactor = Math.pow(1 + discountRate, y);
    byYear[y].npv = byYear[y].tco / discountFactor;
  }

  // Calculate totals
  const totalCapex = byYear.reduce((sum, yr) => sum + yr.capex, 0);
  const totalOpex = byYear.reduce((sum, yr) => sum + yr.opex, 0);
  const totalTco = byYear.reduce((sum, yr) => sum + yr.tco, 0);
  const totalNpv = byYear.reduce((sum, yr) => sum + yr.npv, 0);

  // Build adjustment metadata for the response
  const adjustments: AdjustmentMetadata[] = [];
  for (const [id, tracker] of adjustmentTracker.entries()) {
    if (tracker.rulesApplied > 0) {
      adjustments.push({
        id,
        name: tracker.name,
        rulesApplied: tracker.rulesApplied,
        totalImpact: tracker.totalImpact,
      });
    }
  }

  return {
    totalCapex,
    totalOpex,
    totalTco,
    totalNpv,
    byYear,
    byDayDomain,
    breakdown,
    adjustments: adjustments.length > 0 ? adjustments : undefined,
    baselineTco,
  };
}

/**
 * Compute and persist results to ComputedFact table
 */
export async function computeAndPersist(scenarioVersionId: string): Promise<ComputeSummary> {
  const summary = await computeTco(scenarioVersionId);

  // Delete existing computed facts for this version
  await prisma.computedFact.deleteMany({
    where: { scenarioVersionId },
  });

  // Insert summary facts
  const factsToCreate = [];

  // Overall by year
  for (const yr of summary.byYear) {
    factsToCreate.push({
      scenarioVersionId,
      metric: 'total',
      year: yr.year,
      capex: yr.capex,
      opex: yr.opex,
      tco: yr.tco,
      npv: yr.npv,
    });
  }

  // By day/domain aggregates
  for (const [key, values] of Object.entries(summary.byDayDomain)) {
    const [day, domain] = key.split(':');
    factsToCreate.push({
      scenarioVersionId,
      metric: 'by_day_domain',
      day,
      domain,
      year: 0,
      capex: values.capex,
      opex: values.opex,
      tco: values.tco,
    });
  }

  // Detailed breakdown
  for (const item of summary.breakdown) {
    factsToCreate.push({
      scenarioVersionId,
      metric: 'breakdown',
      day: item.day,
      domain: item.domain,
      layer: item.layer,
      bucket: item.bucket,
      year: item.year,
      capex: item.capex,
      opex: item.opex,
      tco: item.tco,
    });
  }

  await prisma.computedFact.createMany({
    data: factsToCreate,
  });

  return summary;
}
