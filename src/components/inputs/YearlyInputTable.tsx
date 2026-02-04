'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Button } from '@/components/ui/Button';
import { getBucketLabel, type Bucket, type Day, type Domain, type Layer, type ScalingDriver, type ScopeType } from '@/lib/model/taxonomy';
import { formatCurrencyDetailed } from '@/lib/utils/currency';

interface YearlyInputTableProps {
  day: Day;
  domain: Domain;
  layer: Layer;
  buckets: readonly string[];
  defaultDriver: ScalingDriver;
  defaultScope: ScopeType;
}

interface YearValues {
  [key: string]: number; // year_0, year_1, etc.
}

interface InputRow {
  id?: string;
  bucket: string;
  yearValues: YearValues;
  isEdited: boolean;
}

export function YearlyInputTable({
  day,
  domain,
  layer,
  buckets,
  defaultDriver,
  defaultScope,
}: YearlyInputTableProps) {
  const currentVersion = useScenarioStore(s => s.currentVersion);
  const inputFacts = useScenarioStore(s => s.inputFacts);
  const siteArchetypes = useScenarioStore(s => s.siteArchetypes);
  const saveInputFact = useScenarioStore(s => s.saveInputFact);

  const [rows, setRows] = useState<InputRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Default to 5 years (TCO standard)
  const tcoYears = 5;

  // Compute deployment activity by year
  const deploymentActivityByYear = useMemo(() => {
    const activity: Record<number, boolean> = {};

    for (let y = 0; y < tcoYears; y++) {
      let hasActivity = false;

      for (const arch of siteArchetypes) {
        const schedule = arch.deploymentSchedule || [];
        const hasSchedule = schedule.length > 0;

        if (!hasSchedule) {
          // No schedule: all deployed in Year 0
          if (y === 0) {
            hasActivity = true;
            break;
          }
        } else {
          // Has schedule - check if there are deployments this year
          const thisYearSchedule = schedule.find(s => s.yearIndex === y);
          if (thisYearSchedule && (
            thisYearSchedule.sitesDeployed > 0 ||
            thisYearSchedule.cusDeployed > 0 ||
            thisYearSchedule.dcsDeployed > 0
          )) {
            hasActivity = true;
            break;
          }
        }
      }

      activity[y] = hasActivity;
    }

    return activity;
  }, [siteArchetypes, tcoYears]);

  // Initialize rows from existing input facts
  useEffect(() => {
    if (!currentVersion) return;

    const existingFacts = inputFacts.filter(
      f => f.day === day && f.domain === domain && f.layer === layer && f.driver === defaultDriver
    );

    const initialRows: InputRow[] = [];

    for (const bucket of buckets) {
      const fact = existingFacts.find(f => f.bucket === bucket && !f.scopeId);

      // Parse valueJson to get year values
      let yearValues: YearValues = {};
      if (fact?.valueJson) {
        try {
          yearValues = JSON.parse(fact.valueJson);
        } catch {
          yearValues = {};
        }
      }

      // Ensure all years have values
      for (let y = 0; y < tcoYears; y++) {
        if (yearValues[`year_${y}`] === undefined) {
          yearValues[`year_${y}`] = 0;
        }
      }

      initialRows.push({
        id: fact?.id,
        bucket,
        yearValues,
        isEdited: false,
      });
    }

    setRows(initialRows);
  }, [currentVersion, inputFacts, day, domain, layer, buckets, defaultDriver, tcoYears]);

  const handleYearValueChange = (rowIndex: number, year: number, value: number) => {
    const updated = [...rows];
    const existingRow = updated[rowIndex];
    if (!existingRow) return;

    updated[rowIndex] = {
      ...existingRow,
      yearValues: {
        ...existingRow.yearValues,
        [`year_${year}`]: value,
      },
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

      await Promise.all(
        editedRows.map(row =>
          saveInputFact({
            id: row.id,
            scenarioVersionId: currentVersion.id,
            day,
            domain,
            layer,
            bucket: row.bucket,
            scopeType: defaultScope,
            scopeId: null,
            driver: defaultDriver,
            valueNumber: 0, // Not used for per_year_deployment
            valueJson: JSON.stringify(row.yearValues),
            licenseModel: null,
            notes: null,
          })
        )
      );

      setRows(rows.map(r => ({ ...r, isEdited: false })));
      setSaveStatus('success');

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate row totals
  const getRowTotal = useCallback((yearValues: YearValues) => {
    let total = 0;
    for (let y = 0; y < tcoYears; y++) {
      total += yearValues[`year_${y}`] ?? 0;
    }
    return total;
  }, [tcoYears]);

  // Calculate column totals (per year)
  const columnTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (let y = 0; y < tcoYears; y++) {
      totals[y] = rows.reduce((sum, row) => sum + (row.yearValues[`year_${y}`] ?? 0), 0);
    }
    return totals;
  }, [rows, tcoYears]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + getRowTotal(row.yearValues), 0);
  }, [rows, getRowTotal]);

  const hasEdits = rows.some(r => r.isEdited);

  if (!currentVersion) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select or create a scenario to enter inputs
      </div>
    );
  }

  if (siteArchetypes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Add site archetypes first to configure deployment services
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-400">
            Enter deployment support costs by year. Gray columns have no deployments.
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 rounded-lg border border-gray-700">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Total:</span>
            <span className="text-sm font-semibold text-cyan-400">{formatCurrencyDetailed(grandTotal)}</span>
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
            <tr className="bg-gray-800/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Service</th>
              {Array.from({ length: tcoYears }, (_, y) => (
                <th
                  key={`year-${y}`}
                  className={`text-right px-4 py-3 text-sm font-medium w-28 ${
                    deploymentActivityByYear[y] ? 'text-gray-300' : 'text-gray-500 bg-gray-800/30'
                  }`}
                >
                  Y{y + 1}
                  {!deploymentActivityByYear[y] && (
                    <span className="block text-xs font-normal text-gray-600">No deploys</span>
                  )}
                </th>
              ))}
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-300 w-28">Total</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.bucket} className={row.isEdited ? 'bg-cyan-500/5' : ''}>
                <td className="px-4 py-2">
                  <span className="text-sm text-gray-200">
                    {getBucketLabel(row.bucket as Bucket)}
                  </span>
                </td>
                {Array.from({ length: tcoYears }, (_, y) => (
                  <td key={`${row.bucket}-year-${y}`} className="px-2 py-2">
                    <input
                      type="number"
                      value={row.yearValues[`year_${y}`] ?? 0}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        handleYearValueChange(rowIndex, y, isNaN(parsed) ? 0 : parsed);
                      }}
                      className={`w-full text-right border rounded px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none ${
                        deploymentActivityByYear[y]
                          ? 'bg-gray-800/50 border-gray-700 text-gray-100'
                          : 'bg-gray-800/20 border-gray-800 text-gray-500'
                      }`}
                      step="1"
                      min="0"
                      disabled={!deploymentActivityByYear[y]}
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-right">
                  <span className="text-sm font-medium text-cyan-400">
                    {formatCurrencyDetailed(getRowTotal(row.yearValues))}
                  </span>
                </td>
                <td className="px-2 py-2 text-center">
                  {row.isEdited && (
                    <span className="text-xs text-cyan-400">*</span>
                  )}
                </td>
              </tr>
            ))}
            {/* Column totals row */}
            <tr className="border-t-2 border-gray-600 bg-gray-800/50">
              <td className="px-4 py-3">
                <span className="text-sm font-bold text-gray-200">Year Total</span>
              </td>
              {Array.from({ length: tcoYears }, (_, y) => (
                <td key={`total-year-${y}`} className="px-4 py-3 text-right">
                  <span className={`text-sm font-semibold ${
                    deploymentActivityByYear[y] ? 'text-purple-400' : 'text-gray-500'
                  }`}>
                    {formatCurrencyDetailed(columnTotals[y] ?? 0)}
                  </span>
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-emerald-400">
                  {formatCurrencyDetailed(grandTotal)}
                </span>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
