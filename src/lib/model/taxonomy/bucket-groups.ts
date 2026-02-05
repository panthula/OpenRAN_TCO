/**
 * Bucket groups for collapsible sections in UI
 */

import { OssInstallationBuckets, OssIntegrationBuckets } from './oss-buckets';

// ============================================================================
// Bucket Groups Interface
// ============================================================================
export interface BucketGroup {
  id: string;
  label: string;
  buckets: readonly string[];
}

// ============================================================================
// Network Planning bucket groups (RAN Day 0)
// ============================================================================
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

// ============================================================================
// Cloud License bucket groups (Cloud Day 0)
// ============================================================================
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

// ============================================================================
// OSS Day 1 Services bucket groups
// ============================================================================
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

// ============================================================================
// OSS Hardware BoM bucket groups (Day 0)
// ============================================================================
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

// ============================================================================
// OSS Software bucket groups (Day 0)
// ============================================================================
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
