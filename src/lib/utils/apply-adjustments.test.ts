import { describe, it, expect } from 'vitest';
import {
  ruleMatchesFact,
  applyAdjustment,
  getAdjustedValue,
  getActiveRules,
  applyAdjustmentsToFacts,
} from './apply-adjustments';
import type { AdjustmentRule, AdjustmentSet, InputFact } from '@/lib/types';

// Helper to create a minimal AdjustmentRule
function createRule(overrides: Partial<AdjustmentRule> = {}): AdjustmentRule {
  return {
    id: 'rule-1',
    adjustmentSetId: 'set-1',
    targetDay: null,
    targetDomain: null,
    targetLayer: null,
    targetBucket: null,
    targetScopeType: null,
    targetScopeId: null,
    adjustmentType: 'percentage',
    adjustmentValue: 10,
    priority: 1,
    notes: null,
    ...overrides,
  };
}

// Helper to create a minimal fact
function createFact(overrides: Partial<{
  day: string;
  domain: string;
  layer: string;
  bucket: string;
  scopeType: string;
  scopeId: string | null;
}> = {}) {
  return {
    day: 'day0',
    domain: 'ran',
    layer: 'hardware_bom',
    bucket: 'du_server',
    scopeType: 'site_archetype',
    scopeId: 'arch-1',
    ...overrides,
  };
}

