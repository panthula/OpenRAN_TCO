/**
 * Yearly Cost Breakdown Calculation Utility
 * Computes Day 0/1/2 costs by year and archetype for the RAN Summary view
 */

import { type Domain } from '@/lib/model/taxonomy';
import { applyAdjustmentsToFacts } from './apply-adjustments';
import { getMultiplierForCounts } from '@/lib/compute/multipliers';
import type {
  SiteArchetype,
  InputFact,
  AdjustmentSet,
  YearArchetypeCosts,
  YearlySummary,
  YearlyCostBreakdown,
} from '@/lib/types';

// Re-export types for backward compatibility
export type { YearArchetypeCosts, YearlySummary, YearlyCostBreakdown };

// Use centralized multiplier logic
const getMultiplier = (
  driver: string,
  bucket: string,
  counts: { sites: number; cus: number; dcs: number; dus: number }
) => getMultiplierForCounts(driver, bucket, counts);

/**
 * Get deployment counts for a specific year from an archetype's schedule
 */
function getYearDeployments(
  archetype: SiteArchetype,
  yearIndex: number
): { thisYear: { sites: number; cus: number; dcs: number; dus: number }; cumulative: { sites: number; cus: number; dcs: number; dus: number } } {
  const schedule = archetype.deploymentSchedule || [];
  const hasSchedule = schedule.length > 0;
  const dusPerSite = archetype.numDusPerSite || 1;

  if (!hasSchedule) {
    // No schedule: all deployed in Year 0
    if (yearIndex === 0) {
      return {
        thisYear: { sites: archetype.numSites, cus: archetype.numCus, dcs: archetype.numDcs, dus: archetype.numSites * dusPerSite },
        cumulative: { sites: archetype.numSites, cus: archetype.numCus, dcs: archetype.numDcs, dus: archetype.numSites * dusPerSite },
      };
    }
    // Years > 0: no new deployments, but cumulative is full
    return {
      thisYear: { sites: 0, cus: 0, dcs: 0, dus: 0 },
      cumulative: { sites: archetype.numSites, cus: archetype.numCus, dcs: archetype.numDcs, dus: archetype.numSites * dusPerSite },
    };
  }

  // Has schedule - compute from schedule
  const thisYearSchedule = schedule.find(s => s.yearIndex === yearIndex);
  const thisYear = thisYearSchedule
    ? { sites: thisYearSchedule.sitesDeployed, cus: thisYearSchedule.cusDeployed, dcs: thisYearSchedule.dcsDeployed, dus: thisYearSchedule.sitesDeployed * dusPerSite }
    : { sites: 0, cus: 0, dcs: 0, dus: 0 };

  // Calculate cumulative up to and including this year
  let cumSites = 0;
  let cumCus = 0;
  let cumDcs = 0;
  for (const s of schedule) {
    if (s.yearIndex <= yearIndex) {
      cumSites += s.sitesDeployed;
      cumCus += s.cusDeployed;
      cumDcs += s.dcsDeployed;
    }
  }

  return {
    thisYear,
    cumulative: { sites: cumSites, cus: cumCus, dcs: cumDcs, dus: cumSites * dusPerSite },
  };
}

/**
 * Compute yearly cost breakdown for a domain
 */
