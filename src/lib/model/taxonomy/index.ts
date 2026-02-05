/**
 * OpenRAN TCO Taxonomy - Central exports
 * Re-exports all taxonomy definitions for backward compatibility.
 */

// Core definitions
export {
  Days,
  type Day,
  DayLabels,
  Domains,
  type Domain,
  DomainLabels,
  Layers,
  type Layer,
  LayerLabels,
  ScopeTypes,
  type ScopeType,
  ScopeTypeLabels,
} from './core';

// RAN domain buckets
export {
  RanSiteBomBuckets,
  type RanSiteBomBucket,
  RanSiteBomLabels,
  RanCuDcBomBuckets,
  type RanCuDcBomBucket,
  RanCuDcBomLabels,
  RanSoftwareBuckets,
  type RanSoftwareBucket,
  RanSoftwareSiteBuckets,
  type RanSoftwareSiteBucket,
  RanSoftwareDcBuckets,
  type RanSoftwareDcBucket,
  RanSoftwareLabels,
  RanDay1DeploymentBuckets,
  type RanDay1DeploymentBucket,
  RanDay1DeploymentLabels,
  SiteOpexBuckets,
  type SiteOpexBucket,
  SiteOpexLabels,
  LifecycleBuckets,
  type LifecycleBucket,
  LifecycleLabels,
  StaffingRoles,
  type StaffingRole,
  StaffingRoleLabels,
} from './ran-buckets';

// Cloud domain buckets
export {
  CloudLicenseBuckets,
  type CloudLicenseBucket,
  CloudLicenseLabels,
  CloudDay1DeploymentBuckets,
  type CloudDay1DeploymentBucket,
  CloudDay1DeploymentLabels,
  PlatformOpsBuckets,
  type PlatformOpsBucket,
  PlatformOpsLabels,
} from './cloud-buckets';

// OSS domain buckets
export {
  OssBomBuckets,
  type OssBomBucket,
  OssBomLabels,
  OssSoftwareBuckets,
  type OssSoftwareBucket,
  OssSoftwareLabels,
  OssInstallationBuckets,
  type OssInstallationBucket,
  OssInstallationLabels,
  OssIntegrationBuckets,
  type OssIntegrationBucket,
  OssIntegrationLabels,
  OssDay1ServicesBuckets,
  OssDay1DeploymentBuckets,
  type OssDay1DeploymentBucket,
  OssDay1DeploymentLabels,
} from './oss-buckets';

// Services buckets
export {
  ServicesBuckets,
  type ServicesBucket,
  ServicesBucketLabels,
} from './services';

// Drivers and configuration
export {
  ScalingDrivers,
  type ScalingDriver,
  ScalingDriverLabels,
  AdjustmentTypes,
  type AdjustmentType,
  AdjustmentTypeLabels,
  LicenseModels,
  type LicenseModel,
  LicenseModelLabels,
  Currencies,
  type Currency,
  DcTypes,
  type DcTypeKey,
  DcTypeLabels,
} from './drivers';

// Model assumptions
export {
  type ModelAssumptions,
  DefaultModelAssumptions,
  DefaultCostRates,
} from './assumptions';

// Bucket groups
export {
  type BucketGroup,
  NetworkPlanningBucketGroups,
  CloudLicenseBucketGroups,
  OssDay1ServicesBucketGroups,
  OssBomBucketGroups,
  OssSoftwareBucketGroups,
} from './bucket-groups';

// Input configuration
export {
  type InputConfig,
  InputConfigurations,
} from './input-config';

// Combined bucket type
export type { Bucket } from './types';

// Utility functions
export { getBucketLabel } from './utils';
