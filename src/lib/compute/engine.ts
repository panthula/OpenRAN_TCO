/**
 * TCO Computation Engine
 * Implements scaling rules, CAPEX/OPEX phasing, perpetual spreading, and NPV calculation.
 */

import prisma from '@/lib/db/client';
import {
  Day,
  Domain,
  Layer,
  DefaultModelAssumptions,
  type ModelAssumptions,
} from '@/lib/model/taxonomy';

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

export interface ComputeSummary {
  totalCapex: number;
  totalOpex: number;
  totalTco: number;
  totalNpv: number;
  byYear: ComputeResult[];
  byDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  breakdown: ComputeBreakdown[];
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

/**
 * Get scaling counts for a scenario version
 */
async function getScalingCounts(scenarioVersionId: string): Promise<{
  totalSites: number;
  totalCus: number;
  sitesByScopeId: Record<string, number>;
  cusByScopeId: Record<string, number>;
  dcCountsByScopeId: Record<string, number>;
}> {
  const archetypes = await prisma.siteArchetype.findMany({
    where: { scenarioVersionId },
  });

  const dcTypes = await prisma.dcType.findMany({
    where: { scenarioVersionId },
  });

  let totalSites = 0;
  let totalCus = 0;
  const sitesByScopeId: Record<string, number> = {};
  const cusByScopeId: Record<string, number> = {};
  const dcCountsByScopeId: Record<string, number> = {};

  for (const arch of archetypes) {
    totalSites += arch.numSites;
    totalCus += arch.numCus;
    sitesByScopeId[arch.id] = arch.numSites;
    cusByScopeId[arch.id] = arch.numCus;
  }

  for (const dc of dcTypes) {
    dcCountsByScopeId[dc.id] = dc.numDcs;
  }

  return { totalSites, totalCus, sitesByScopeId, cusByScopeId, dcCountsByScopeId };
}

/**
 * Calculate the multiplier based on driver and scope
 */
function getMultiplier(
  driver: string,
  scopeType: string,
  scopeId: string | null,
  counts: Awaited<ReturnType<typeof getScalingCounts>>
): number {
  switch (driver) {
    case 'per_site':
      if (scopeType === 'site_archetype' && scopeId) {
        return counts.sitesByScopeId[scopeId] || 0;
      }
      return counts.totalSites;
    case 'per_cu':
      if (scopeType === 'site_archetype' && scopeId) {
        return counts.cusByScopeId[scopeId] || 0;
      }
      return counts.totalCus;
    case 'per_dc':
      if (scopeType === 'dc_type' && scopeId) {
        return counts.dcCountsByScopeId[scopeId] || 0;
      }
      // Sum all DCs
      return Object.values(counts.dcCountsByScopeId).reduce((a, b) => a + b, 0);
    case 'per_server':
    case 'per_cluster':
    case 'per_license_unit':
    case 'per_rapp':
    case 'per_xapp':
    case 'per_integration':
      // These require specific count inputs; for now use 1 or stored value
      return 1;
    case 'fixed':
      return 1;
    case 'per_year':
      return 1; // Will be applied per year
    default:
      return 1;
  }
}

/**
 * Compute TCO for a scenario version
 */
export async function computeTco(scenarioVersionId: string): Promise<ComputeSummary> {
  const assumptions = await getModelAssumptions(scenarioVersionId);
  const counts = await getScalingCounts(scenarioVersionId);
  const inputFacts = await prisma.inputFact.findMany({
    where: { scenarioVersionId, layer: { not: 'assumptions' } },
  });

  const years = assumptions.tco_years;
  const discountRate = assumptions.discount_rate;
  const spreadYears = assumptions.perpetual_spread_years || 1;

  // Initialize year-by-year results
  const byYear: ComputeResult[] = [];
  for (let y = 0; y < years; y++) {
    byYear.push({ year: y, capex: 0, opex: 0, tco: 0, npv: 0 });
  }

  const byDayDomain: Record<string, { capex: number; opex: number; tco: number }> = {};
  const breakdown: ComputeBreakdown[] = [];

  // Process each input fact
  for (const fact of inputFacts) {
    const multiplier = getMultiplier(fact.driver, fact.scopeType, fact.scopeId, counts);
    const totalValue = fact.valueNumber * multiplier;
    const isPerYear = fact.driver === 'per_year';
    const isPerpetual = fact.licenseModel === 'perpetual';
    const isSubscription = fact.licenseModel === 'subscription';

    // Determine CAPEX vs OPEX based on day and license model
    let capex = 0;
    let opex = 0;

    if (fact.day === 'day0' || fact.day === 'day1') {
      // Day0/Day1 costs are CAPEX
      if (isPerpetual && spreadYears > 1) {
        // Spread perpetual CAPEX over years
        capex = totalValue / spreadYears;
      } else {
        capex = totalValue;
      }
    } else if (fact.day === 'day2') {
      // Day2 costs are OPEX (recurring)
      opex = totalValue;
    }

    // Apply to years
    for (let y = 0; y < years; y++) {
      let yearCapex = 0;
      let yearOpex = 0;

      if (fact.day === 'day0' || fact.day === 'day1') {
        // CAPEX in year 0 (or spread)
        if (isPerpetual && spreadYears > 1) {
          if (y < spreadYears) {
            yearCapex = capex;
          }
        } else if (y === 0) {
          yearCapex = capex;
        }
        
        // Support/maintenance OPEX for perpetual licenses starts in year 0 or 1
        if (isPerpetual && fact.layer === 'software') {
          // Assume 15% of license cost for maintenance (can be configured)
          yearOpex = totalValue * 0.15;
        }
      } else if (fact.day === 'day2') {
        // OPEX every year
        if (isPerYear || isSubscription || fact.layer === 'site_opex' || fact.layer === 'staffing') {
          yearOpex = opex;
        } else {
          yearOpex = opex;
        }
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

    // Aggregate by day/domain
    const key = `${fact.day}:${fact.domain}`;
    if (!byDayDomain[key]) {
      byDayDomain[key] = { capex: 0, opex: 0, tco: 0 };
    }
    byDayDomain[key].capex += capex;
    byDayDomain[key].opex += opex * years;
    byDayDomain[key].tco += capex + opex * years;
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

  return {
    totalCapex,
    totalOpex,
    totalTco,
    totalNpv,
    byYear,
    byDayDomain,
    breakdown,
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

