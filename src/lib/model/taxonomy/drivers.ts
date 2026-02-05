/**
 * Scaling drivers, adjustment types, and related definitions
 */

// ============================================================================
// Scaling Drivers
// ============================================================================
export const ScalingDrivers = [
  'per_site',
  'per_cu',
  'per_dc',
  'per_server',
  'per_cluster',
  'per_license_unit',
  'per_rapp',
  'per_xapp',
  'per_integration',
  'fixed',
  'per_year',
  'per_year_deployment',
] as const;
export type ScalingDriver = typeof ScalingDrivers[number];

export const ScalingDriverLabels: Record<ScalingDriver, string> = {
  per_site: 'Per Site',
  per_cu: 'Per CU',
  per_dc: 'Per DC',
  per_server: 'Per Server',
  per_cluster: 'Per Cluster',
  per_license_unit: 'Per License Unit',
  per_rapp: 'Per rApp',
  per_xapp: 'Per xApp',
  per_integration: 'Per Integration',
  fixed: 'Fixed',
  per_year: 'Per Year',
  per_year_deployment: 'Per Year (Deployment)',
};

// ============================================================================
// Adjustment Types
// ============================================================================
export const AdjustmentTypes = ['percentage', 'fixed', 'replace'] as const;
export type AdjustmentType = typeof AdjustmentTypes[number];

export const AdjustmentTypeLabels: Record<AdjustmentType, string> = {
  percentage: 'Percentage Change',
  fixed: 'Fixed Amount',
  replace: 'Replace Value',
};

// ============================================================================
// License Models
// ============================================================================
export const LicenseModels = ['perpetual', 'subscription'] as const;
export type LicenseModel = typeof LicenseModels[number];

export const LicenseModelLabels: Record<LicenseModel, string> = {
  perpetual: 'Perpetual (Day0 CAPEX + Day2 Support)',
  subscription: 'Subscription (Day2 OPEX)',
};

// ============================================================================
// Currency
// ============================================================================
export const Currencies = ['USD', 'EUR', 'GBP'] as const;
export type Currency = typeof Currencies[number];

// ============================================================================
// DC Types
// ============================================================================
export const DcTypes = ['edge', 'regional', 'central'] as const;
export type DcTypeKey = typeof DcTypes[number];

export const DcTypeLabels: Record<DcTypeKey, string> = {
  edge: 'Edge DC',
  regional: 'Regional DC',
  central: 'Central DC',
};
