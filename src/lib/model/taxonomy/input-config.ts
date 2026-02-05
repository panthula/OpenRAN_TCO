/**
 * Input configuration mapping
 * Maps which buckets are valid for which Day/Domain/Layer combinations
 */

import type { Day } from './core';
import type { Domain } from './core';
import type { Layer } from './core';
import type { ScopeType } from './core';
import type { ScalingDriver } from './drivers';
import type { Bucket } from './types';

import { RanSiteBomBuckets, RanCuDcBomBuckets, RanSoftwareBuckets, RanDay1DeploymentBuckets, SiteOpexBuckets, LifecycleBuckets } from './ran-buckets';
import { CloudLicenseBuckets, CloudDay1DeploymentBuckets, PlatformOpsBuckets } from './cloud-buckets';
import { OssBomBuckets, OssSoftwareBuckets, OssInstallationBuckets, OssIntegrationBuckets, OssDay1DeploymentBuckets } from './oss-buckets';

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
