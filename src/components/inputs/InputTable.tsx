'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Button } from '@/components/ui/Button';
import { getBucketLabel, type Day, type Domain, type Layer, type ScalingDriver, type ScopeType } from '@/lib/model/taxonomy';

interface InputTableProps {
  day: Day;
  domain: Domain;
  layer: Layer;
  buckets: readonly string[];
  defaultDriver: ScalingDriver;
  defaultScope: ScopeType;
}

interface InputRow {
  id?: string;
  bucket: string;
  scopeId: string | null;
  valueNumber: number;
  licenseModel: string | null;
  notes: string;
  isEdited: boolean;
}

export function InputTable({
  day,
  domain,
  layer,
  buckets,
  defaultDriver,
  defaultScope,
}: InputTableProps) {
  const {
    currentVersion,
    inputFacts,
    siteArchetypes,
    dcTypes,
    saveInputFact,
  } = useScenarioStore();

  const [rows, setRows] = useState<InputRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get scope options based on defaultScope
  const scopeOptions = useMemo(() => {
    if (defaultScope === 'site_archetype') {
      return siteArchetypes.map(a => ({ value: a.id, label: a.name }));
    }
    if (defaultScope === 'dc_type') {
      return dcTypes.map(d => ({ value: d.id, label: d.name }));
    }
    return [{ value: '', label: 'Network Global' }];
  }, [defaultScope, siteArchetypes, dcTypes]);

  // Initialize rows from existing input facts
  useEffect(() => {
    if (!currentVersion) return;

    const existingFacts = inputFacts.filter(
      f => f.day === day && f.domain === domain && f.layer === layer
    );

    setRows((prevRows) => {
      const prevByKey = new Map<string, InputRow>(
        prevRows.map(r => [`${r.bucket}|${r.scopeId ?? ''}`, r])
      );

      const initialRows: InputRow[] = [];

      if (defaultScope === 'network_global') {
        for (const bucket of buckets) {
          const fact = existingFacts.find(f => f.bucket === bucket && !f.scopeId);
          const key = `${bucket}|`;
          const prev = prevByKey.get(key);
          if (prev?.isEdited) {
            initialRows.push(prev);
            continue;
          }
          initialRows.push({
            id: fact?.id,
            bucket,
            scopeId: null,
            valueNumber: Number(fact?.valueNumber) || 0,
            licenseModel: fact?.licenseModel ?? null,
            notes: fact?.notes ?? '',
            isEdited: false,
          });
        }

        return initialRows;
      }

      // Group by scope (archetype/DC): for each scope show all buckets.
      for (const scope of scopeOptions) {
        for (const bucket of buckets) {
          const key = `${bucket}|${scope.value}`;
          const prev = prevByKey.get(key);
          if (prev?.isEdited) {
            initialRows.push(prev);
            continue;
          }

          const fact = existingFacts.find(f => f.bucket === bucket && f.scopeId === scope.value);
          initialRows.push({
            id: fact?.id,
            bucket,
            scopeId: scope.value || null,
            valueNumber: Number(fact?.valueNumber) || 0,
            licenseModel: fact?.licenseModel ?? null,
            notes: fact?.notes ?? '',
            isEdited: false,
          });
        }
      }

      return initialRows;
    });
  }, [currentVersion, inputFacts, day, domain, layer, buckets, defaultScope, scopeOptions]);

  const handleValueChange = (index: number, value: number) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], valueNumber: value, isEdited: true };
    setRows(updated);
  };

  const handleSave = async () => {
    if (!currentVersion) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const editedRows = rows.filter(r => r.isEdited);
      for (const row of editedRows) {
        await saveInputFact({
          id: row.id,
          scenarioVersionId: currentVersion.id,
          day,
          domain,
          layer,
          bucket: row.bucket,
          scopeType: defaultScope,
          scopeId: row.scopeId,
          driver: defaultDriver,
          valueNumber: Number(row.valueNumber) || 0,
          licenseModel: row.licenseModel,
          notes: row.notes || null,
        });
      }

      // Only mark as saved if ALL saves succeeded
      setRows(rows.map(r => ({ ...r, isEdited: false })));
      setSaveStatus('success');
      
      // Clear success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      // Keep isEdited true so user knows data wasn't saved
      // Clear error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const hasEdits = rows.some(r => r.isEdited);

  // Compute table total (sum of all values)
  const tableTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + (row.valueNumber || 0), 0);
  }, [rows]);

  // Compute scope group totals (sum per scope)
  const scopeGroupTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      const key = row.scopeId ?? 'global';
      totals[key] = (totals[key] || 0) + (row.valueNumber || 0);
    }
    return totals;
  }, [rows]);

  if (!currentVersion) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select or create a scenario to enter inputs
      </div>
    );
  }

  if (scopeOptions.length === 0 && defaultScope !== 'network_global') {
    return (
      <div className="text-center py-8 text-gray-500">
        {defaultScope === 'site_archetype' 
          ? 'Add site archetypes first to enter per-site costs'
          : 'Configure DC types first to enter per-DC costs'
        }
      </div>
    );
  }

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-400">
            Enter cost values for each bucket. Values are in USD.
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 rounded-lg border border-gray-700">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Total:</span>
            <span className="text-sm font-semibold text-cyan-400">{formatCurrency(tableTotal)}</span>
          </div>
        </div>
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
              <span className="text-xs font-medium">Save failed</span>
            </div>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasEdits || isSaving}
            isLoading={isSaving}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Bucket</th>
              {defaultScope !== 'network_global' && (
                <th className="text-left">
                  {defaultScope === 'site_archetype' ? 'Archetype' : 'DC Type'}
                </th>
              )}
              <th className="text-right w-40">Value (USD)</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const scopeLabel =
                defaultScope === 'network_global'
                  ? 'Network Global'
                  : scopeOptions.find(s => s.value === row.scopeId)?.label || '-';

              const prevScopeLabel =
                index === 0
                  ? null
                  : defaultScope === 'network_global'
                    ? 'Network Global'
                    : scopeOptions.find(s => s.value === rows[index - 1]?.scopeId)?.label || '-';

              const showScopeHeader = defaultScope !== 'network_global' && scopeLabel !== prevScopeLabel;

              return (
                <React.Fragment key={`${row.bucket}-${row.scopeId || 'global'}`}>
                  {showScopeHeader && (
                    <tr className="bg-gray-900/40">
                      <td colSpan={4} className="py-2 px-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                            {defaultScope === 'site_archetype' ? 'Archetype' : 'DC Type'}: {scopeLabel}
                          </span>
                          <span className="text-xs font-medium text-emerald-400">
                            Subtotal: {formatCurrency(scopeGroupTotals[row.scopeId ?? 'global'] || 0)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className={row.isEdited ? 'bg-cyan-500/5' : ''}>
                    <td>
                      <span className="text-sm text-gray-200">
                        {getBucketLabel(row.bucket as never)}
                      </span>
                    </td>
                    {defaultScope !== 'network_global' && (
                      <td>
                        <span className="text-sm text-gray-400">
                          {scopeLabel}
                        </span>
                      </td>
                    )}
                    <td className="text-right">
                      <input
                        type="number"
                        value={row.valueNumber}
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value);
                          handleValueChange(index, isNaN(parsed) ? 0 : parsed);
                        }}
                        className="w-full text-right bg-gray-800/50 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="text-center">
                      {row.isEdited && (
                        <span className="text-xs text-cyan-400">Modified</span>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

