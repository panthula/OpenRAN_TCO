/**
 * Adjustment types for what-if analysis
 */

/**
 * Individual adjustment rule that modifies input fact values.
 * id and adjustmentSetId are optional when creating new rules,
 * but always present when loaded from the database.
 */
export interface AdjustmentRule {
  id?: string;
  adjustmentSetId?: string;
  targetDay: string | null;
  targetDomain: string | null;
  targetLayer: string | null;
  targetBucket: string | null;
  targetScopeType: string | null;
  targetScopeId: string | null;
  adjustmentType: string;
  adjustmentValue: number;
  priority: number;
  notes: string | null;
}

/**
 * Persisted adjustment rule with required id fields (from database)
 */
export interface PersistedAdjustmentRule extends AdjustmentRule {
  id: string;
  adjustmentSetId: string;
}

/**
 * Set of adjustment rules that can be toggled on/off
 */
export interface AdjustmentSet {
  id: string;
  scenarioVersionId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  rules: AdjustmentRule[];
}

/**
 * Metadata about adjustments applied during computation
 */
export interface AdjustmentMetadata {
  id: string;
  name: string;
  rulesApplied: number;
  totalImpact: number;
}
