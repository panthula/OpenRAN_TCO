/**
 * OpenRAN TCO Taxonomy
 * Canonical definitions for all bucket keys, domains, day segmentation, units, and scaling drivers.
 * Maps every item from OpenRAN_TCO_Master_Plan.md into a queryable structure.
 */

// ============================================================================
// Axis 1: Day Segmentation
// ============================================================================
export const Days = ['day0', 'day1', 'day2'] as const;
export type Day = typeof Days[number];

export const DayLabels: Record<Day, string> = {
  day0: 'Day 0 - Design + Procurement + Platform',
  day1: 'Day 1 - Build, Install, Integrate',
  day2: 'Day 2 - Operations',
};

// ============================================================================
// Axis 2: Domain
// ============================================================================
export const Domains = ['ran', 'cloud', 'oss'] as const;
export type Domain = typeof Domains[number];

export const DomainLabels: Record<Domain, string> = {
  ran: 'RAN',
  cloud: 'Cloud/CaaS',
  oss: 'OSS/SMO/RIC',
};

// ============================================================================
// Axis 3: Layer
// ============================================================================
export const Layers = [
  'hardware_bom',
  'software',
  'services',
  'staffing',
  'site_opex',
  'lifecycle',
  'assumptions',
] as const;
export type Layer = typeof Layers[number];

export const LayerLabels: Record<Layer, string> = {
  hardware_bom: 'Hardware BoM',
  software: 'Software Licenses',
  services: 'Services & Integration',
  staffing: 'Staffing',
  site_opex: 'Site OPEX',
  lifecycle: 'Lifecycle',
  assumptions: 'Assumptions',
};

// ============================================================================
// Axis 4: Bucket Keys (Standardized from Master Plan)
// ============================================================================

// RAN Site (Cell Site) BoM Buckets
export const RanSiteBomBuckets = [
  'du_server',
  'radios',
  'antennas',
  'cell_site_router_or_fh_switch',
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
  cell_site_router_or_fh_switch: 'Cell Site Router / Fronthaul Switch',
  gps_equipment: 'GPS Equipment',
  power_systems: 'Power Systems (rectifiers, batteries)',
  outdoor_infrastructure: 'Outdoor Infrastructure (cabinets, racks, cooling)',
  ancillary_and_passive: 'Ancillary & Passive (cables, jumpers, grounding, trays)',
  other_ran_site: 'Other (spares, staging, etc.)',
};

// RAN CU-in-DC BoM Buckets
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

// OSS BoM Buckets (Server Categories)
export const OssBomBuckets = [
  'site_mgmt_servers',
  'intelligent_ops_servers',
  'platform_apps_servers',
  'cnp_platform_servers',
  'cns_platform_servers',
  'other_oss_servers',
] as const;
export type OssBomBucket = typeof OssBomBuckets[number];

export const OssBomLabels: Record<OssBomBucket, string> = {
  site_mgmt_servers: 'Site Management Servers',
  intelligent_ops_servers: 'Intelligent Operations Servers',
  platform_apps_servers: 'Platform Applications Servers',
  cnp_platform_servers: 'CNP Platform Servers',
  cns_platform_servers: 'CNS Platform Servers',
  other_oss_servers: 'Other OSS Servers',
};

// RAN Software Buckets (all)
export const RanSoftwareBuckets = [
  'du_software_per_site',
  'ru_software_per_site',
  'cu_software_per_cu',
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
  'cu_software_per_cu',
  '3pp_licenses_per_dc',
  'other_ran_software',
] as const;
export type RanSoftwareDcBucket = typeof RanSoftwareDcBuckets[number];

export const RanSoftwareLabels: Record<RanSoftwareBucket, string> = {
  du_software_per_site: 'DU Software (per site)',
  ru_software_per_site: 'RU Software (per site)',
  cu_software_per_cu: 'CU Software (per DC)',
  '3pp_licenses_per_dc': '3PP Licenses (per DC)',
  other_ran_software: 'Other One-time Licenses',
};

// Cloud/CaaS License Buckets
export const CloudLicenseBuckets = [
  'cloud_per_du_at_site',
  'cloud_per_cu_server',
  'cloud_per_oss_server',
  'storage_licenses',
  'cloud_platform_base',
] as const;
export type CloudLicenseBucket = typeof CloudLicenseBuckets[number];