export function computeYearlyBreakdown(
  inputFacts: InputFact[],
  siteArchetypes: SiteArchetype[],
  domain: Domain,
  tcoYears: number = 5,
  adjustmentSets?: AdjustmentSet[]
): YearlyCostBreakdown {
  // Apply adjustments to facts if adjustment sets are provided
  const adjustedFacts = adjustmentSets && adjustmentSets.length > 0
    ? applyAdjustmentsToFacts(inputFacts, adjustmentSets)
    : inputFacts;

  const domainFacts = adjustedFacts.filter(f => f.domain === domain);

  // Get perpetual spread years from assumptions
  const spreadYearsAssumption = inputFacts.find(
    f => f.layer === 'assumptions' && f.bucket === 'perpetual_spread_years'
  );
  const perpetualSpreadYears = spreadYearsAssumption?.valueNumber ?? 1;

  // Build archetype lookup map
  const archetypeMap = new Map<string, SiteArchetype>();
  for (const arch of siteArchetypes) {
    archetypeMap.set(arch.id, arch);
  }

  // Group facts by scopeId
  const factsByScopeId = new Map<string, InputFact[]>();
  for (const fact of domainFacts) {
    const key = fact.scopeId || 'network_global';
    if (!factsByScopeId.has(key)) {
      factsByScopeId.set(key, []);
    }
    factsByScopeId.get(key)!.push(fact);
  }

  const years: YearlySummary[] = [];

  // Process each year
  for (let yearIndex = 0; yearIndex < tcoYears; yearIndex++) {
    const archetypeCosts: YearArchetypeCosts[] = [];

    // Process each scope (archetype or network_global)
    for (const [scopeKey, facts] of factsByScopeId.entries()) {
      const isNetworkGlobal = scopeKey === 'network_global';
      const archetype = isNetworkGlobal ? null : archetypeMap.get(scopeKey);

      // Skip orphaned scopes
      if (!isNetworkGlobal && !archetype) {
        continue;
      }

      // Get deployment counts for this year
      let thisYearCounts = { sites: 0, cus: 0, dcs: 0, dus: 0 };
      let cumulativeCounts = { sites: 0, cus: 0, dcs: 0, dus: 0 };

      if (archetype) {
        const counts = getYearDeployments(archetype, yearIndex);
        thisYearCounts = counts.thisYear;
        cumulativeCounts = counts.cumulative;
      } else {
        // Network global: aggregate across all archetypes
        for (const arch of siteArchetypes) {
          const counts = getYearDeployments(arch, yearIndex);
          thisYearCounts.sites += counts.thisYear.sites;
          thisYearCounts.cus += counts.thisYear.cus;
          thisYearCounts.dcs += counts.thisYear.dcs;
          thisYearCounts.dus += counts.thisYear.dus;
          cumulativeCounts.sites += counts.cumulative.sites;
          cumulativeCounts.cus += counts.cumulative.cus;
          cumulativeCounts.dcs += counts.cumulative.dcs;
          cumulativeCounts.dus += counts.cumulative.dus;
        }
      }

      // Calculate costs for this scope/year
      let day0Cost = 0;
      let day1Cost = 0;
      let day2Cost = 0;

      for (const fact of facts) {
        let cost = 0;

        if (fact.day === 'day0' || fact.day === 'day1') {
          // Handle per_year_deployment driver specially
          if (fact.driver === 'per_year_deployment') {
            const hasDeploymentActivity =
              thisYearCounts.sites > 0 ||
              thisYearCounts.cus > 0 ||
              thisYearCounts.dcs > 0;

            if (hasDeploymentActivity) {
              // Parse valueJson for year-specific value
              const yearValues = fact.valueJson ? JSON.parse(fact.valueJson) : {};
              cost = yearValues[`year_${yearIndex}`] ?? 0;
            }
            // If no deployment activity, cost stays 0

            if (fact.day === 'day0') {
              day0Cost += cost;
            } else {
              day1Cost += cost;
            }
            continue;
          }

          // Check if this is a perpetual license that should be spread
          const isPerpetual = fact.licenseModel === 'perpetual';
          const shouldSpread = isPerpetual && perpetualSpreadYears > 1;

          // Network Global Day 0/1 costs handling
          if (isNetworkGlobal) {
            if (shouldSpread) {
              // Perpetual license spreading: spread cost over perpetualSpreadYears
              if (yearIndex < perpetualSpreadYears) {
                const multiplier = getMultiplier(fact.driver, fact.bucket, thisYearCounts);
                // For spreading, use Year 0 counts since it's a one-time cost being amortized
                const baseMultiplier = yearIndex === 0 ? multiplier : 1;
                cost = (fact.valueNumber * baseMultiplier) / perpetualSpreadYears;
              } else {
                continue; // Skip - spreading period is over
              }
            } else if (yearIndex > 0) {
              continue; // Skip - non-perpetual network_global costs are one-time in Year 0
            } else {
              // Year 0, non-perpetual: standard calculation
              const multiplier = getMultiplier(fact.driver, fact.bucket, thisYearCounts);
              cost = fact.valueNumber * multiplier;
            }
          } else {
            // Site archetype scoped costs
            if (shouldSpread) {
              // Perpetual spreading for archetype-scoped costs
              if (yearIndex < perpetualSpreadYears) {
                const multiplier = getMultiplier(fact.driver, fact.bucket, thisYearCounts);
                cost = (fact.valueNumber * multiplier) / perpetualSpreadYears;
              } else {
                continue;
              }
            } else {
              // CAPEX: Use deployments THIS year
              const multiplier = getMultiplier(fact.driver, fact.bucket, thisYearCounts);
              cost = fact.valueNumber * multiplier;
            }
          }

          if (fact.day === 'day0') {
            day0Cost += cost;
          } else {
            day1Cost += cost;
          }
        } else if (fact.day === 'day2') {
          // OPEX: Use CUMULATIVE deployments
          const multiplier = getMultiplier(fact.driver, fact.bucket, cumulativeCounts);
          cost = fact.valueNumber * multiplier;
          day2Cost += cost;
        }
      }

      // Only add if there are costs or deployments
      if (day0Cost > 0 || day1Cost > 0 || day2Cost > 0 || thisYearCounts.sites > 0 || cumulativeCounts.sites > 0) {
        archetypeCosts.push({
          archetypeId: isNetworkGlobal ? null : scopeKey,
          archetypeName: isNetworkGlobal ? 'Network Global' : (archetype?.name || 'Unknown'),
          yearIndex,
          sitesDeployedThisYear: thisYearCounts.sites,
          cumulativeSites: cumulativeCounts.sites,
          cusDeployedThisYear: thisYearCounts.cus,
          cumulativeCus: cumulativeCounts.cus,
          dcsDeployedThisYear: thisYearCounts.dcs,
          cumulativeDcs: cumulativeCounts.dcs,
          day0: day0Cost,
          day1: day1Cost,
          day2: day2Cost,
          total: day0Cost + day1Cost + day2Cost,
        });
      }
    }

    // Sort: archetypes first (alphabetically), network_global at end
    archetypeCosts.sort((a, b) => {
      if (a.archetypeId === null) return 1;
      if (b.archetypeId === null) return -1;
      return a.archetypeName.localeCompare(b.archetypeName);
    });

    // Calculate year totals
    const yearSummary: YearlySummary = {
      yearIndex,
      totalDay0: archetypeCosts.reduce((sum, a) => sum + a.day0, 0),
      totalDay1: archetypeCosts.reduce((sum, a) => sum + a.day1, 0),
      totalDay2: archetypeCosts.reduce((sum, a) => sum + a.day2, 0),
      totalCost: archetypeCosts.reduce((sum, a) => sum + a.total, 0),
      archetypes: archetypeCosts,
    };

    years.push(yearSummary);
  }

  // Calculate grand totals
  const grandTotal = {
    day0: years.reduce((sum, y) => sum + y.totalDay0, 0),
    day1: years.reduce((sum, y) => sum + y.totalDay1, 0),
    day2: years.reduce((sum, y) => sum + y.totalDay2, 0),
    total: years.reduce((sum, y) => sum + y.totalCost, 0),
    sites: siteArchetypes.reduce((sum, a) => sum + a.numSites, 0),
  };

  return { years, grandTotal };
}
