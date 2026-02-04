/**
 * Zod validation schemas for TCO inputs
 */

import { z } from 'zod';
import {
  Days,
  Domains,
  Layers,
  ScopeTypes,
  ScalingDrivers,
  LicenseModels,
  Currencies,
  AdjustmentTypes,
} from './taxonomy';

export const DaySchema = z.enum(Days);
export const DomainSchema = z.enum(Domains);
export const LayerSchema = z.enum(Layers);
export const ScopeTypeSchema = z.enum(ScopeTypes);
export const ScalingDriverSchema = z.enum(ScalingDrivers);
export const LicenseModelSchema = z.enum(LicenseModels);
export const CurrencySchema = z.enum(Currencies);

export const InputFactSchema = z.object({
  id: z.string().optional(),
  scenarioVersionId: z.string(),
  day: DaySchema,
  domain: DomainSchema,
  layer: LayerSchema,
  bucket: z.string(),
  scopeType: ScopeTypeSchema,
  scopeId: z.string().nullable().optional(),
  driver: ScalingDriverSchema,
  valueNumber: z.number(),
  valueJson: z.string().nullable().optional(),
  unit: z.string().default('USD'),
  currency: CurrencySchema.default('USD'),
  notes: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  assumptionFlag: z.boolean().default(false),
  licenseModel: LicenseModelSchema.nullable().optional(),
  spreadYears: z.number().nullable().optional(),
});

// Deployment schedule for phased rollout
export const DeploymentYearSchema = z.object({
  id: z.string().optional(),
  archetypeId: z.string().optional(), // Optional - will be set by the server
  yearIndex: z.number().int().min(0).max(9, 'Year index must be 0-9 (up to 10 years)'),
  sitesDeployed: z.number().int().min(0, 'Sites deployed must be non-negative').default(0),
  cusDeployed: z.number().int().min(0, 'CUs deployed must be non-negative').default(0),
  dcsDeployed: z.number().int().min(0, 'DCs deployed must be non-negative').default(0),
});

export const SiteArchetypeSchema = z.object({
  id: z.string().optional(),
  scenarioVersionId: z.string(),
  name: z.string().min(1, 'Name is required'),
  numSites: z.number().int().min(0, 'Number of sites must be non-negative'),
  numCus: z.number().int().min(0, 'Number of CUs must be non-negative'),
  numDcs: z.number().int().min(0, 'Number of DCs must be non-negative').default(1),
  numDusPerSite: z.number().int().min(1, 'DUs per site must be at least 1').default(1),
  description: z.string().nullable().optional(),
  deploymentYears: z.number().int().min(1).max(10, 'Deployment years must be 1-10').default(1),
  deploymentSchedule: z.array(DeploymentYearSchema).optional(),
});

export const ScenarioSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  isBaseline: z.boolean().default(false),
  parentId: z.string().nullable().optional(),
});

export const ModelAssumptionsSchema = z.object({
  tco_years: z.number().int().min(1).max(30).default(5),
  discount_rate: z.number().min(0).max(1).default(0.08),
  currency: CurrencySchema.default('USD'),
  inflation_rate: z.number().min(0).max(1).optional(),
  escalation_rate: z.number().min(0).max(1).optional(),
  perpetual_spread_years: z.number().int().min(1).max(10).optional(),
});

export const ChangeOperationSchema = z.object({
  operation: z.enum(['add', 'update', 'delete']),
  factId: z.string().optional(),
  inputData: InputFactSchema.partial().optional(),
});

export const ChangeSetSchema = z.object({
  scenarioVersionId: z.string(),
  changes: z.array(ChangeOperationSchema),
  rationale: z.string().optional(),
  prompt: z.string().optional(),
});

export const SweepParameterSchema = z.object({
  bucket: z.string(),
  scopeType: ScopeTypeSchema,
  scopeId: z.string().nullable().optional(),
  minValue: z.number(),
  maxValue: z.number(),
  steps: z.number().int().min(2),
});

export const SweepDefinitionSchema = z.object({
  scenarioId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  parameters: z.array(SweepParameterSchema),
});

// Adjustment schemas
export const AdjustmentTypeSchema = z.enum(AdjustmentTypes);

export const AdjustmentRuleSchema = z.object({
  id: z.string().optional(),
  adjustmentSetId: z.string().optional(),
  targetDay: DaySchema.nullable().optional(),
  targetDomain: DomainSchema.nullable().optional(),
  targetLayer: LayerSchema.nullable().optional(),
  targetBucket: z.string().nullable().optional(),
  targetScopeType: ScopeTypeSchema.nullable().optional(),
  targetScopeId: z.string().nullable().optional(),
  adjustmentType: AdjustmentTypeSchema,
  adjustmentValue: z.number(),
  priority: z.number().int().default(0),
  notes: z.string().nullable().optional(),
});

export const AdjustmentSetSchema = z.object({
  id: z.string().optional(),
  scenarioVersionId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  rules: z.array(AdjustmentRuleSchema).optional(),
});


