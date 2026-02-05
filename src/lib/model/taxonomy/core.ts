/**
 * Core taxonomy definitions - Days, Domains, Layers, and Scope Types
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
// Axis 5: Scope Types
// ============================================================================
export const ScopeTypes = ['site_archetype', 'network_global'] as const;
export type ScopeType = typeof ScopeTypes[number];

export const ScopeTypeLabels: Record<ScopeType, string> = {
  site_archetype: 'Per Site Archetype',
  network_global: 'Network-wide Global',
};