describe('apply-adjustments', () => {
  describe('ruleMatchesFact', () => {
    it('should match when all rule targets are null (match all)', () => {
      const rule = createRule();
      const fact = createFact();
      expect(ruleMatchesFact(rule, fact)).toBe(true);
    });

    it('should match when targetDay matches fact.day', () => {
      const rule = createRule({ targetDay: 'day0' });
      const fact = createFact({ day: 'day0' });
      expect(ruleMatchesFact(rule, fact)).toBe(true);
    });

    it('should not match when targetDay differs', () => {
      const rule = createRule({ targetDay: 'day1' });
      const fact = createFact({ day: 'day0' });
      expect(ruleMatchesFact(rule, fact)).toBe(false);
    });

    it('should match when targetDomain matches', () => {
      const rule = createRule({ targetDomain: 'ran' });
      const fact = createFact({ domain: 'ran' });
      expect(ruleMatchesFact(rule, fact)).toBe(true);
    });

    it('should not match when targetDomain differs', () => {
      const rule = createRule({ targetDomain: 'cloud' });
      const fact = createFact({ domain: 'ran' });
      expect(ruleMatchesFact(rule, fact)).toBe(false);
    });

    it('should match when targetLayer matches', () => {
      const rule = createRule({ targetLayer: 'hardware_bom' });
      const fact = createFact({ layer: 'hardware_bom' });
      expect(ruleMatchesFact(rule, fact)).toBe(true);
    });

    it('should not match when targetLayer differs', () => {
      const rule = createRule({ targetLayer: 'software' });
      const fact = createFact({ layer: 'hardware_bom' });
      expect(ruleMatchesFact(rule, fact)).toBe(false);
    });

    it('should match when targetBucket matches', () => {
      const rule = createRule({ targetBucket: 'du_server' });
      const fact = createFact({ bucket: 'du_server' });
      expect(ruleMatchesFact(rule, fact)).toBe(true);
    });

    it('should not match when targetBucket differs', () => {
      const rule = createRule({ targetBucket: 'radios' });
      const fact = createFact({ bucket: 'du_server' });
      expect(ruleMatchesFact(rule, fact)).toBe(false);
    });

    it('should match when targetScopeType matches', () => {
      const rule = createRule({ targetScopeType: 'site_archetype' });
      const fact = createFact({ scopeType: 'site_archetype' });
      expect(ruleMatchesFact(rule, fact)).toBe(true);
    });

    it('should not match when targetScopeType differs', () => {
      const rule = createRule({ targetScopeType: 'network_global' });
      const fact = createFact({ scopeType: 'site_archetype' });
      expect(ruleMatchesFact(rule, fact)).toBe(false);
    });

    it('should match when targetScopeId matches', () => {
      const rule = createRule({ targetScopeId: 'arch-1' });
      const fact = createFact({ scopeId: 'arch-1' });
      expect(ruleMatchesFact(rule, fact)).toBe(true);
    });

    it('should not match when targetScopeId differs', () => {
      const rule = createRule({ targetScopeId: 'arch-2' });
      const fact = createFact({ scopeId: 'arch-1' });
      expect(ruleMatchesFact(rule, fact)).toBe(false);
    });

    it('should match when all specific targets match', () => {
      const rule = createRule({
        targetDay: 'day0',
        targetDomain: 'ran',
        targetLayer: 'hardware_bom',
        targetBucket: 'du_server',
        targetScopeType: 'site_archetype',
        targetScopeId: 'arch-1',
      });
      const fact = createFact();
      expect(ruleMatchesFact(rule, fact)).toBe(true);
    });

    it('should not match when any specific target differs', () => {
      const rule = createRule({
        targetDay: 'day0',
        targetDomain: 'cloud', // Different
        targetLayer: 'hardware_bom',
      });
      const fact = createFact({ domain: 'ran' });
      expect(ruleMatchesFact(rule, fact)).toBe(false);
    });
  });

  describe('applyAdjustment', () => {
    it('should apply percentage increase', () => {
      const rule = createRule({ adjustmentType: 'percentage', adjustmentValue: 10 });
      const result = applyAdjustment(100, rule);
      expect(result).toBeCloseTo(110);
    });

    it('should apply percentage decrease', () => {
      const rule = createRule({ adjustmentType: 'percentage', adjustmentValue: -20 });
      const result = applyAdjustment(100, rule);
      expect(result).toBe(80);
    });

    it('should apply 100% increase (double)', () => {
      const rule = createRule({ adjustmentType: 'percentage', adjustmentValue: 100 });
      const result = applyAdjustment(100, rule);
      expect(result).toBe(200);
    });

    it('should apply fixed addition', () => {
      const rule = createRule({ adjustmentType: 'fixed', adjustmentValue: 50 });
      const result = applyAdjustment(100, rule);
      expect(result).toBe(150);
    });

    it('should apply fixed subtraction', () => {
      const rule = createRule({ adjustmentType: 'fixed', adjustmentValue: -30 });
      const result = applyAdjustment(100, rule);
      expect(result).toBe(70);
    });

    it('should apply replace adjustment', () => {
      const rule = createRule({ adjustmentType: 'replace', adjustmentValue: 500 });
      const result = applyAdjustment(100, rule);
      expect(result).toBe(500);
    });

    it('should return original value for unknown adjustment type', () => {
      const rule = createRule({ adjustmentType: 'unknown' as any, adjustmentValue: 50 });
      const result = applyAdjustment(100, rule);
      expect(result).toBe(100);
    });

    it('should handle zero value', () => {
      const rule = createRule({ adjustmentType: 'percentage', adjustmentValue: 10 });
      const result = applyAdjustment(0, rule);
      expect(result).toBe(0);
    });

    it('should handle decimal values', () => {
      const rule = createRule({ adjustmentType: 'percentage', adjustmentValue: 15 });
      const result = applyAdjustment(100.5, rule);
      expect(result).toBeCloseTo(115.575);
    });
  });

  describe('getAdjustedValue', () => {
    it('should return original value when no rules match', () => {
      const rule = createRule({ targetDomain: 'cloud' });
      const fact = createFact({ domain: 'ran' });
      const result = getAdjustedValue(100, fact, [rule]);
      expect(result).toBe(100);
    });

    it('should apply single matching rule', () => {
      const rule = createRule({ adjustmentType: 'percentage', adjustmentValue: 10 });
      const fact = createFact();
      const result = getAdjustedValue(100, fact, [rule]);
      expect(result).toBeCloseTo(110);
    });

    it('should apply multiple matching rules in order', () => {
      const rules = [
        createRule({ id: 'r1', adjustmentType: 'percentage', adjustmentValue: 10, priority: 1 }),
        createRule({ id: 'r2', adjustmentType: 'fixed', adjustmentValue: 5, priority: 2 }),
      ];
      const fact = createFact();
      // 100 * 1.10 = 110, then 110 + 5 = 115
      const result = getAdjustedValue(100, fact, rules);
      expect(result).toBeCloseTo(115);
    });

    it('should skip non-matching rules', () => {
      const rules = [
        createRule({ id: 'r1', targetDomain: 'cloud', adjustmentValue: 50 }), // Won't match
        createRule({ id: 'r2', targetDomain: 'ran', adjustmentValue: 10 }), // Will match
      ];
      const fact = createFact({ domain: 'ran' });
      const result = getAdjustedValue(100, fact, rules);
      expect(result).toBeCloseTo(110);
    });

    it('should return original value when rules array is empty', () => {
      const fact = createFact();
      const result = getAdjustedValue(100, fact, []);
      expect(result).toBe(100);
    });
  });

  describe('getActiveRules', () => {
    it('should return empty array for empty adjustment sets', () => {
      const result = getActiveRules([]);
      expect(result).toEqual([]);
    });

    it('should return rules from active sets only', () => {
      const sets: AdjustmentSet[] = [
        {
          id: 'set-1',
          scenarioVersionId: 'v1',
          name: 'Active Set',
          description: null,
          isActive: true,
          rules: [createRule({ id: 'r1', adjustmentSetId: 'set-1' })],
        },
        {
          id: 'set-2',
          scenarioVersionId: 'v1',
          name: 'Inactive Set',
          description: null,
          isActive: false,
          rules: [createRule({ id: 'r2', adjustmentSetId: 'set-2' })],
        },
      ];
      const result = getActiveRules(sets);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r1');
    });

    it('should combine rules from multiple active sets', () => {
      const sets: AdjustmentSet[] = [
        {
          id: 'set-1',
          scenarioVersionId: 'v1',
          name: 'Set 1',
          description: null,
          isActive: true,
          rules: [createRule({ id: 'r1', priority: 2 })],
        },
        {
          id: 'set-2',
          scenarioVersionId: 'v1',
          name: 'Set 2',
          description: null,
          isActive: true,
          rules: [createRule({ id: 'r2', priority: 1 })],
        },
      ];
      const result = getActiveRules(sets);
      expect(result).toHaveLength(2);
    });

    it('should sort rules by priority (ascending)', () => {
      const sets: AdjustmentSet[] = [
        {
          id: 'set-1',
          scenarioVersionId: 'v1',
          name: 'Set 1',
          description: null,
          isActive: true,
          rules: [
            createRule({ id: 'r1', priority: 3 }),
            createRule({ id: 'r2', priority: 1 }),
            createRule({ id: 'r3', priority: 2 }),
          ],
        },
      ];
      const result = getActiveRules(sets);
      expect(result[0].id).toBe('r2'); // priority 1
      expect(result[1].id).toBe('r3'); // priority 2
      expect(result[2].id).toBe('r1'); // priority 3
    });
  });

  describe('applyAdjustmentsToFacts', () => {
    const createInputFact = (overrides: Partial<InputFact> = {}): InputFact => ({
      id: 'fact-1',
      scenarioVersionId: 'v1',
      day: 'day0',
      domain: 'ran',
      layer: 'hardware_bom',
      bucket: 'du_server',
      scopeType: 'site_archetype',
      scopeId: 'arch-1',
      driver: 'per_site',
      valueNumber: 100,
      valueJson: null,
      licenseModel: null,
      unit: 'USD',
      currency: 'USD',
      notes: null,
      spreadYears: null,
      ...overrides,
    });

    it('should return original facts when no adjustment sets', () => {
      const facts = [createInputFact()];
      const result = applyAdjustmentsToFacts(facts, []);
      expect(result).toEqual(facts);
    });

    it('should return original facts when no active adjustment sets', () => {
      const facts = [createInputFact()];
      const sets: AdjustmentSet[] = [
        {
          id: 'set-1',
          scenarioVersionId: 'v1',
          name: 'Inactive',
          description: null,
          isActive: false,
          rules: [createRule({ adjustmentValue: 50 })],
        },
      ];
      const result = applyAdjustmentsToFacts(facts, sets);
      expect(result[0].valueNumber).toBe(100);
    });

    it('should apply adjustments to matching facts', () => {
      const facts = [createInputFact({ valueNumber: 100 })];
      const sets: AdjustmentSet[] = [
        {
          id: 'set-1',
          scenarioVersionId: 'v1',
          name: 'Active',
          description: null,
          isActive: true,
          rules: [createRule({ adjustmentType: 'percentage', adjustmentValue: 20 })],
        },
      ];
      const result = applyAdjustmentsToFacts(facts, sets);
      expect(result[0].valueNumber).toBeCloseTo(120);
    });

    it('should not mutate original facts', () => {
      const originalFacts = [createInputFact({ valueNumber: 100 })];
      const sets: AdjustmentSet[] = [
        {
          id: 'set-1',
          scenarioVersionId: 'v1',
          name: 'Active',
          description: null,
          isActive: true,
          rules: [createRule({ adjustmentType: 'percentage', adjustmentValue: 20 })],
        },
      ];
      applyAdjustmentsToFacts(originalFacts, sets);
      expect(originalFacts[0].valueNumber).toBe(100); // Original unchanged
    });

    it('should apply adjustments to multiple facts', () => {
      const facts = [
        createInputFact({ id: 'f1', valueNumber: 100 }),
        createInputFact({ id: 'f2', valueNumber: 200 }),
      ];
      const sets: AdjustmentSet[] = [
        {
          id: 'set-1',
          scenarioVersionId: 'v1',
          name: 'Active',
          description: null,
          isActive: true,
          rules: [createRule({ adjustmentType: 'percentage', adjustmentValue: 10 })],
        },
      ];
      const result = applyAdjustmentsToFacts(facts, sets);
      expect(result[0].valueNumber).toBeCloseTo(110);
      expect(result[1].valueNumber).toBeCloseTo(220);
    });

    it('should only adjust matching facts', () => {
      const facts = [
        createInputFact({ id: 'f1', domain: 'ran', valueNumber: 100 }),
        createInputFact({ id: 'f2', domain: 'cloud', valueNumber: 200 }),
      ];
      const sets: AdjustmentSet[] = [
        {
          id: 'set-1',
          scenarioVersionId: 'v1',
          name: 'RAN Only',
          description: null,
          isActive: true,
          rules: [createRule({ targetDomain: 'ran', adjustmentValue: 10 })],
        },
      ];
      const result = applyAdjustmentsToFacts(facts, sets);
      expect(result[0].valueNumber).toBeCloseTo(110); // RAN adjusted
      expect(result[1].valueNumber).toBe(200); // Cloud unchanged
    });
  });
});