export const CloudLicenseLabels: Record<CloudLicenseBucket, string> = {
  cloud_per_du_at_site: 'Cloud License (per DU at Site)',
  cloud_per_cu_server: 'Cloud License (per CU Server)',
  cloud_per_oss_server: 'Cloud License (per OSS Server)',
  storage_licenses: 'Storage Licenses',
  cloud_platform_base: 'Cloud Platform Base License',
};

// OSS/SMO/RIC Software Buckets
export const OssSoftwareBuckets = [
  'site_manager',
  'netpulse',
  'inventory_manager',
  'fault_monitoring',
  'performance_monitoring',
  'configuration_manager',
  'service_desk',
  'network_navigator',
  'smo_orchestrator',
  'non_rt_ric',
  'near_rt_ric',
  'rapps_license',
  'xapps_license',
  'ai_platform_license',
  'other_oss_software',
] as const;
export type OssSoftwareBucket = typeof OssSoftwareBuckets[number];

export const OssSoftwareLabels: Record<OssSoftwareBucket, string> = {
  site_manager: 'Site Manager',
  netpulse: 'NetPulse',
  inventory_manager: 'Inventory Manager',
  fault_monitoring: 'Fault Monitoring',
  performance_monitoring: 'Performance Monitoring',
  configuration_manager: 'Configuration Manager',
  service_desk: 'Service Desk',
  network_navigator: 'Network Navigator',
  smo_orchestrator: 'SMO Orchestrator',
  non_rt_ric: 'Non-RT RIC + rApps',
  near_rt_ric: 'Near-RT RIC + xApps',
  rapps_license: 'rApps Licenses',
  xapps_license: 'xApps Licenses',
  ai_platform_license: 'AI Platform License',
  other_oss_software: 'Other OSS Software',
};

// Services Buckets (Day0/Day1)
export const ServicesBuckets = [
  // Day0 Planning & Engineering
  'rf_planning',
  'ip_sync_planning',
  'cloud_planning',
  'oss_smo_planning',
  'security_planning',
  'acceptance_criteria_dev',
  // Day1 Installation
  'site_installation',
  'dc_installation',
  'ru_du_cu_commissioning',
  'transport_fiber_integration',
  'automation_ztp_enablement',
  'site_acceptance_testing',
  'cluster_acceptance_testing',
  'network_acceptance_testing',
  'drive_tests',
  'security_validation',
  // Day1 Cloud
  'cluster_bringup',
  'cicd_pipeline_setup',
  'observability_setup',
  // Day1 OSS
  'oss_installation',
  'oss_integration',
  'oss_automation_ztp',
] as const;
export type ServicesBucket = typeof ServicesBuckets[number];

export const ServicesBucketLabels: Record<ServicesBucket, string> = {
  rf_planning: 'RF Planning',
  ip_sync_planning: 'IP/Sync Planning',
  cloud_planning: 'Cloud Planning',
  oss_smo_planning: 'OSS/SMO Planning',
  security_planning: 'Security Planning',
  acceptance_criteria_dev: 'Acceptance Criteria Development',
  site_installation: 'Site Installation (labor, rigging)',
  dc_installation: 'DC Installation (CU racks)',
  ru_du_cu_commissioning: 'RU/DU/CU Commissioning',
  transport_fiber_integration: 'Transport/Fiber Integration',
  automation_ztp_enablement: 'Automation/ZTP Enablement',
  site_acceptance_testing: 'Site Acceptance Testing',
  cluster_acceptance_testing: 'Cluster Acceptance Testing',
  network_acceptance_testing: 'Network Acceptance Testing',
  drive_tests: 'Drive Tests',
  security_validation: 'Security Validation',
  cluster_bringup: 'Cluster Bring-up',
  cicd_pipeline_setup: 'CI/CD Pipeline Setup',
  observability_setup: 'Observability Baseline Setup',
  oss_installation: 'OSS Physical Installation',
  oss_integration: 'OSS Integration & Commissioning',
  oss_automation_ztp: 'OSS Automation/ZTP Integrations',
};

// Site OPEX Buckets (Day2)
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

// Lifecycle Buckets (Day2)
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

// Staffing Role Buckets (Day2)
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

// Platform Operations Buckets (Day2)
export const PlatformOpsBuckets = [
  'observability_ops',
  'cicd_ops',
  'security_ops',
  'backup_dr',
] as const;
export type PlatformOpsBucket = typeof PlatformOpsBuckets[number];

