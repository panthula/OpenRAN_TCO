/**
 * Yearly Cost Breakdown Calculation Utility
 * Computes Day 0/1/2 costs by year and archetype for the RAN Summary view
 */

import { type Domain } from '@/lib/model/taxonomy';
import { applyAdjustmentsToFacts, type AdjustmentSet } from './apply-adjustments';

// Types from scenario store (duplicated here for utility independence)
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

/**
 * Cost breakdown for a single archetype in a single year
 */
export interface YearArchetypeCosts {
  archetypeId: string | null;
  archetypeName: string;
  yearIndex: number;
  sitesDeployedThisYear: number;
  cumulativeSites: number;
  cusDeployedThisYear: number;
  cumulativeCus: number;
  dcsDeployedThisYear: number;
  cumulativeDcs: number;
  day0: number;   // CAPEX procurement (uses deploymentsThisYear)
  day1: number;   // CAPEX installation (uses deploymentsThisYear)
  day2: number;   // OPEX operations (uses cumulativeToYear)
  total: number;
}

/**
 * Summary for a single year across all archetypes
 */
export interface YearlySummary {
  yearIndex: number;
  totalDay0: number;
  totalDay1: number;
  totalDay2: number;
  totalCost: number;
  archetypes: YearArchetypeCosts[];
}

/**
 * Complete yearly breakdown result
 */
export interface YearlyCostBreakdown {
  years: YearlySummary[];
  grandTotal: {
    day0: number;
    day1: number;
    day2: number;
    total: number;
    sites: number;
  };
}

// Buckets that should always have multiplier = 1 (fixed cost, not scaled)
const FIXED_MULTIPLIER_BUCKETS = [
  'cluster_acceptance_testing',
  'network_acceptance_testing',
  'drive_tests',
  'security_validation',
  'core_integration',
  'other_integration',
];

// Buckets that should use DC count as multiplier
const DC_SCOPED_BUCKETS = [
  'cu_server', 'switches_tor_oob', 'iptx_equipment', 'rack_accessories', 'other_ran_cu',
  'cu_software_per_dc', '3pp_licenses_per_dc', 'other_ran_software',
  'racks_cu_pdu_tor_install', 'all_iptx_config',
];

// Buckets that scale by DU count (sites × numDusPerSite)
const DU_SCALED_BUCKETS = ['cloud_per_du_at_site'];

/**
 * Get multiplier based on driver and counts
 */
function getMultiplier(
  driver: string,
  bucket: string,
  counts: {
    sites: number;
    cus: number;
    dcs: number;
    dus: number;
  }
): number {
  // Fixed multiplier buckets (testing, integration) are one-time costs
  // They only apply in years with actual deployments
  if (FIXED_MULTIPLIER_BUCKETS.includes(bucket)) {
    const hasDeployments = counts.sites > 0 || counts.cus > 0 || counts.dcs > 0;
    return hasDeployments ? 1 : 0;
  }

  // DU-scaled buckets use DU count (sites × numDusPerSite)
  if (DU_SCALED_BUCKETS.includes(bucket)) {
    return counts.dus;
  }

  // DC-scoped buckets use DC count
  if (DC_SCOPED_BUCKETS.includes(bucket)) {
    return counts.dcs;
  }

  switch (driver) {
    case 'per_site':
      return counts.sites;
    case 'per_cu':
      return counts.cus;
    case 'per_dc':
      return counts.dcs;
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
}

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
