/**
 * Domain Summary Configuration
 *
 * Centralized configuration for domain-specific bucket groupings
 * used in summary components.
 */

import type { Domain, Bucket } from '@/lib/model/taxonomy';

// =============================================================================
// Bucket Group Interface
// =============================================================================

export interface BucketGroup {
  key: string;
  label: string;
  buckets: string[];
}

export interface DaySummaryDetails {
  day0: BucketGroup[];
  day1: BucketGroup[];
  day2: BucketGroup[];
}

export interface DomainSummaryConfig {
  domain: Domain;
  /** Bucket groups for each day's detail breakdown */
  bucketGroups: DaySummaryDetails;
  /** Buckets that always have multiplier = 1 (fixed cost, not scaled) */
  fixedMultiplierBuckets: string[];
  /** Buckets that should use DC count as multiplier (regardless of stored driver) */
  dcScopedBuckets: string[];
  /** Buckets that scale by DU count (sites × numDusPerSite) */
  duScaledBuckets: string[];
  /** Custom bucket multiplier overrides (bucket -> driver override) */
  bucketDriverOverrides?: Record<string, string>;
}

// =============================================================================
// RAN Domain Configuration
// =============================================================================

// Day 0 - Hardware & Software
const RAN_SITE_HW_BOM_BUCKETS = ['du_server', 'radios', 'antennas', 'cell_site_router',
  'gps_equipment', 'power_systems', 'outdoor_infrastructure', 'ancillary_and_passive', 'other_ran_site'];
const RAN_CU_DC_HW_BOM_BUCKETS = ['cu_server', 'switches_tor_oob', 'iptx_equipment', 'rack_accessories', 'other_ran_cu'];
const RAN_SITE_SOFTWARE_BUCKETS = ['du_software_per_site', 'ru_software_per_site'];
const RAN_CU_DC_SOFTWARE_BUCKETS = ['cu_software_per_dc', '3pp_licenses_per_dc', 'other_ran_software'];

// Day 0 - Services (Network Planning)
const RAN_DAY0_SERVICES_BUCKETS = ['rf_survey', 'rf_planning', 'rf_design', 'interop_testing', 'ip_planning', 'other_ran_planning'];

// Day 1 - Installation & Integration
const RAN_SITE_INSTALLATION_BUCKETS = ['site_installation', 'du_config', 'iptx_config'];
const RAN_CU_INSTALLATION_BUCKETS = ['racks_cu_pdu_tor_install', 'all_iptx_config'];
const RAN_TESTING_BUCKETS = ['site_acceptance_testing', 'cluster_acceptance_testing',
  'network_acceptance_testing', 'drive_tests', 'security_validation'];
const RAN_INTEGRATION_BUCKETS = ['site_integration', 'core_integration', 'other_integration'];

// Fixed multiplier buckets (always multiplier = 1)
const RAN_FIXED_MULTIPLIER_BUCKETS = [
  'cluster_acceptance_testing',
  'network_acceptance_testing',
  'drive_tests',
  'security_validation',
  'core_integration',
  'other_integration',
];

// DC scoped buckets (use DC count as multiplier)
const RAN_DC_SCOPED_BUCKETS = [
  ...RAN_CU_DC_HW_BOM_BUCKETS,
  ...RAN_CU_DC_SOFTWARE_BUCKETS,
  ...RAN_CU_INSTALLATION_BUCKETS,
];

export const RAN_SUMMARY_CONFIG: DomainSummaryConfig = {
  domain: 'ran',
  bucketGroups: {
    day0: [
      { key: 'siteHwBom', label: 'Hardware BoM (Site)', buckets: RAN_SITE_HW_BOM_BUCKETS },
      { key: 'cuDcHwBom', label: 'Hardware (per DC)', buckets: RAN_CU_DC_HW_BOM_BUCKETS },
      { key: 'siteSoftware', label: 'Software Licenses (Site)', buckets: RAN_SITE_SOFTWARE_BUCKETS },
      { key: 'cuDcSoftware', label: 'Software Licenses (per DC)', buckets: RAN_CU_DC_SOFTWARE_BUCKETS },
      { key: 'services', label: 'Network Planning Services', buckets: RAN_DAY0_SERVICES_BUCKETS },
    ],
    day1: [
      { key: 'siteInstallation', label: 'Installation (Site)', buckets: RAN_SITE_INSTALLATION_BUCKETS },
      { key: 'cuInstallation', label: 'Installation (per DC)', buckets: RAN_CU_INSTALLATION_BUCKETS },
      { key: 'testing', label: 'Testing & Acceptance', buckets: RAN_TESTING_BUCKETS },
      { key: 'integration', label: 'Integration', buckets: RAN_INTEGRATION_BUCKETS },
    ],
    day2: [],
  },
  fixedMultiplierBuckets: RAN_FIXED_MULTIPLIER_BUCKETS,
  dcScopedBuckets: RAN_DC_SCOPED_BUCKETS,
  duScaledBuckets: [],
};

// =============================================================================
// Cloud Domain Configuration
// =============================================================================

// Day 0 - Platform Licenses (One-Time)
const CLOUD_PLATFORM_LICENSE_BUCKETS = ['cloud_native_platform', 'cloud_native_orchestrator'];

// Day 0 - Unit Licenses
const CLOUD_UNIT_LICENSE_BUCKETS = ['cloud_per_du_at_site', 'cloud_per_cu_server', 'cloud_per_oss_server', 'storage_licenses'];

// Day 0 - Cloud Design Services
const CLOUD_DESIGN_BUCKETS = ['cloud_design', 'cloud_architecture'];

