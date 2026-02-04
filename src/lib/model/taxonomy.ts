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

// Cloud/CaaS License Buckets
export const CloudLicenseBuckets = [
  'cloud_native_platform',       // renamed from cloud_platform_base
  'cloud_native_orchestrator',   // NEW
  'cloud_per_du_at_site',
  'cloud_per_cu_server',
  'cloud_per_oss_server',
  'storage_licenses',
] as const;
export type CloudLicenseBucket = typeof CloudLicenseBuckets[number];

export const CloudLicenseLabels: Record<CloudLicenseBucket, string> = {
  cloud_native_platform: 'Cloud Native Platform (CNP)',
  cloud_native_orchestrator: 'Cloud Native Orchestrator (CNO)',
  cloud_per_du_at_site: 'Cloud License (per DU)',
  cloud_per_cu_server: 'Cloud License (per CU)',
  cloud_per_oss_server: 'Cloud License (per OSS Server)',
  storage_licenses: 'Storage Licenses',
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
  // Day0 RAN Network Planning Services (network_global)
  'rf_survey',
  'rf_planning',
  'rf_design',
  'interop_testing',
  'ip_planning',
  'other_ran_planning',
  // Day0 Other Planning
  'cloud_planning',
  'oss_smo_planning',
  'security_planning',
  'acceptance_criteria_dev',
  // Day0 Cloud Design (network_global)
  'cloud_design',
  'cloud_architecture',
  // Day0 OSS Planning (network_global)
  'oss_dimensioning',
  'oss_planning',
  // Day1 Installation
  'site_installation',
  'racks_cu_pdu_tor_install',
  'all_iptx_config',
  'du_config',
  'iptx_config',
  'site_acceptance_testing',
  'cluster_acceptance_testing',
  'network_acceptance_testing',
  'drive_tests',
  'security_validation',
  // Day1 Cloud
  'cloud_deployment_services',
  'cluster_bringup',
  'cicd_pipeline_setup',
  'observability_setup',
  // Day1 OSS Installation (fixed)
  'oss_server_install',
  'oss_server_sw_onboarding',
  // Day1 OSS Integration (per_integration)
  'oss_ran_integration',
  'oss_transport_integration',
  'oss_mw_integration',
  'oss_northbound_integration',
  'oss_southbound_integration',
  'oss_other_integration',
  // Day1 RAN Integration
  'site_integration',
  'core_integration',
  'other_integration',
] as const;
export type ServicesBucket = typeof ServicesBuckets[number];

