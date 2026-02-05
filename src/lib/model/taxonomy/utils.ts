/**
 * Utility functions for taxonomy lookups
 */

import type { Bucket } from './types';
import type { RanSiteBomBucket, RanCuDcBomBucket, RanSoftwareBucket, RanDay1DeploymentBucket, SiteOpexBucket, LifecycleBucket, StaffingRole } from './ran-buckets';
import type { CloudLicenseBucket, CloudDay1DeploymentBucket, PlatformOpsBucket } from './cloud-buckets';
import type { OssBomBucket, OssSoftwareBucket, OssInstallationBucket, OssIntegrationBucket, OssDay1DeploymentBucket } from './oss-buckets';
import type { ServicesBucket } from './services';

import { RanSiteBomLabels, RanCuDcBomLabels, RanSoftwareLabels, RanDay1DeploymentLabels, SiteOpexLabels, LifecycleLabels, StaffingRoleLabels } from './ran-buckets';
import { CloudLicenseLabels, CloudDay1DeploymentLabels, PlatformOpsLabels } from './cloud-buckets';
import { OssBomLabels, OssSoftwareLabels, OssInstallationLabels, OssIntegrationLabels, OssDay1DeploymentLabels } from './oss-buckets';
import { ServicesBucketLabels } from './services';

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