export const PlatformOpsLabels: Record<PlatformOpsBucket, string> = {
  observability_ops: 'Observability Operations',
  cicd_ops: 'CI/CD Operations',
  security_ops: 'Security Operations',
  backup_dr: 'Backup/DR',
};

// All Buckets combined type
export type Bucket =
  | RanSiteBomBucket
  | RanCuDcBomBucket
  | OssBomBucket
  | RanSoftwareBucket
  | CloudLicenseBucket
  | OssSoftwareBucket
  | ServicesBucket
  | SiteOpexBucket
  | LifecycleBucket
  | StaffingRole
  | PlatformOpsBucket;

// ============================================================================
// Axis 5: Scope Types
// ============================================================================
export const ScopeTypes = ['site_archetype', 'dc_type', 'network_global'] as const;
export type ScopeType = typeof ScopeTypes[number];

export const ScopeTypeLabels: Record<ScopeType, string> = {
  site_archetype: 'Per Site Archetype',
  dc_type: 'Per DC Type',
  network_global: 'Network-wide Global',
};

// ============================================================================
// Axis 6: Scaling Drivers
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
// Cost Types
// ============================================================================
export const CostTypes = ['capex', 'opex'] as const;
export type CostType = typeof CostTypes[number];

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

// ============================================================================
// Staffing Model Parameters
// ============================================================================
export interface StaffingDrivers {
  coverage_factor: number; // e.g., 24x7 multiplier
  events_per_site_per_period: number;
  auto_remediation_pct: number;
  auto_containment_pct: number;
  handling_time_minutes: number;
  complexity_multiplier: number;
}

// ============================================================================
// Global Model Assumptions
// ============================================================================
export interface ModelAssumptions {
  tco_years: number; // default 5
  discount_rate: number; // default 0.08
  currency: Currency;
  inflation_rate?: number;
  escalation_rate?: number;
  perpetual_spread_years?: number; // optional spreading
}

export const DefaultModelAssumptions: ModelAssumptions = {
  tco_years: 5,
  discount_rate: 0.08,
  currency: 'USD',
};

// ============================================================================
// Default Staffing Drivers
// ============================================================================
export const DefaultStaffingDrivers: StaffingDrivers = {
  coverage_factor: 4.2, // 24x7 coverage
  events_per_site_per_period: 10,
  auto_remediation_pct: 0.6,
  auto_containment_pct: 0.4,
  handling_time_minutes: 30,
  complexity_multiplier: 1.0,
};

// ============================================================================
// Input Configuration Mapping
// Maps which buckets are valid for which Day/Domain/Layer combinations
// ============================================================================
export interface InputConfig {
  day: Day;
  domain: Domain;
  layer: Layer;
  buckets: readonly Bucket[];
  defaultDriver: ScalingDriver;
  defaultScope: ScopeType;
}

