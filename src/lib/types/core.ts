/**
 * Core domain types for OpenRAN TCO
 * These types represent the fundamental data structures used throughout the application.
 */

/**
 * Deployment schedule for a single year within an archetype
 */
export interface DeploymentYear {
  id?: string;
  archetypeId?: string;
  yearIndex: number;
  sitesDeployed: number;
  cusDeployed: number;
  dcsDeployed: number;
}

/**
 * Site archetype defining a deployment pattern
 */
export interface SiteArchetype {
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

/**
 * Input fact representing a single cost input in the TCO model
 */
export interface InputFact {
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
 * Computed summary of TCO results
 */
export interface ComputedSummary {
  totalCapex: number;
  totalOpex: number;
  totalTco: number;
  totalNpv: number;
  byYear: { year: number; capex: number; opex: number; tco: number; npv: number }[];
  byDayDomain?: Record<string, { capex: number; opex: number; tco: number }>;
  adjustments?: { id: string; name: string; rulesApplied: number; totalImpact: number }[];
  baselineTco?: number;
}

/**
 * Scenario representing a TCO model configuration
 */
export interface Scenario {
  id: string;
  name: string;
  description: string | null;
  isBaseline: boolean;
  versions: ScenarioVersion[];
}

/**
 * Scenario version - immutable snapshot of inputs
 */
export interface ScenarioVersion {
  id: string;
  scenarioId: string;
  versionNum: number;
  description: string | null;
  isActive: boolean;
}

/**
 * Data for scenario comparison
 */
export interface ScenarioComparisonData {
  id: string;
  name: string;
  description: string | null;
  isBaseline: boolean;
  versionId: string;
  versionNum: number;
  summary: ComputedSummary | null;
}

/**
 * Network counts for multiplier calculations
 */
export interface NetworkCounts {
  sites: number;
  cus: number;
  dcs: number;
  dus: number;
  sitesByScopeId: Record<string, number>;
  cusByScopeId: Record<string, number>;
  dcsByScopeId: Record<string, number>;
  dusByScopeId: Record<string, number>;
}

/**
 * Scaling counts for a specific year
 */
export interface YearScalingCounts {
  deploymentsThisYear: NetworkCounts;
  cumulativeToYear: NetworkCounts;
}
