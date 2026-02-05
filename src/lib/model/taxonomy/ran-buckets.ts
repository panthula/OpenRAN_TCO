/**
 * RAN domain bucket definitions
 */

// ============================================================================
// RAN Site (Cell Site) BoM Buckets
// ============================================================================
export const RanSiteBomBuckets = [
  'du_server',
  'radios',
  'antennas',
  'cell_site_router',
  'gps_equipment',
  'power_systems',
  'outdoor_infrastructure',
  'ancillary_and_passive',
  'other_ran_site',
] as const;
export type RanSiteBomBucket = typeof RanSiteBomBuckets[number];

export const RanSiteBomLabels: Record<RanSiteBomBucket, string> = {
  du_server: 'DU Server (Compute, accelerators, NICs, Ancillaries)',
  radios: 'Radios (Units & Ancillaries)',
  antennas: 'Antennas',
  cell_site_router: 'Cell Site Router',
  gps_equipment: 'GPS Equipment',
  power_systems: 'Power Systems (rectifiers, batteries)',
  outdoor_infrastructure: 'Outdoor Infrastructure (cabinets, racks, cooling)',
  ancillary_and_passive: 'Ancillary & Passive (cables, jumpers, grounding, trays)',
  other_ran_site: 'Other (spares, staging, etc.)',
};

// ============================================================================
// RAN CU-in-DC BoM Buckets
// ============================================================================
export const RanCuDcBomBuckets = [
  'cu_server',
  'switches_tor_oob',
  'iptx_equipment',
  'rack_accessories',
  'other_ran_cu',
] as const;
export type RanCuDcBomBucket = typeof RanCuDcBomBuckets[number];

export const RanCuDcBomLabels: Record<RanCuDcBomBucket, string> = {
  cu_server: 'CU Server (CU-CP, CU-UP servers)',
  switches_tor_oob: 'Switches (TOR, OOB & Support, SW)',
  iptx_equipment: 'IPTX Equipment',
  rack_accessories: 'Rack Accessories (PDUs, cables, jumpers, grounding, trays)',
  other_ran_cu: 'Other (spares, staging, etc.)',
};

// ============================================================================
// RAN Software Buckets
// ============================================================================
export const RanSoftwareBuckets = [
  'du_software_per_site',
  'ru_software_per_site',
  'cu_software_per_dc',
  '3pp_licenses_per_dc',
  'other_ran_software',
] as const;
export type RanSoftwareBucket = typeof RanSoftwareBuckets[number];

// RAN Software - Site buckets (per-site scoped)
export const RanSoftwareSiteBuckets = [
  'du_software_per_site',
  'ru_software_per_site',
] as const;
export type RanSoftwareSiteBucket = typeof RanSoftwareSiteBuckets[number];

// RAN Software - DC buckets (per-DC scoped)
export const RanSoftwareDcBuckets = [
  'cu_software_per_dc',
  '3pp_licenses_per_dc',
  'other_ran_software',
] as const;
export type RanSoftwareDcBucket = typeof RanSoftwareDcBuckets[number];

export const RanSoftwareLabels: Record<RanSoftwareBucket, string> = {
  du_software_per_site: 'DU Software (per site)',
  ru_software_per_site: 'RU Software (per site)',
  cu_software_per_dc: 'CU Software (per DC)',
  '3pp_licenses_per_dc': '3PP Licenses (per DC)',
  other_ran_software: 'Other One-time Licenses',
};

// ============================================================================
// RAN Day 1 Deployment Services
// ============================================================================
export const RanDay1DeploymentBuckets = [
  'ran_engineering_support',
  'core_engineering_support',
  'ip_transport_support',
  'product_support',
] as const;
export type RanDay1DeploymentBucket = typeof RanDay1DeploymentBuckets[number];

export const RanDay1DeploymentLabels: Record<RanDay1DeploymentBucket, string> = {
  ran_engineering_support: 'RAN Engineering Support',
  core_engineering_support: 'Core Engineering Support',
  ip_transport_support: 'IP/Transport Support',
  product_support: 'Product Support',
};

// ============================================================================
// Site OPEX Buckets (Day2)
// ============================================================================
export const SiteOpexBuckets = [
  'lease_per_site',
  'power_per_site',
  'backhaul_per_site',
] as const;
export type SiteOpexBucket = typeof SiteOpexBuckets[number];

export const SiteOpexLabels: Record<SiteOpexBucket, string> = {
  lease_per_site: 'Lease (per site per year)',
  power_per_site: 'Power (per site per year)',
  backhaul_per_site: 'Backhaul (per site per year)',
};

// ============================================================================
// Lifecycle Buckets (Day2)
// ============================================================================
export const LifecycleBuckets = [
  'patching',
  'upgrades',
  'vulnerability_management',
  'capacity_expansion',
  'new_apps_introduction',
] as const;
export type LifecycleBucket = typeof LifecycleBuckets[number];

export const LifecycleLabels: Record<LifecycleBucket, string> = {
  patching: 'Patching',
  upgrades: 'Upgrades',
  vulnerability_management: 'Vulnerability Management',
  capacity_expansion: 'Capacity Expansion',
  new_apps_introduction: 'New xApps/rApps Introduction',
};

// ============================================================================
// Staffing Role Buckets (Day2) - RAN specific
// ============================================================================
export const StaffingRoles = [
  'noc',
  'soc',
  'ran_ops',
  'cloud_ops',
  'oss_automation_ops',
] as const;
export type StaffingRole = typeof StaffingRoles[number];

export const StaffingRoleLabels: Record<StaffingRole, string> = {
  noc: 'NOC',
  soc: 'SOC',
  ran_ops: 'RAN Ops',
  cloud_ops: 'Cloud Ops',
  oss_automation_ops: 'OSS/Automation Ops',
};