// Day 1 - Cluster Services (per DC)
const CLOUD_CLUSTER_BUCKETS = ['cloud_deployment_services', 'cluster_bringup', 'cicd_pipeline_setup', 'observability_setup'];

// Day 1 - Deployment Services (per_year_deployment)
const CLOUD_DEPLOYMENT_SERVICE_BUCKETS = ['cloud_deployment_support', 'other_cloud_caas_support'];

// Day 2 - Platform Operations
const CLOUD_PLATFORM_OPS_BUCKETS = ['observability_ops', 'cicd_ops', 'security_ops', 'backup_dr'];

export const CLOUD_SUMMARY_CONFIG: DomainSummaryConfig = {
  domain: 'cloud',
  bucketGroups: {
    day0: [
      { key: 'platformLicenses', label: 'Platform Licenses (One-Time)', buckets: CLOUD_PLATFORM_LICENSE_BUCKETS },
      { key: 'unitLicenses', label: 'Unit Licenses', buckets: CLOUD_UNIT_LICENSE_BUCKETS },
      { key: 'designServices', label: 'Cloud Design Services', buckets: CLOUD_DESIGN_BUCKETS },
    ],
    day1: [
      { key: 'clusterServices', label: 'Cluster Services (per DC)', buckets: CLOUD_CLUSTER_BUCKETS },
      { key: 'deploymentServices', label: 'Deployment Services (Network-wide)', buckets: CLOUD_DEPLOYMENT_SERVICE_BUCKETS },
    ],
    day2: [
      { key: 'platformOps', label: 'Platform Operations', buckets: CLOUD_PLATFORM_OPS_BUCKETS },
      { key: 'licenseSupport', label: 'License Support', buckets: [...CLOUD_PLATFORM_LICENSE_BUCKETS, ...CLOUD_UNIT_LICENSE_BUCKETS] },
    ],
  },
  fixedMultiplierBuckets: CLOUD_PLATFORM_LICENSE_BUCKETS,
  dcScopedBuckets: CLOUD_CLUSTER_BUCKETS,
  duScaledBuckets: ['cloud_per_du_at_site'],
  bucketDriverOverrides: {
    'cloud_per_du_at_site': 'per_du',
    'cloud_per_cu_server': 'per_cu',
    'cloud_per_oss_server': 'per_server',
    'storage_licenses': 'per_server',
  },
};

// =============================================================================
// OSS Domain Configuration
// =============================================================================

// Day 0 - OSS Hardware BoM (network_global scope)
const OSS_HW_BOM_BUCKETS = ['site_mgmt_servers', 'intelligent_ops_servers', 'platform_apps_servers',
  'cnp_platform_servers', 'cns_platform_servers', 'other_oss_servers'];

// Day 0 - OSS Software (network_global scope)
const OSS_SOFTWARE_BUCKETS = ['site_manager', 'netpulse', 'inventory_manager', 'fault_monitoring',
  'performance_monitoring', 'configuration_manager', 'service_desk', 'network_navigator',
  'smo_orchestrator', 'non_rt_ric', 'near_rt_ric', 'rapps_license', 'xapps_license',
  'ai_platform_license', 'other_oss_software'];

// Day 0 - OSS Services
const OSS_DAY0_SERVICES_BUCKETS = ['oss_dimensioning', 'oss_planning'];

// Day 1 - OSS Installation & Integration
const OSS_INSTALLATION_BUCKETS = ['oss_server_installation', 'oss_software_installation'];
const OSS_INTEGRATION_BUCKETS = ['oss_integration', 'smo_integration', 'ric_integration'];
const OSS_DEPLOYMENT_SERVICE_BUCKETS = ['oss_deployment_support', 'rapp_development_support', 'oss_integration_support'];

export const OSS_SUMMARY_CONFIG: DomainSummaryConfig = {
  domain: 'oss',
  bucketGroups: {
    day0: [
      { key: 'ossHwBom', label: 'OSS Hardware BoM', buckets: OSS_HW_BOM_BUCKETS },
      { key: 'ossSoftware', label: 'OSS Modules SW Pricing', buckets: OSS_SOFTWARE_BUCKETS },
      { key: 'services', label: 'OSS Planning Services', buckets: OSS_DAY0_SERVICES_BUCKETS },
    ],
    day1: [
      { key: 'installation', label: 'OSS Installation', buckets: OSS_INSTALLATION_BUCKETS },
      { key: 'integration', label: 'OSS Integration', buckets: OSS_INTEGRATION_BUCKETS },
      { key: 'deploymentServices', label: 'Deployment Services (Network-wide)', buckets: OSS_DEPLOYMENT_SERVICE_BUCKETS },
    ],
    day2: [],
  },
  fixedMultiplierBuckets: [],
  dcScopedBuckets: [],
  duScaledBuckets: [],
};

// =============================================================================
// Configuration Lookup
// =============================================================================

export const DOMAIN_SUMMARY_CONFIGS: Record<Domain, DomainSummaryConfig> = {
  ran: RAN_SUMMARY_CONFIG,
  cloud: CLOUD_SUMMARY_CONFIG,
  oss: OSS_SUMMARY_CONFIG,
};

export function getDomainSummaryConfig(domain: Domain): DomainSummaryConfig {
  return DOMAIN_SUMMARY_CONFIGS[domain];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a bucket belongs to a specific group
 */
export function isBucketInGroup(bucket: string, groups: BucketGroup[]): string | null {
  for (const group of groups) {
    if (group.buckets.includes(bucket)) {
      return group.key;
    }
  }
  return null;
}

/**
 * Get all buckets for a day from config
 */
export function getAllBucketsForDay(config: DomainSummaryConfig, day: 'day0' | 'day1' | 'day2'): string[] {
  return config.bucketGroups[day].flatMap(group => group.buckets);
}
