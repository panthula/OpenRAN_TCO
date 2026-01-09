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

export const SiteArchetypeSchema = z.object({
  id: z.string().optional(),
  scenarioVersionId: z.string(),
  name: z.string().min(1, 'Name is required'),
  numSites: z.number().int().min(0, 'Number of sites must be non-negative'),
  numCus: z.number().int().min(0, 'Number of CUs must be non-negative'),
  description: z.string().nullable().optional(),
});

export const DcTypeSchema = z.object({
  id: z.string().optional(),
  scenarioVersionId: z.string(),
  name: z.string().min(1, 'Name is required'),
  numDcs: z.number().int().min(0, 'Number of DCs must be non-negative'),
  description: z.string().nullable().optional(),
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

export const StaffingDriversSchema = z.object({
  coverage_factor: z.number().min(1).default(4.2),
  events_per_site_per_period: z.number().min(0).default(10),
  auto_remediation_pct: z.number().min(0).max(1).default(0.6),
  auto_containment_pct: z.number().min(0).max(1).default(0.4),
  handling_time_minutes: z.number().min(0).default(30),
  complexity_multiplier: z.number().min(0.1).max(10).default(1.0),
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

export type InputFactInput = z.infer<typeof InputFactSchema>;
export type SiteArchetypeInput = z.infer<typeof SiteArchetypeSchema>;
export type DcTypeInput = z.infer<typeof DcTypeSchema>;
export type ScenarioInput = z.infer<typeof ScenarioSchema>;
export type ModelAssumptionsInput = z.infer<typeof ModelAssumptionsSchema>;
export type StaffingDriversInput = z.infer<typeof StaffingDriversSchema>;
export type ChangeSetInput = z.infer<typeof ChangeSetSchema>;
export type SweepDefinitionInput = z.infer<typeof SweepDefinitionSchema>;

