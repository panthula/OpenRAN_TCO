/**
 * Services bucket definitions (Day 0/Day 1)
 */

// ============================================================================
// Services Buckets (Day0/Day1)
// ============================================================================
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
