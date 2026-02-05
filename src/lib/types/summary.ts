/**
 * Summary and display types for cost breakdowns
 */

import { type Bucket } from '@/lib/model/taxonomy';

/**
 * Detail for a single cost fact in the summary view
 */
export interface FactDetail {
  bucket: Bucket;
  unitCost: number;
  multiplier: number;
  total: number;
  driver: string;
}

/**
 * Summary of costs for a single archetype
 */
export interface ArchetypeSummary {
  archetypeId: string | null;      // null for network_global
  archetypeName: string;
  numSites: number;
  numCus: number;
  numDcs?: number;                 // Number of DCs (optional, used for cloud domain)
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
