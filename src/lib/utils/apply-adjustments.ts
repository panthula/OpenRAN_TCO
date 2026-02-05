/**
 * Client-side Adjustment Application Utility
 * Mirrors server-side logic from engine.ts for applying adjustment rules to input facts
 */

import type { AdjustmentRule, AdjustmentSet, InputFact } from '@/lib/types';

// Re-export types for backward compatibility
export type { AdjustmentRule, AdjustmentSet, InputFact };

/**
 * Check if an adjustment rule matches an input fact
 * null in rule means "match all"
 */
export function ruleMatchesFact(
  rule: AdjustmentRule,
  fact: {
    day: string;
    domain: string;
    layer: string;
    bucket: string;
    scopeType: string;
    scopeId: string | null;
  }
): boolean {
  if (rule.targetDay !== null && rule.targetDay !== fact.day) return false;
  if (rule.targetDomain !== null && rule.targetDomain !== fact.domain) return false;
  if (rule.targetLayer !== null && rule.targetLayer !== fact.layer) return false;
  if (rule.targetBucket !== null && rule.targetBucket !== fact.bucket) return false;
  if (rule.targetScopeType !== null && rule.targetScopeType !== fact.scopeType) return false;
  if (rule.targetScopeId !== null && rule.targetScopeId !== fact.scopeId) return false;
  return true;
}

/**
 * Apply an adjustment rule to a value
 */
export function applyAdjustment(value: number, rule: AdjustmentRule): number {
  switch (rule.adjustmentType) {
    case 'percentage':
      // adjustmentValue is the percentage change (e.g., 10 = +10%, -20 = -20%)
      return value * (1 + rule.adjustmentValue / 100);
    case 'fixed':
      // adjustmentValue is added/subtracted to the value
      return value + rule.adjustmentValue;
    case 'replace':
      // adjustmentValue replaces the original value entirely
      return rule.adjustmentValue;
    default:
      return value;
  }
}

/**
 * Get adjusted value for a fact based on all applicable rules
 * Rules are applied in priority order (lower priority first)
 */
export function getAdjustedValue(
  originalValue: number,
  fact: {
    day: string;
    domain: string;
    layer: string;
    bucket: string;
    scopeType: string;
    scopeId: string | null;
  },
  allRules: AdjustmentRule[]
): number {
  let adjustedValue = originalValue;

  // Rules should already be sorted by priority
  for (const rule of allRules) {
    if (ruleMatchesFact(rule, fact)) {
      adjustedValue = applyAdjustment(adjustedValue, rule);
    }
  }

  return adjustedValue;
}

/**
 * Collect and sort all rules from active adjustment sets
 */
export function getActiveRules(adjustmentSets: AdjustmentSet[]): AdjustmentRule[] {
  const activeRules: AdjustmentRule[] = [];

  for (const set of adjustmentSets) {
    if (set.isActive) {
      activeRules.push(...set.rules);
    }
  }

  // Sort by priority (lower first)
  activeRules.sort((a, b) => a.priority - b.priority);

  return activeRules;
}

/**
 * Apply adjustments to an array of input facts
 * Returns a new array with adjusted valueNumber values
 */
export function applyAdjustmentsToFacts(
  inputFacts: InputFact[],
  adjustmentSets: AdjustmentSet[]
): InputFact[] {
  const activeRules = getActiveRules(adjustmentSets);

  // If no active rules, return original facts unchanged
  if (activeRules.length === 0) {
    return inputFacts;
  }

  return inputFacts.map(fact => {
    const adjustedValue = getAdjustedValue(
      fact.valueNumber,
      {
        day: fact.day,
        domain: fact.domain,
        layer: fact.layer,
        bucket: fact.bucket,
        scopeType: fact.scopeType,
        scopeId: fact.scopeId,
      },
      activeRules
    );

    // Return new object with adjusted valueNumber
    return {
      ...fact,
      valueNumber: adjustedValue,
    };
  });
}
