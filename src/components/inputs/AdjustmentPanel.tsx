'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CheckCircle, AlertCircle, SlidersHorizontal, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, NumberInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Days, Domains, Layers, ScopeTypes, AdjustmentTypes, DayLabels, DomainLabels, LayerLabels, ScopeTypeLabels, AdjustmentTypeLabels } from '@/lib/model/taxonomy';

interface AdjustmentRule {
  id?: string;
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

interface AdjustmentSet {
  id?: string;
  name: string;
  description: string | null;
  isActive: boolean;
  rules: AdjustmentRule[];
}

const emptyRule: AdjustmentRule = {
  targetDay: null,
  targetDomain: null,
  targetLayer: null,
  targetBucket: null,
  targetScopeType: null,
  targetScopeId: null,
  adjustmentType: 'percentage',
  adjustmentValue: 0,
  priority: 0,
  notes: null,
};

export function AdjustmentPanel() {
  const {
    currentVersion,
    adjustmentSets,
    siteArchetypes,
    fetchAdjustmentSets,
    saveAdjustmentSet,
    deleteAdjustmentSet,
    toggleAdjustmentSet,
    computeTco,
  } = useScenarioStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<AdjustmentSet | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentVersion) {
      fetchAdjustmentSets();
    }
  }, [currentVersion, fetchAdjustmentSets]);

  const handleNewSet = () => {
    setEditingSet({
      name: '',
      description: null,
      isActive: true,
      rules: [{ ...emptyRule }],
    });
    setIsModalOpen(true);
  };

  const handleEditSet = (set: AdjustmentSet) => {
    setEditingSet({ ...set, rules: set.rules.map(r => ({ ...r })) });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingSet || !editingSet.name.trim()) return;

    setIsSaving(true);
    try {
      await saveAdjustmentSet(editingSet as Parameters<typeof saveAdjustmentSet>[0]);
      setSaveStatus('success');
      setIsModalOpen(false);
      setEditingSet(null);
      // Recompute TCO to reflect adjustment changes in Dashboard
      await computeTco();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this adjustment set?')) {
      await deleteAdjustmentSet(id);
      // Recompute TCO to reflect adjustment changes in Dashboard
      await computeTco();
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleAdjustmentSet(id, !isActive);
    // Recompute TCO to reflect adjustment changes in Dashboard
    await computeTco();
  };

  const addRule = () => {
    if (!editingSet) return;
    setEditingSet({
      ...editingSet,
      rules: [...editingSet.rules, { ...emptyRule, priority: editingSet.rules.length }],
    });
  };

  const removeRule = (index: number) => {
    if (!editingSet) return;
    setEditingSet({
      ...editingSet,
      rules: editingSet.rules.filter((_, i) => i !== index),
    });
  };

  const updateRule = (index: number, updates: Partial<AdjustmentRule>) => {
    if (!editingSet) return;
    const newRules = [...editingSet.rules];
    newRules[index] = { ...newRules[index], ...updates };
    setEditingSet({ ...editingSet, rules: newRules });
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSets(newExpanded);
  };

  const formatAdjustment = (rule: AdjustmentRule): string => {
    switch (rule.adjustmentType) {
      case 'percentage':
        return `${rule.adjustmentValue >= 0 ? '+' : ''}${rule.adjustmentValue}%`;
      case 'fixed':
        return `${rule.adjustmentValue >= 0 ? '+' : ''}$${rule.adjustmentValue.toLocaleString()}`;
      case 'replace':
        return `= $${rule.adjustmentValue.toLocaleString()}`;
      default:
        return String(rule.adjustmentValue);
    }
  };

  const formatTarget = (rule: AdjustmentRule): string => {
    const parts: string[] = [];
    if (rule.targetDay) parts.push(DayLabels[rule.targetDay as keyof typeof DayLabels] || rule.targetDay);
    if (rule.targetDomain) parts.push(DomainLabels[rule.targetDomain as keyof typeof DomainLabels] || rule.targetDomain);
    if (rule.targetLayer) parts.push(LayerLabels[rule.targetLayer as keyof typeof LayerLabels] || rule.targetLayer);
    if (rule.targetBucket) parts.push(rule.targetBucket);
    return parts.length > 0 ? parts.join(' > ') : 'All costs';
  };

  if (!currentVersion) {
    return null;
  }

  // Build scope options for the select
  const scopeOptions = [
    { value: '', label: 'All Scopes' },
    ...siteArchetypes.map(a => ({ value: a.id, label: a.name })),
  ];

  return (
    <Card variant="gradient">
      <CardHeader
        title="What-If Adjustments"
        description="Apply adjustment rules for scenario analysis"
        action={
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Saved</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Failed</span>
              </div>
            )}
            <Button size="sm" onClick={handleNewSet}>
              <Plus className="w-4 h-4" />
              New Adjustment Set
            </Button>
          </div>
        }
      />
      <CardContent>
        {adjustmentSets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No adjustment sets defined</p>
            <p className="text-sm mt-1">Create adjustment sets to model what-if scenarios</p>
          </div>
        ) : (
          <div className="space-y-4">
            {adjustmentSets.map((set) => (
              <div
                key={set.id}
                className={`border rounded-lg transition-colors ${
                  set.isActive ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-gray-700 bg-gray-800/30'
                }`}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(set.id, set.isActive)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      title={set.isActive ? 'Disable' : 'Enable'}
                    >
                      {set.isActive ? (
                        <ToggleRight className="w-6 h-6 text-cyan-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                    <div>
                      <h4 className={`font-medium ${set.isActive ? 'text-gray-100' : 'text-gray-400'}`}>
                        {set.name}
                      </h4>
                      {set.description && (
                        <p className="text-sm text-gray-500">{set.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {set.rules.length} rule{set.rules.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpanded(set.id)}
                      className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
                    >
                      {expandedSets.has(set.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <Button size="sm" variant="secondary" onClick={() => handleEditSet(set)}>
                      Edit
                    </Button>
                    <button
                      onClick={() => handleDelete(set.id)}
                      className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedSets.has(set.id) && (
                  <div className="border-t border-gray-700 p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 text-left">
                          <th className="pb-2">Target</th>
                          <th className="pb-2">Adjustment</th>
                          <th className="pb-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        {set.rules.map((rule, idx) => (
                          <tr key={idx} className="border-t border-gray-700/50">
                            <td className="py-2">{formatTarget(rule)}</td>
                            <td className="py-2 font-mono">{formatAdjustment(rule)}</td>
                            <td className="py-2 text-gray-500">{rule.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSet(null);
        }}
        title={editingSet?.id ? 'Edit Adjustment Set' : 'New Adjustment Set'}
        size="xl"
      >
        {editingSet && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                value={editingSet.name}
                onChange={(e) => setEditingSet({ ...editingSet, name: e.target.value })}
                placeholder="e.g., Hardware Cost Reduction"
              />
              <Input
                label="Description (optional)"
                value={editingSet.description || ''}
                onChange={(e) => setEditingSet({ ...editingSet, description: e.target.value || null })}
                placeholder="e.g., 10% reduction in hardware costs"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-300">Adjustment Rules</h4>
                <Button size="sm" variant="secondary" onClick={addRule}>
                  <Plus className="w-4 h-4" />
                  Add Rule
                </Button>
              </div>

              {editingSet.rules.map((rule, idx) => (
                <div key={idx} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Rule {idx + 1}</span>
                    {editingSet.rules.length > 1 && (
                      <button
                        onClick={() => removeRule(idx)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <Select
                      label="Day"
                      value={rule.targetDay || ''}
                      onChange={(v) => updateRule(idx, { targetDay: v || null })}
                      options={[
                        { value: '', label: 'All Days' },
                        ...Days.map(d => ({ value: d, label: DayLabels[d] })),
                      ]}
                    />
                    <Select
                      label="Domain"
                      value={rule.targetDomain || ''}
                      onChange={(v) => updateRule(idx, { targetDomain: v || null })}
                      options={[
                        { value: '', label: 'All Domains' },
                        ...Domains.map(d => ({ value: d, label: DomainLabels[d] })),
                      ]}
                    />
                    <Select
                      label="Layer"
                      value={rule.targetLayer || ''}
                      onChange={(v) => updateRule(idx, { targetLayer: v || null })}
                      options={[
                        { value: '', label: 'All Layers' },
                        ...Layers.map(l => ({ value: l, label: LayerLabels[l] })),
                      ]}
                    />
                    <Select
                      label="Scope Type"
                      value={rule.targetScopeType || ''}
                      onChange={(v) => updateRule(idx, { targetScopeType: v || null, targetScopeId: null })}
                      options={[
                        { value: '', label: 'All Scope Types' },
                        ...ScopeTypes.map(s => ({ value: s, label: ScopeTypeLabels[s] })),
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <Input
                      label="Bucket (optional)"
                      value={rule.targetBucket || ''}
                      onChange={(e) => updateRule(idx, { targetBucket: e.target.value || null })}
                      placeholder="e.g., du_server"
                    />
                    <Select
                      label="Scope"
                      value={rule.targetScopeId || ''}
                      onChange={(v) => updateRule(idx, { targetScopeId: v || null })}
                      options={scopeOptions}
                      disabled={rule.targetScopeType !== 'site_archetype'}
                    />
                    <Select
                      label="Adjustment Type"
                      value={rule.adjustmentType}
                      onChange={(v) => updateRule(idx, { adjustmentType: v })}
                      options={AdjustmentTypes.map(t => ({ value: t, label: AdjustmentTypeLabels[t] }))}
                    />
                    <NumberInput
                      label={rule.adjustmentType === 'percentage' ? 'Percent Change' : 'Amount ($)'}
                      value={rule.adjustmentValue}
                      onChange={(v) => updateRule(idx, { adjustmentValue: v })}
                      helperText={
                        rule.adjustmentType === 'percentage'
                          ? 'e.g., -10 for 10% decrease'
                          : rule.adjustmentType === 'fixed'
                          ? 'e.g., -1000 to subtract $1000'
                          : 'New absolute value'
                      }
                    />
                  </div>

                  <Input
                    label="Notes (optional)"
                    value={rule.notes || ''}
                    onChange={(e) => updateRule(idx, { notes: e.target.value || null })}
                    placeholder="e.g., Vendor discount negotiated"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSet(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!editingSet.name.trim() || isSaving} isLoading={isSaving}>
                <Save className="w-4 h-4" />
                Save Adjustment Set
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
