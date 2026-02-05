/**
 * Cloud/CaaS domain bucket definitions
 */

// ============================================================================
// Cloud/CaaS License Buckets
// ============================================================================
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

// ============================================================================
// Cloud Day 1 Deployment Services
// ============================================================================
export const CloudDay1DeploymentBuckets = [
  'cloud_deployment_support',
  'other_cloud_caas_support',
] as const;
export type CloudDay1DeploymentBucket = typeof CloudDay1DeploymentBuckets[number];

export const CloudDay1DeploymentLabels: Record<CloudDay1DeploymentBucket, string> = {
  cloud_deployment_support: 'Cloud Deployment Support',
  other_cloud_caas_support: 'Other Cloud/CaaS Support',
};

// ============================================================================
// Platform Operations Buckets (Day2)
// ============================================================================
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
