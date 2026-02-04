'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { GitCompare, ArrowLeft, DollarSign, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import { ScenarioSelector } from '@/components/dashboard/ScenarioSelector';
import { DeltaWaterfall } from '@/components/dashboard/DeltaWaterfall';
import { ComparisonTornado } from '@/components/dashboard/ComparisonTornado';
import { ScenarioComparison } from '@/components/dashboard/ScenarioComparison';

export default function ComparisonPage() {
  const {
    comparisonScenarios,
    isComparing,
    isLoading,
    error,
    loadComparisonData,
    clearComparison,
    fetchScenarios,
    scenarios,
  } = useScenarioStore();

  // Fetch scenarios on mount if not loaded
  useEffect(() => {
    if (scenarios.length === 0) {
      fetchScenarios();
    }
  }, [scenarios.length, fetchScenarios]);

  // Clear comparison when leaving the page
  useEffect(() => {
    return () => {
      clearComparison();
    };
  }, [clearComparison]);

  const handleCompare = async (baselineId: string, comparisonId: string) => {
    await loadComparisonData([baselineId, comparisonId]);
  };

  // Get baseline and comparison scenarios
  const baseline = comparisonScenarios.find(s => s.isBaseline) || comparisonScenarios[0];
  const comparison = comparisonScenarios.find(s => s.id !== baseline?.id);

  // Check if both have computed results
  const hasValidData = baseline?.summary && comparison?.summary;

  // Calculate totals for summary cards
  const baselineTco = baseline?.summary?.totalTco || 0;
  const comparisonTco = comparison?.summary?.totalTco || 0;
  const deltaTco = comparisonTco - baselineTco;
  const deltaPercent = baselineTco > 0 ? (deltaTco / baselineTco) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <GitCompare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Compare Scenarios</h1>
            <p className="text-gray-400">
              Analyze differences between scenarios with delta visualizations
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Scenario Selector */}
      <ScenarioSelector onCompare={handleCompare} isLoading={isLoading} />

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent>
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error Loading Comparison</p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {isComparing && hasValidData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="gradient">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Baseline TCO</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {formatCurrency(baselineTco)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{baseline?.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Comparison TCO</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {formatCurrency(comparisonTco)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{comparison?.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${deltaTco < 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {deltaTco < 0 ? (
                      <TrendingDown className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Delta</p>
                    <p className={`text-2xl font-bold ${deltaTco < 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {deltaTco >= 0 ? '+' : ''}{formatCurrency(deltaTco)}
                    </p>
                    <p className={`text-xs mt-1 ${deltaTco < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(1)}% vs baseline
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delta Waterfall Chart */}
          {baseline?.summary?.byDayDomain && comparison?.summary?.byDayDomain && (
            <DeltaWaterfall
              baselineName={baseline.name}
              comparisonName={comparison.name}
              baselineTco={baselineTco}
              comparisonTco={comparisonTco}
              baselineByDayDomain={baseline.summary.byDayDomain}
              comparisonByDayDomain={comparison.summary.byDayDomain}
              title="Cost Bridge"
              description="Breakdown of changes from baseline to comparison scenario"
            />
          )}

          {/* Comparison Tornado Chart */}
          {baseline?.summary?.byDayDomain && comparison?.summary?.byDayDomain && (
            <ComparisonTornado
              baselineByDayDomain={baseline.summary.byDayDomain}
              comparisonByDayDomain={comparison.summary.byDayDomain}
              title="Impact by Category"
              description="Cost changes ranked by magnitude"
            />
          )}

          {/* Existing ScenarioComparison Table */}
          <ScenarioComparison
            scenarios={comparisonScenarios
              .filter(s => s.summary)
              .map(s => ({
                name: s.name,
                capex: s.summary!.totalCapex,
                opex: s.summary!.totalOpex,
                tco: s.summary!.totalTco,
                npv: s.summary!.totalNpv,
                isBaseline: s.isBaseline,
              }))}
            title="Scenario Comparison"
            description="Side-by-side comparison of CAPEX, OPEX, and TCO"
          />
        </>
      )}

      {/* Empty state when no comparison loaded */}
      {!isComparing && !isLoading && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <GitCompare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Ready to Compare</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Select a baseline and comparison scenario above to visualize the differences
                between them with delta waterfall and tornado charts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