export const InputConfigurations: InputConfig[] = [
  // Day0 RAN Hardware
  { day: 'day0', domain: 'ran', layer: 'hardware_bom', buckets: RanSiteBomBuckets, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  { day: 'day0', domain: 'ran', layer: 'hardware_bom', buckets: RanCuDcBomBuckets, defaultDriver: 'per_cu', defaultScope: 'dc_type' },
  
  // Day0 RAN Software
  { day: 'day0', domain: 'ran', layer: 'software', buckets: RanSoftwareBuckets, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  
  // Day0 RAN Services (Planning)
  { day: 'day0', domain: 'ran', layer: 'services', buckets: ['rf_planning', 'ip_sync_planning', 'security_planning', 'acceptance_criteria_dev'] as const, defaultDriver: 'fixed', defaultScope: 'network_global' },
  
  // Day0 Cloud
  { day: 'day0', domain: 'cloud', layer: 'software', buckets: CloudLicenseBuckets, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  { day: 'day0', domain: 'cloud', layer: 'services', buckets: ['cloud_planning', 'cluster_bringup'] as const, defaultDriver: 'fixed', defaultScope: 'network_global' },
  
  // Day0 OSS Hardware
  { day: 'day0', domain: 'oss', layer: 'hardware_bom', buckets: OssBomBuckets, defaultDriver: 'per_server', defaultScope: 'dc_type' },
  
  // Day0 OSS Software
  { day: 'day0', domain: 'oss', layer: 'software', buckets: OssSoftwareBuckets, defaultDriver: 'per_license_unit', defaultScope: 'network_global' },
  { day: 'day0', domain: 'oss', layer: 'services', buckets: ['oss_smo_planning'] as const, defaultDriver: 'fixed', defaultScope: 'network_global' },
  
  // Day1 RAN Services (Installation & Integration)
  { day: 'day1', domain: 'ran', layer: 'services', buckets: ['site_installation', 'dc_installation', 'ru_du_cu_commissioning', 'transport_fiber_integration', 'automation_ztp_enablement', 'site_acceptance_testing', 'cluster_acceptance_testing', 'network_acceptance_testing', 'drive_tests', 'security_validation'] as const, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  
  // Day1 Cloud Services
  { day: 'day1', domain: 'cloud', layer: 'services', buckets: ['cluster_bringup', 'cicd_pipeline_setup', 'observability_setup'] as const, defaultDriver: 'per_dc', defaultScope: 'dc_type' },
  
  // Day1 OSS Services
  { day: 'day1', domain: 'oss', layer: 'services', buckets: ['oss_installation', 'oss_integration', 'oss_automation_ztp'] as const, defaultDriver: 'per_dc', defaultScope: 'dc_type' },
  
  // Day2 RAN Site OPEX
  { day: 'day2', domain: 'ran', layer: 'site_opex', buckets: SiteOpexBuckets, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  
  // Day2 RAN Software (Support)
  { day: 'day2', domain: 'ran', layer: 'software', buckets: RanSoftwareBuckets, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  
  // Day2 RAN Lifecycle
  { day: 'day2', domain: 'ran', layer: 'lifecycle', buckets: LifecycleBuckets, defaultDriver: 'per_year', defaultScope: 'network_global' },
  
  // Day2 Cloud Operations
  { day: 'day2', domain: 'cloud', layer: 'services', buckets: PlatformOpsBuckets, defaultDriver: 'per_year', defaultScope: 'network_global' },
  { day: 'day2', domain: 'cloud', layer: 'software', buckets: CloudLicenseBuckets, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  
  // Day2 OSS Software (Support)
  { day: 'day2', domain: 'oss', layer: 'software', buckets: OssSoftwareBuckets, defaultDriver: 'per_license_unit', defaultScope: 'network_global' },
  
  // Day2 Staffing (Cross-domain)
  { day: 'day2', domain: 'ran', layer: 'staffing', buckets: ['ran_ops'] as const, defaultDriver: 'per_year', defaultScope: 'network_global' },
  { day: 'day2', domain: 'cloud', layer: 'staffing', buckets: ['cloud_ops'] as const, defaultDriver: 'per_year', defaultScope: 'network_global' },
  { day: 'day2', domain: 'oss', layer: 'staffing', buckets: ['noc', 'soc', 'oss_automation_ops'] as const, defaultDriver: 'per_year', defaultScope: 'network_global' },
];

// ============================================================================
// Utility Functions
// ============================================================================

export function getBucketLabel(bucket: Bucket): string {
  return (
    RanSiteBomLabels[bucket as RanSiteBomBucket] ||
    RanCuDcBomLabels[bucket as RanCuDcBomBucket] ||
    OssBomLabels[bucket as OssBomBucket] ||
    RanSoftwareLabels[bucket as RanSoftwareBucket] ||
    CloudLicenseLabels[bucket as CloudLicenseBucket] ||
    OssSoftwareLabels[bucket as OssSoftwareBucket] ||
    ServicesBucketLabels[bucket as ServicesBucket] ||
    SiteOpexLabels[bucket as SiteOpexBucket] ||
    LifecycleLabels[bucket as LifecycleBucket] ||
    StaffingRoleLabels[bucket as StaffingRole] ||
    PlatformOpsLabels[bucket as PlatformOpsBucket] ||
    bucket
  );
}

export function getConfigsForDay(day: Day): InputConfig[] {
  return InputConfigurations.filter(c => c.day === day);
}

export function getConfigsForDomain(domain: Domain): InputConfig[] {
  return InputConfigurations.filter(c => c.domain === domain);
}

export function getConfigsForDayAndDomain(day: Day, domain: Domain): InputConfig[] {
  return InputConfigurations.filter(c => c.day === day && c.domain === domain);
}

