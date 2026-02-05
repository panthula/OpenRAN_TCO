/**
 * Combined bucket type from all domains
 */

import type { RanSiteBomBucket, RanCuDcBomBucket, RanSoftwareBucket, RanDay1DeploymentBucket, SiteOpexBucket, LifecycleBucket, StaffingRole } from './ran-buckets';
import type { CloudLicenseBucket, CloudDay1DeploymentBucket, PlatformOpsBucket } from './cloud-buckets';
import type { OssBomBucket, OssSoftwareBucket, OssInstallationBucket, OssIntegrationBucket, OssDay1DeploymentBucket } from './oss-buckets';
import type { ServicesBucket } from './services';

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