export const ServicesBucketLabels: Record<ServicesBucket, string> = {
  // Day0 RAN Network Planning Services
  rf_survey: 'RF Survey',
  rf_planning: 'RF Planning',
  rf_design: 'RF Design',
  interop_testing: 'InterOp Testing',
  ip_planning: 'IP Planning',
  other_ran_planning: 'Other RAN Planning',
  // Day0 Other Planning
  cloud_planning: 'Cloud Planning',
  oss_smo_planning: 'OSS/SMO Planning',
  security_planning: 'Security Planning',
  acceptance_criteria_dev: 'Acceptance Criteria Development',
  // Day0 Cloud Design
  cloud_design: 'Cloud Design',
  cloud_architecture: 'Cloud Architecture Planning',
  // Day0 OSS Planning
  oss_dimensioning: 'OSS Dimensioning',
  oss_planning: 'OSS Planning',
  // Day1 Installation
  site_installation: 'Site Equipment Install',
  racks_cu_pdu_tor_install: 'Racks/CU/PDU/TOR Install',
  all_iptx_config: 'All IPTX Config',
  du_config: 'DU Config',
  iptx_config: 'IPTX Config',
  site_acceptance_testing: 'Site Acceptance Testing',
  cluster_acceptance_testing: 'Cluster Acceptance Testing',
  network_acceptance_testing: 'Network Acceptance Testing',
  drive_tests: 'Drive Tests',
  security_validation: 'Security Validation',
  // Day1 Cloud
  cloud_deployment_services: 'Cloud Deployment Services',
  cluster_bringup: 'Cluster Bring-up',
  cicd_pipeline_setup: 'CI/CD Pipeline Setup',
  observability_setup: 'Observability Baseline Setup',
  // Day1 OSS Installation (fixed)
  oss_server_install: 'OSS Servers (Install)',
  oss_server_sw_onboarding: 'OSS Servers (SW Onboarding)',
  // Day1 OSS Integration (per_integration)
  oss_ran_integration: 'RAN Integrations',
  oss_transport_integration: 'Transport Integrations',
  oss_mw_integration: 'MW Integrations',
  oss_northbound_integration: 'North Bound Integrations',
  oss_southbound_integration: 'South Bound Integrations',
  oss_other_integration: 'Other Integrations',
  // Day1 RAN Integration
  site_integration: 'Site Integration',
  core_integration: 'CORE Integration',
  other_integration: 'Other Integration',
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

// RAN Day 1 Deployment Services (network_global, per_year_deployment)
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

// Cloud Day 1 Deployment Services (network_global, per_year_deployment)
export const CloudDay1DeploymentBuckets = [
  'cloud_deployment_support',
  'other_cloud_caas_support',
] as const;
export type CloudDay1DeploymentBucket = typeof CloudDay1DeploymentBuckets[number];

export const CloudDay1DeploymentLabels: Record<CloudDay1DeploymentBucket, string> = {
  cloud_deployment_support: 'Cloud Deployment Support',
  other_cloud_caas_support: 'Other Cloud/CaaS Support',
};

// OSS Day 1 Deployment Services (network_global, per_year_deployment)
export const OssDay1DeploymentBuckets = [
  'oss_deployment_support',
  'rapp_development_support',
  'oss_integration_support',
] as const;
export type OssDay1DeploymentBucket = typeof OssDay1DeploymentBuckets[number];

export const OssDay1DeploymentLabels: Record<OssDay1DeploymentBucket, string> = {
  oss_deployment_support: 'OSS Deployment Support',
  rapp_development_support: 'rApp Development Support',
  oss_integration_support: 'OSS Integration Support',
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
  | PlatformOpsBucket
  | RanDay1DeploymentBucket
  | CloudDay1DeploymentBucket
  | OssDay1DeploymentBucket
  | OssInstallationBucket
  | OssIntegrationBucket;

// ============================================================================
// Axis 5: Scope Types
// ============================================================================
export const ScopeTypes = ['site_archetype', 'network_global'] as const;
export type ScopeType = typeof ScopeTypes[number];

export const ScopeTypeLabels: Record<ScopeType, string> = {
  site_archetype: 'Per Site Archetype',
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
// Default Cost Rates
// ============================================================================
export const DefaultCostRates = {
  /** Annual maintenance rate for perpetual software licenses (15%) */
  SOFTWARE_PERPETUAL_MAINTENANCE_RATE: 0.15,
} as const;

// ============================================================================
// OSS Day 1 Installation & Integration Buckets
// (Defined here before InputConfigurations since they're referenced there)
// ============================================================================

/**
 * OSS Day 1 Installation buckets (fixed driver)
 */
export const OssInstallationBuckets = [
  'oss_server_install',
  'oss_server_sw_onboarding',
] as const;
export type OssInstallationBucket = typeof OssInstallationBuckets[number];

export const OssInstallationLabels: Record<OssInstallationBucket, string> = {
  oss_server_install: 'OSS Servers (Install)',
  oss_server_sw_onboarding: 'OSS Servers (SW Onboarding)',
};

/**
 * OSS Day 1 Integration buckets (per_integration driver with count × value)
 */
export const OssIntegrationBuckets = [
  'oss_ran_integration',
  'oss_transport_integration',
  'oss_mw_integration',
  'oss_northbound_integration',
  'oss_southbound_integration',
  'oss_other_integration',
] as const;
export type OssIntegrationBucket = typeof OssIntegrationBuckets[number];

export const OssIntegrationLabels: Record<OssIntegrationBucket, string> = {
  oss_ran_integration: 'RAN Integrations',
  oss_transport_integration: 'Transport Integrations',
  oss_mw_integration: 'MW Integrations',
  oss_northbound_integration: 'North Bound Integrations',
  oss_southbound_integration: 'South Bound Integrations',
  oss_other_integration: 'Other Integrations',
};

/**
 * Combined OSS Day 1 Services buckets for export
 */
export const OssDay1ServicesBuckets = [
  ...OssInstallationBuckets,
  ...OssIntegrationBuckets,
] as const;

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
  { day: 'day0', domain: 'ran', layer: 'hardware_bom', buckets: RanCuDcBomBuckets, defaultDriver: 'per_cu', defaultScope: 'site_archetype' },
  
  // Day0 RAN Software
  { day: 'day0', domain: 'ran', layer: 'software', buckets: RanSoftwareBuckets, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  
  // Day0 RAN Services - Network Planning Services (network_global)
  { day: 'day0', domain: 'ran', layer: 'services', buckets: ['rf_survey', 'rf_planning', 'rf_design', 'interop_testing', 'ip_planning', 'other_ran_planning'] as const, defaultDriver: 'fixed', defaultScope: 'network_global' },
  
  // Day0 Cloud
  { day: 'day0', domain: 'cloud', layer: 'software', buckets: CloudLicenseBuckets, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  // Day0 Cloud Services - Cloud Design (network_global)
  { day: 'day0', domain: 'cloud', layer: 'services', buckets: ['cloud_design', 'cloud_architecture'] as const, defaultDriver: 'fixed', defaultScope: 'network_global' },
  
  // Day0 OSS Hardware
  { day: 'day0', domain: 'oss', layer: 'hardware_bom', buckets: OssBomBuckets, defaultDriver: 'per_server', defaultScope: 'network_global' },
  
  // Day0 OSS Software
  { day: 'day0', domain: 'oss', layer: 'software', buckets: OssSoftwareBuckets, defaultDriver: 'per_license_unit', defaultScope: 'network_global' },
  // Day0 OSS Services - OSS Planning (network_global)
  { day: 'day0', domain: 'oss', layer: 'services', buckets: ['oss_dimensioning', 'oss_planning'] as const, defaultDriver: 'fixed', defaultScope: 'network_global' },
  
  // Day1 RAN Services (Installation & Integration)
  { day: 'day1', domain: 'ran', layer: 'services', buckets: ['site_installation', 'racks_cu_pdu_tor_install', 'all_iptx_config', 'du_config', 'iptx_config', 'site_acceptance_testing', 'cluster_acceptance_testing', 'network_acceptance_testing', 'drive_tests', 'security_validation', 'site_integration', 'core_integration', 'other_integration'] as const, defaultDriver: 'per_site', defaultScope: 'site_archetype' },
  
  // Day1 Cloud Services (per_dc, site_archetype)
  { day: 'day1', domain: 'cloud', layer: 'services', buckets: ['cloud_deployment_services', 'cluster_bringup', 'cicd_pipeline_setup', 'observability_setup'] as const, defaultDriver: 'per_dc', defaultScope: 'site_archetype' },

  // Day1 OSS Installation Services (network-global, fixed)
  { day: 'day1', domain: 'oss', layer: 'services', buckets: OssInstallationBuckets, defaultDriver: 'fixed', defaultScope: 'network_global' },
  // Day1 OSS Integration Services (network-global, per_integration)
  { day: 'day1', domain: 'oss', layer: 'services', buckets: OssIntegrationBuckets, defaultDriver: 'per_integration', defaultScope: 'network_global' },

  // Day1 Deployment Services (per_year_deployment, network_global)
  { day: 'day1', domain: 'ran', layer: 'services', buckets: RanDay1DeploymentBuckets, defaultDriver: 'per_year_deployment', defaultScope: 'network_global' },
  { day: 'day1', domain: 'cloud', layer: 'services', buckets: CloudDay1DeploymentBuckets, defaultDriver: 'per_year_deployment', defaultScope: 'network_global' },
  { day: 'day1', domain: 'oss', layer: 'services', buckets: OssDay1DeploymentBuckets, defaultDriver: 'per_year_deployment', defaultScope: 'network_global' },
  
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
// Bucket Groups (for collapsible sections in network_global tables)
// ============================================================================

/**
 * BucketGroup defines a collapsible group of buckets within a network_global table.
 * Used to organize related items (e.g., RF Services, Other Planning Services).
 */
export interface BucketGroup {
  id: string;
  label: string;
  buckets: readonly string[];
}

/**
 * Network Planning bucket groups for the RAN Day 0 services table.
 * Groups RF-related services separately from other planning services.
 */
export const NetworkPlanningBucketGroups: BucketGroup[] = [
  {
    id: 'rf_services',
    label: 'RF Services',
    buckets: ['rf_survey', 'rf_planning', 'rf_design'],
  },
  {
    id: 'other_planning',
    label: 'Other Planning Services',
    buckets: ['interop_testing', 'ip_planning', 'other_ran_planning'],
  },
];

/**
 * Cloud License bucket groups for the Cloud Day 0 licensing table.
 * Groups platform licenses (one-time) separately from unit licenses.
 */
export const CloudLicenseBucketGroups: BucketGroup[] = [
  {
    id: 'platform_licenses',
    label: 'Platform Licenses (One-Time)',
    buckets: ['cloud_native_platform', 'cloud_native_orchestrator'],
  },
  {
    id: 'unit_licenses',
    label: 'Unit Licenses',
    buckets: ['cloud_per_du_at_site', 'cloud_per_cu_server', 'cloud_per_oss_server', 'storage_licenses'],
  },
];

/**
 * OSS Day 1 Services bucket groups for collapsible sections
 */
export const OssDay1ServicesBucketGroups: BucketGroup[] = [
  {
    id: 'oss_installation',
    label: 'OSS Installation',
    buckets: OssInstallationBuckets,
  },
  {
    id: 'oss_integrations',
    label: 'OSS Integration',
    buckets: OssIntegrationBuckets,
  },
];

/**
 * OSS Hardware BoM bucket groups for Day 0 hardware table
 */
export const OssBomBucketGroups: BucketGroup[] = [
  {
    id: 'oss_core_servers',
    label: 'Core Platform Servers',
    buckets: ['site_mgmt_servers', 'intelligent_ops_servers', 'platform_apps_servers'],
  },
  {
    id: 'oss_cloud_servers',
    label: 'Cloud Native Servers',
    buckets: ['cnp_platform_servers', 'cns_platform_servers', 'other_oss_servers'],
  },
];

/**
 * OSS Software bucket groups for Day 0 software licensing table
 */
export const OssSoftwareBucketGroups: BucketGroup[] = [
  {
    id: 'oss_core_software',
    label: 'Core OSS Applications',
    buckets: ['site_manager', 'netpulse', 'inventory_manager', 'fault_monitoring', 'performance_monitoring', 'configuration_manager', 'service_desk', 'network_navigator'],
  },
  {
    id: 'smo_platform',
    label: 'SMO Platform',
    buckets: ['smo_orchestrator'],
  },
  {
    id: 'ric_platform',
    label: 'RIC Platform',
    buckets: ['non_rt_ric', 'near_rt_ric', 'rapps_license', 'xapps_license'],
  },
  {
    id: 'ai_other_software',
    label: 'AI & Other',
    buckets: ['ai_platform_license', 'other_oss_software'],
  },
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
    RanDay1DeploymentLabels[bucket as RanDay1DeploymentBucket] ||
    CloudDay1DeploymentLabels[bucket as CloudDay1DeploymentBucket] ||
    OssDay1DeploymentLabels[bucket as OssDay1DeploymentBucket] ||
    OssInstallationLabels[bucket as OssInstallationBucket] ||
    OssIntegrationLabels[bucket as OssIntegrationBucket] ||
    bucket
  );
}

