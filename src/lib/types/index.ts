/**
 * Central type exports for OpenRAN TCO
 * Import types from this module for consistency across the codebase.
 */

// Core domain types
export type {
  DeploymentYear,
  SiteArchetype,
  InputFact,
  ComputedSummary,
  Scenario,
  ScenarioVersion,
  ScenarioComparisonData,
  NetworkCounts,
  YearScalingCounts,
} from './core';

// Adjustment types
export type {
  AdjustmentRule,
  AdjustmentSet,
  AdjustmentMetadata,
} from './adjustments';

// Summary and display types
export type {
  FactDetail,
  ArchetypeSummary,
  YearArchetypeCosts,
  YearlySummary,
  YearlyCostBreakdown,
} from './summary';

// Agent chat types
export type {
  AgentMessage,
  AgentChange,
  AgentChangeSet,
} from './agent';
