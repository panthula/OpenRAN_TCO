'use client';

import { useMemo, useState, useEffect, useCallback, Fragment } from 'react';
import { Save, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Button } from '@/components/ui/Button';
import { getBucketLabel, type Bucket, type Day, type Domain, type Layer, type ScalingDriver, type ScopeType, type BucketGroup } from '@/lib/model/taxonomy';
import { formatCurrencyDetailed } from '@/lib/utils/currency';

interface InputTableProps {
  day: Day;
  domain: Domain;
  layer: Layer;
  buckets: readonly string[];
  defaultDriver: ScalingDriver;
  defaultScope: ScopeType;
  /** Optional bucket groups for collapsible sections (only used with network_global scope) */
  bucketGroups?: BucketGroup[];
  /** Optional buckets that use count × value (per_integration driver) */
  integrationBuckets?: readonly string[];
}

interface InputRow {
  id?: string;
  bucket: string;
  scopeId: string | null;
  valueNumber: number;
  valueJson: string | null;  // For {"count": N} in per_integration buckets
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
  bucketGroups,
  integrationBuckets,
}: InputTableProps) {
  // Use selective Zustand subscriptions to prevent unnecessary re-renders
  const currentVersion = useScenarioStore(s => s.currentVersion);
  const inputFacts = useScenarioStore(s => s.inputFacts);
  const siteArchetypes = useScenarioStore(s => s.siteArchetypes);
  const saveInputFact = useScenarioStore(s => s.saveInputFact);

  const [rows, setRows] = useState<InputRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Track which scopes are collapsed (default: all collapsed)
  const [collapsedScopes, setCollapsedScopes] = useState<Set<string>>(new Set());

  // Track which bucket groups are collapsed (for network_global with bucketGroups)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Get scope options based on defaultScope
  const scopeOptions = useMemo(() => {
    if (defaultScope === 'site_archetype') {
      return siteArchetypes.map(a => ({ value: a.id, label: a.name }));
    }
    return [{ value: '', label: 'Network Global' }];
  }, [defaultScope, siteArchetypes]);

  // Initialize collapsed scopes: default all collapsed
  useEffect(() => {
    if (defaultScope === 'network_global') {
      setCollapsedScopes(new Set());
      return;
    }
    // Collapse all scopes by default when scope options change
    const allScopeIds = new Set(scopeOptions.map(s => s.value || 'global'));
    setCollapsedScopes(allScopeIds);
  }, [scopeOptions, defaultScope]);

  // Toggle a single scope's collapsed state
  const toggleScope = useCallback((scopeId: string | null) => {
    const key = scopeId ?? 'global';
    setCollapsedScopes(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Check if a scope is collapsed
  const isCollapsed = useCallback(
    (scopeId: string | null) => collapsedScopes.has(scopeId ?? 'global'),
    [collapsedScopes]
  );

  // Expand all scopes
  const expandAll = useCallback(() => setCollapsedScopes(new Set()), []);

  // Collapse all scopes
  const collapseAll = useCallback(() => {
    const allScopeIds = new Set(scopeOptions.map(s => s.value || 'global'));
    setCollapsedScopes(allScopeIds);
  }, [scopeOptions]);

  // Toggle a bucket group's collapsed state
  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Check if a group is collapsed
  const isGroupCollapsed = useCallback(
    (groupId: string) => collapsedGroups.has(groupId),
    [collapsedGroups]
  );

  // Expand all groups
  const expandAllGroups = useCallback(() => setCollapsedGroups(new Set()), []);

  // Collapse all groups
  const collapseAllGroups = useCallback(() => {
    if (bucketGroups) {
      setCollapsedGroups(new Set(bucketGroups.map(g => g.id)));
    }
  }, [bucketGroups]);

  // Integration bucket helpers
  const isIntegrationBucket = useCallback(
    (bucket: string) => integrationBuckets?.includes(bucket) ?? false,
    [integrationBuckets]
  );

  const getCount = useCallback((valueJson: string | null): number => {
    if (!valueJson) return 1;
    try {
      const parsed = JSON.parse(valueJson);
      return parsed.count ?? 1;
    } catch {
      return 1;
    }
  }, []);

  const getIntegrationTotal = useCallback(
    (row: InputRow): number => row.valueNumber * getCount(row.valueJson),
    [getCount]
  );

  // Initialize rows from existing input facts
  useEffect(() => {
    if (!currentVersion) return;

    const existingFacts = inputFacts.filter(
      f => f.day === day && f.domain === domain && f.layer === layer
    );

    // Compute scope options inline to avoid dependency on memoized value
    const currentScopeOptions = defaultScope === 'site_archetype'
      ? siteArchetypes.map(a => ({ value: a.id, label: a.name }))
      : [{ value: '', label: 'Network Global' }];

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
            valueJson: fact?.valueJson ?? null,
            licenseModel: fact?.licenseModel ?? null,
            notes: fact?.notes ?? '',
            isEdited: false,
          });
        }

        return initialRows;
      }

      // Group by scope (archetype/DC): for each scope show all buckets.
      for (const scope of currentScopeOptions) {
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
            valueJson: fact?.valueJson ?? null,
            licenseModel: fact?.licenseModel ?? null,
            notes: fact?.notes ?? '',
            isEdited: false,
          });
        }
      }

      return initialRows;
    });
  }, [currentVersion, inputFacts, day, domain, layer, buckets, defaultScope, siteArchetypes]);

  const handleValueChange = (index: number, value: number) => {
    const updated = [...rows];
    const existingRow = updated[index];
    if (!existingRow) return;
    updated[index] = { ...existingRow, valueNumber: value, isEdited: true };
    setRows(updated);
  };

  const handleCountChange = (index: number, count: number) => {
    const updated = [...rows];
    const existingRow = updated[index];
    if (!existingRow) return;
    updated[index] = {
      ...existingRow,
      valueJson: JSON.stringify({ count: Math.max(0, count) }),
      isEdited: true,
    };
    setRows(updated);
  };

  const handleSave = async () => {
    if (!currentVersion) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const editedRows = rows.filter(r => r.isEdited);

      // Save all rows in parallel for better performance
      await Promise.all(
        editedRows.map(row => {
          // Determine driver: use per_integration for integration buckets, otherwise use defaultDriver
          const driver = isIntegrationBucket(row.bucket) ? 'per_integration' : defaultDriver;
          return saveInputFact({
            id: row.id,
            scenarioVersionId: currentVersion.id,
            day,
            domain,
            layer,
            bucket: row.bucket,
            scopeType: defaultScope,
            scopeId: row.scopeId,
            driver,
            valueNumber: Number(row.valueNumber) || 0,
            valueJson: row.valueJson,
            licenseModel: row.licenseModel,
            notes: row.notes || null,
          });
        })
      );

      // Only mark as saved if ALL saves succeeded
      setRows(rows.map(r => ({ ...r, isEdited: false })));
      setSaveStatus('success');

      // Clear success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      // Keep isEdited true so user knows data wasn't saved
      // Clear error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const hasEdits = rows.some(r => r.isEdited);

  // Helper to get effective value for a row (uses count × value for integration buckets)
  const getEffectiveValue = useCallback(
    (row: InputRow): number => {
      if (isIntegrationBucket(row.bucket)) {
        return getIntegrationTotal(row);
      }
      return row.valueNumber || 0;
    },
    [isIntegrationBucket, getIntegrationTotal]
  );

  // Compute table total (sum of all values, using count × value for integrations)
  const tableTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + getEffectiveValue(row), 0);
  }, [rows, getEffectiveValue]);

  // Compute scope group totals (sum per scope)
  const scopeGroupTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      const key = row.scopeId ?? 'global';
      totals[key] = (totals[key] || 0) + getEffectiveValue(row);
    }
    return totals;
  }, [rows, getEffectiveValue]);

  // Compute bucket group totals (sum per bucket group)
  const bucketGroupTotals = useMemo(() => {
    if (!bucketGroups) return {};
    const totals: Record<string, number> = {};
    for (const group of bucketGroups) {
      totals[group.id] = rows
        .filter(row => group.buckets.includes(row.bucket))
        .reduce((sum, row) => sum + getEffectiveValue(row), 0);
    }
    return totals;
  }, [rows, bucketGroups, getEffectiveValue]);

  // Pre-compute grouped rows with their original indices (avoids filter/findIndex in render)
  const groupedRows = useMemo(() => {
    if (!bucketGroups) return null;
    return bucketGroups.map(group => ({
      ...group,
      rows: rows
        .map((row, originalIndex) => ({ row, originalIndex }))
        .filter(({ row }) => group.buckets.includes(row.bucket))
    }));
  }, [rows, bucketGroups]);

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
        Add site archetypes first to enter costs
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-400">
            Enter cost values for each bucket. Values are in USD.
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 rounded-lg border border-gray-700">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Total:</span>
            <span className="text-sm font-semibold text-cyan-400">{formatCurrencyDetailed(tableTotal)}</span>
          </div>
          {defaultScope !== 'network_global' && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                onClick={expandAll}
                className="hover:text-gray-300 transition-colors"
              >
                Expand All
              </button>
              <span>|</span>
              <button
                onClick={collapseAll}
                className="hover:text-gray-300 transition-colors"
              >
                Collapse All
              </button>
            </div>
          )}
          {defaultScope === 'network_global' && bucketGroups && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                onClick={expandAllGroups}
                className="hover:text-gray-300 transition-colors"
              >
                Expand All
              </button>
              <span>|</span>
              <button
                onClick={collapseAllGroups}
                className="hover:text-gray-300 transition-colors"
              >
                Collapse All
              </button>
            </div>
          )}
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
                <th className="text-left">Archetype</th>
              )}
              <th className="text-right w-40">Value (USD)</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {/* Grouped rendering for network_global with bucketGroups */}
            {defaultScope === 'network_global' && groupedRows ? (
              groupedRows.map(group => (
                <Fragment key={group.id}>
                  {/* Group header */}
                  <tr
                    className="bg-gray-900/40 cursor-pointer hover:bg-gray-800/60 transition-colors"
                    onClick={() => toggleGroup(group.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleGroup(group.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={!isGroupCollapsed(group.id)}
                  >
                    <td colSpan={3} className="py-2 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isGroupCollapsed(group.id) ? (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                            {group.label}
                          </span>
                          {isGroupCollapsed(group.id) && (
                            <span className="text-xs text-gray-500">
                              ({group.buckets.length} items)
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-cyan-400">
                          Subtotal: {formatCurrencyDetailed(bucketGroupTotals[group.id] || 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* Group items */}
                  {!isGroupCollapsed(group.id) && (
                    <>
                      {/* Integration groups get a sub-header with Count | Per-Unit | Total */}
                      {group.id === 'oss_integrations' && (
                        <tr className="bg-gray-900/20">
                          <td className="py-1 px-4">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Item</span>
                          </td>
                          <td className="py-1 px-2 text-center w-20">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Count</span>
                          </td>
                          <td className="py-1 px-2 text-right w-32">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Per-Unit</span>
                          </td>
                          <td className="py-1 px-2 text-right w-28">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
                          </td>
                          <td className="w-20"></td>
                        </tr>
                      )}
                      {group.rows.map(({ row, originalIndex }) => {
                        const isIntegration = isIntegrationBucket(row.bucket);

                        if (isIntegration) {
                          // Integration row: Count × Per-Unit = Total
                          const count = getCount(row.valueJson);
                          const total = getIntegrationTotal(row);

                          return (
                            <tr key={`${row.bucket}-${row.scopeId || 'global'}`} className={row.isEdited ? 'bg-cyan-500/5' : ''}>
                              <td className="py-2 px-4">
                                <span className="text-sm text-gray-200">
                                  {getBucketLabel(row.bucket as Bucket)}
                                </span>
                              </td>
                              <td className="py-2 px-2 w-20">
                                <input
                                  type="number"
                                  value={count}
                                  onChange={(e) => {
                                    const parsed = parseInt(e.target.value, 10);
                                    handleCountChange(originalIndex, isNaN(parsed) ? 0 : parsed);
                                  }}
                                  className="w-full text-center bg-gray-800/50 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                                  step="1"
                                  min="0"
                                />
                              </td>
                              <td className="py-2 px-2 w-32">
                                <input
                                  type="number"
                                  value={row.valueNumber}
                                  onChange={(e) => {
                                    const parsed = parseFloat(e.target.value);
                                    handleValueChange(originalIndex, isNaN(parsed) ? 0 : parsed);
                                  }}
                                  className="w-full text-right bg-gray-800/50 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                                  step="0.01"
                                  min="0"
                                />
                              </td>
                              <td className="py-2 px-2 text-right w-28">
                                <span className="text-sm font-medium text-cyan-400">
                                  {formatCurrencyDetailed(total)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center w-20">
                                {row.isEdited && (
                                  <span className="text-xs text-cyan-400">Modified</span>
                                )}
                              </td>
                            </tr>
                          );
                        }

                        // Non-integration row: single value input
                        return (
                          <tr key={`${row.bucket}-${row.scopeId || 'global'}`} className={row.isEdited ? 'bg-cyan-500/5' : ''}>
                            <td>
                              <span className="text-sm text-gray-200">
                                {getBucketLabel(row.bucket as Bucket)}
                              </span>
                            </td>
                            <td className="text-right" colSpan={group.id === 'oss_integrations' ? 3 : 1}>
                              <input
                                type="number"
                                value={row.valueNumber}
                                onChange={(e) => {
                                  const parsed = parseFloat(e.target.value);
                                  handleValueChange(originalIndex, isNaN(parsed) ? 0 : parsed);
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
                        );
                      })}
                    </>
                  )}
                </Fragment>
              ))
            ) : (
              /* Standard rendering (network_global without groups OR site_archetype) */
              rows.map((row, index) => {
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
                  <Fragment key={`${row.bucket}-${row.scopeId || 'global'}`}>
                    {showScopeHeader && (
                      <tr
                        className="bg-gray-900/40 cursor-pointer hover:bg-gray-800/60 transition-colors"
                        onClick={() => toggleScope(row.scopeId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleScope(row.scopeId);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={!isCollapsed(row.scopeId)}
                      >
                        <td colSpan={4} className="py-2 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isCollapsed(row.scopeId) ? (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                                {scopeLabel}
                              </span>
                              {isCollapsed(row.scopeId) && (
                                <span className="text-xs text-gray-500">
                                  ({buckets.length} items)
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-cyan-400">
                              Subtotal: {formatCurrencyDetailed(scopeGroupTotals[row.scopeId ?? 'global'] || 0)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!isCollapsed(row.scopeId) && (
                      <tr className={row.isEdited ? 'bg-cyan-500/5' : ''}>
                        <td>
                          <span className="text-sm text-gray-200">
                            {getBucketLabel(row.bucket as Bucket)}
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
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

