/**
 * OSS/SMO/RIC domain bucket definitions
 */

// ============================================================================
// OSS BoM Buckets (Server Categories)
// ============================================================================
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

// ============================================================================
// OSS/SMO/RIC Software Buckets
// ============================================================================
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

// ============================================================================
// OSS Day 1 Installation Buckets (fixed driver)
// ============================================================================
export const OssInstallationBuckets = [
  'oss_server_install',
  'oss_server_sw_onboarding',
] as const;
export type OssInstallationBucket = typeof OssInstallationBuckets[number];

export const OssInstallationLabels: Record<OssInstallationBucket, string> = {
  oss_server_install: 'OSS Servers (Install)',
  oss_server_sw_onboarding: 'OSS Servers (SW Onboarding)',
};

// ============================================================================
// OSS Day 1 Integration Buckets (per_integration driver)
// ============================================================================
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

// ============================================================================
// Combined OSS Day 1 Services buckets
// ============================================================================
export const OssDay1ServicesBuckets = [
  ...OssInstallationBuckets,
  ...OssIntegrationBuckets,
] as const;

// ============================================================================
// OSS Day 1 Deployment Services
// ============================================================================
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
