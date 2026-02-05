/**
 * Multiplier calculation utilities
 * Centralized logic for computing scaling multipliers based on driver and scope
 */

import type { NetworkCounts } from '@/lib/types';

/** Scaling driver constants for type safety */
export const SCALING_DRIVERS = {
  PER_SITE: 'per_site',
  PER_CU: 'per_cu',
  PER_DC: 'per_dc',
  PER_DU: 'per_du',
} as const;

/** Buckets that scale by DU count instead of site count */
export const DU_SCALED_BUCKETS = ['cloud_per_du_at_site'];

/** Buckets that should always have multiplier = 1 (fixed cost, not scaled) */
export const FIXED_MULTIPLIER_BUCKETS = [
  'cluster_acceptance_testing',
  'network_acceptance_testing',
  'drive_tests',
  'security_validation',
  'core_integration',
  'other_integration',
];

/** Buckets that should use DC count as multiplier */
export const DC_SCOPED_BUCKETS = [
  // Hardware (per DC)
  'cu_server', 'switches_tor_oob', 'iptx_equipment', 'rack_accessories', 'other_ran_cu',
  // Software Licenses (per DC)
  'cu_software_per_dc', '3pp_licenses_per_dc', 'other_ran_software',
  // Installation (per DC)
  'racks_cu_pdu_tor_install', 'all_iptx_config',
];

/**
 * Calculate the multiplier based on driver, scope, and counts
 */
export function getMultiplier(
  driver: string,
  scopeType: string,
  scopeId: string | null,
  counts: NetworkCounts,
  bucket?: string
): number {
  // Check if this bucket should use DU scaling
  if (bucket && DU_SCALED_BUCKETS.includes(bucket)) {
    return scopeType === 'site_archetype' && scopeId
      ? counts.dusByScopeId[scopeId] ?? 0
      : counts.dus;
  }

  switch (driver) {
    case SCALING_DRIVERS.PER_SITE:
      return scopeType === 'site_archetype' && scopeId
        ? counts.sitesByScopeId[scopeId] ?? 0
        : counts.sites;

    case SCALING_DRIVERS.PER_CU:
      return scopeType === 'site_archetype' && scopeId
        ? counts.cusByScopeId[scopeId] ?? 0
        : counts.cus;

    case SCALING_DRIVERS.PER_DC:
      if (scopeType === 'site_archetype' && scopeId) {
        return counts.dcsByScopeId[scopeId] ?? 0;
      }
      return counts.dcs;

    case SCALING_DRIVERS.PER_DU:
      return scopeType === 'site_archetype' && scopeId
        ? counts.dusByScopeId[scopeId] ?? 0
        : counts.dus;

    default:
      return 1;
  }
}

/**
 * Get multiplier for yearly breakdown calculations
 * @param driver - Scaling driver type
 * @param bucket - Bucket name (used for special handling)
 * @param counts - Count object with sites, cus, dcs, dus
 */
export function getMultiplierForCounts(
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
 * Compute network counts from site archetypes
 */
export function computeNetworkCounts(
  siteArchetypes: Array<{
    id: string;
    numSites: number;
    numCus: number;
    numDcs: number;
    numDusPerSite?: number;
  }>
): NetworkCounts {
  const sites = siteArchetypes.reduce((sum, a) => sum + a.numSites, 0);
  const cus = siteArchetypes.reduce((sum, a) => sum + a.numCus, 0);
  const dcs = siteArchetypes.reduce((sum, a) => sum + a.numDcs, 0);
  const dus = siteArchetypes.reduce((sum, a) => sum + (a.numSites * (a.numDusPerSite || 1)), 0);

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

  return {
    sites,
    cus,
    dcs,
    dus,
    sitesByScopeId,
    cusByScopeId,
    dcsByScopeId,
    dusByScopeId,
  };
}
