'use client';

import React, { useState, useEffect } from 'react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Button } from '@/components/ui/Button';
import { GitCompare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ScenarioSelectorProps {
  onCompare: (baselineId: string, comparisonId: string) => void;
  isLoading?: boolean;
}

interface ScenarioOption {
  id: string;
  name: string;
  isBaseline: boolean;
  hasComputed: boolean;
}

export function ScenarioSelector({ onCompare, isLoading }: ScenarioSelectorProps) {
  const { scenarios } = useScenarioStore();
  const [baselineId, setBaselineId] = useState<string>('');
  const [comparisonId, setComparisonId] = useState<string>('');
  const [scenarioOptions, setScenarioOptions] = useState<ScenarioOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch computed status for all scenarios
  useEffect(() => {
    async function loadScenarioOptions() {
      setLoadingOptions(true);
      const options: ScenarioOption[] = [];

      for (const scenario of scenarios) {
        const activeVersion = scenario.versions?.find(v => v.isActive);
        if (!activeVersion) {
          options.push({
            id: scenario.id,
            name: scenario.name,
            isBaseline: scenario.isBaseline,
            hasComputed: false,
          });
          continue;
        }

        // Check if this scenario has computed results
        try {
          const res = await fetch(`/api/computed-facts?versionId=${activeVersion.id}`);
          if (res.ok) {
            const facts = await res.json();
            options.push({
              id: scenario.id,
              name: scenario.name,
              isBaseline: scenario.isBaseline,
              hasComputed: Array.isArray(facts) && facts.length > 0,
            });
          } else {
            options.push({
              id: scenario.id,
              name: scenario.name,
              isBaseline: scenario.isBaseline,
              hasComputed: false,
            });
          }
        } catch {
          options.push({
            id: scenario.id,
            name: scenario.name,
            isBaseline: scenario.isBaseline,
            hasComputed: false,
          });
        }
      }

      setScenarioOptions(options);
      setLoadingOptions(false);

      // Auto-select baseline if available
      const baseline = options.find(o => o.isBaseline && o.hasComputed);
      if (baseline && !baselineId) {
        setBaselineId(baseline.id);
      }
    }

    if (scenarios.length > 0) {
      loadScenarioOptions();
    }
  }, [scenarios, baselineId]);

  const computedScenarios = scenarioOptions.filter(s => s.hasComputed);
  const canCompare = baselineId && comparisonId && baselineId !== comparisonId;

  const handleCompare = () => {
    if (canCompare) {
      onCompare(baselineId, comparisonId);
    }
  };

  if (loadingOptions) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
          <span>Loading scenarios...</span>
        </div>
      </div>
    );
  }

  if (computedScenarios.length < 2) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 text-yellow-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Insufficient Computed Scenarios</p>
            <p className="text-sm text-gray-400 mt-1">
              At least 2 scenarios with computed TCO results are required for comparison.
              Currently {computedScenarios.length} scenario{computedScenarios.length !== 1 ? 's have' : ' has'} computed results.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Go to Dashboard and click &quot;Compute TCO&quot; for each scenario you want to compare.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <GitCompare className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-medium text-gray-100">Select Scenarios to Compare</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Baseline selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Baseline Scenario
          </label>
          <select
            value={baselineId}
            onChange={(e) => setBaselineId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Select baseline...</option>
            {computedScenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name} {scenario.isBaseline ? '(Baseline)' : ''}
              </option>
            ))}
          </select>
          {baselineId && (
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Has computed results</span>
            </div>
          )}
        </div>

        {/* Comparison selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Compare To
          </label>
          <select
            value={comparisonId}
            onChange={(e) => setComparisonId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Select scenario...</option>
            {computedScenarios
              .filter(s => s.id !== baselineId)
              .map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name} {scenario.isBaseline ? '(Baseline)' : ''}
                </option>
              ))}
          </select>
          {comparisonId && (
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Has computed results</span>
            </div>
          )}
        </div>
      </div>

      {baselineId && comparisonId && baselineId === comparisonId && (
        <div className="flex items-center gap-2 mb-4 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Please select two different scenarios to compare</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleCompare}
          disabled={!canCompare || isLoading}
          isLoading={isLoading}
        >
          <GitCompare className="w-4 h-4" />
          Load Comparison
        </Button>
      </div>

      {/* Available scenarios summary */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          {computedScenarios.length} of {scenarioOptions.length} scenarios have computed results.
          {scenarioOptions.length - computedScenarios.length > 0 && (
            <span className="text-gray-600">
              {' '}({scenarioOptions.length - computedScenarios.length} need TCO computation)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
