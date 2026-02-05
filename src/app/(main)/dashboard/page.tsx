'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, DollarSign, Calculator, RefreshCw, SlidersHorizontal, AlertCircle, GitCompare } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/currency';
import { DefaultModelAssumptions } from '@/lib/model/taxonomy';
import { DomainImpact } from '@/components/dashboard/DomainImpact';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Chart color palette - Obsidian Finance theme
const CHART_COLORS = {
  capex: '#f59e0b',    // Amber
  opex: '#8b5cf6',     // Violet
  cumulative: '#22c55e', // Green
  npv: '#f59e0b',      // Amber
};

export default function DashboardPage() {
  const {
    currentScenario,
    currentVersion,
    computedSummary,
    computeTco,
    isLoading,
    error,
    inputFacts,
    adjustmentSets,
    fetchAdjustmentSets,
  } = useScenarioStore();

  const [hasComputed, setHasComputed] = useState(false);

  // Fetch adjustment sets when version changes
  useEffect(() => {
    if (currentVersion) {
      fetchAdjustmentSets();
    }
  }, [currentVersion, fetchAdjustmentSets]);

  // Count active adjustments
  const activeAdjustments = adjustmentSets.filter(s => s.isActive);

  // Get the discount rate from assumptions or use default
  const discountRate = React.useMemo(() => {
    const discountFact = inputFacts.find(
      f => f.layer === 'assumptions' && f.bucket === 'discount_rate'
    );
    return discountFact?.valueNumber ?? DefaultModelAssumptions.discount_rate;
  }, [inputFacts]);

  // Memoize cumulative TCO calculation with single-pass accumulation (O(n) instead of O(n²))
  const cumulativeTcoData = React.useMemo(() => {
    if (!computedSummary?.byYear) return [];
    let cumulative = 0;
    return computedSummary.byYear.map((yr) => {
      cumulative += yr.tco;
      return { ...yr, cumulative };
    });
  }, [computedSummary]);

  const handleCompute = async () => {
    try {
      await computeTco();
      setHasComputed(true);
    } catch {
      // Error already set in store
    }
  };

  if (!currentVersion) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="relative p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/20">
            <BarChart3 className="w-6 h-6 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 blur-lg opacity-40" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-slate-100 tracking-tight">Dashboard</h1>
            <p className="text-slate-500">TCO computation results and analysis</p>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#181c25] flex items-center justify-center">
                <Calculator className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Scenario Selected</h3>
              <p className="text-slate-500">Select or create a scenario to view TCO results</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="relative p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/20">
            <BarChart3 className="w-6 h-6 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 blur-lg opacity-40" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-slate-100 tracking-tight">Dashboard</h1>
            <p className="text-slate-500">
              {currentScenario?.name} <span className="text-slate-600">•</span> v{currentVersion.versionNum}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/comparison"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 bg-[#181c25] border border-white/10 rounded-lg hover:bg-[#232933] hover:border-amber-500/30 transition-all"
          >
            <GitCompare className="w-4 h-4" />
            Compare Scenarios
          </Link>
          <Button onClick={handleCompute} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4" />
            {hasComputed ? 'Recompute TCO' : 'Compute TCO'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5 animate-fade-in" variant="glow" glowColor="danger">
          <CardContent>
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Computation Error</p>
                <p className="text-sm text-red-300/80">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!computedSummary ? (
        <Card className="animate-fade-in">
          <CardContent>
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#181c25] flex items-center justify-center">
                <Calculator className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Compute</h3>
              <p className="text-slate-500 mb-6">
                Click &quot;Compute TCO&quot; to calculate results based on your inputs
              </p>
              <Button onClick={handleCompute} isLoading={isLoading} size="lg">
                <Calculator className="w-4 h-4" />
                Compute TCO Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
            <Card variant="glow" glowColor="amber">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total CAPEX</p>
                    <p className="text-2xl font-mono font-bold text-amber-400">
                      {formatCurrency(computedSummary.totalCapex)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/10">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total OPEX</p>
                    <p className="text-2xl font-mono font-bold text-violet-400">
                      {formatCurrency(computedSummary.totalOpex)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glow" glowColor="success">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-500/10">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total TCO</p>
                    <p className="text-2xl font-mono font-bold text-green-400">
                      {formatCurrency(computedSummary.totalTco)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10">
                    <Calculator className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">NPV</p>
                    <p className="text-2xl font-mono font-bold text-cyan-400">
                      {formatCurrency(computedSummary.totalNpv)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Year-by-Year TCO */}
            <Card>
              <CardHeader title="TCO by Year" description="CAPEX and OPEX breakdown" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={computedSummary.byYear}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(v) => `Y${v + 1}`}
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: '#181c25',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      }}
                      labelStyle={{ color: '#f1f5f9' }}
                      itemStyle={{ color: '#94a3b8' }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                    <Bar dataKey="capex" name="CAPEX" fill={CHART_COLORS.capex} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="opex" name="OPEX" fill={CHART_COLORS.opex} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cumulative TCO */}
            <Card>
              <CardHeader title="Cumulative TCO" description="Total cost over time" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cumulativeTcoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(v) => `Y${v + 1}`}
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: '#181c25',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      }}
                      labelStyle={{ color: '#f1f5f9' }}
                      itemStyle={{ color: '#94a3b8' }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative TCO"
                      stroke={CHART_COLORS.cumulative}
                      strokeWidth={3}
                      dot={{ fill: CHART_COLORS.cumulative, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="npv"
                      name="NPV"
                      stroke={CHART_COLORS.npv}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: CHART_COLORS.npv, strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CAPEX vs OPEX Split */}
            <Card>
              <CardHeader title="Cost Split" description="CAPEX vs OPEX distribution" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'CAPEX', value: computedSummary.totalCapex },
                        { name: 'OPEX', value: computedSummary.totalOpex },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#64748b' }}
                    >
                      <Cell fill={CHART_COLORS.capex} />
                      <Cell fill={CHART_COLORS.opex} />
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: '#181c25',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      }}
                      labelStyle={{ color: '#f1f5f9' }}
                      itemStyle={{ color: '#94a3b8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics Table */}
            <Card>
              <CardHeader title="Key Metrics" description="Summary statistics" />
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
                    <span className="text-slate-400">Average Annual Cost</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {formatCurrency(computedSummary.totalTco / (computedSummary.byYear.length || 1))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
                    <span className="text-slate-400">Year 1 Cost</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {formatCurrency(computedSummary.byYear[0]?.tco || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
                    <span className="text-slate-400">CAPEX % of TCO</span>
                    <span className="font-mono font-semibold text-amber-400">
                      {computedSummary.totalTco > 0
                        ? ((computedSummary.totalCapex / computedSummary.totalTco) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
                    <span className="text-slate-400">OPEX % of TCO</span>
                    <span className="font-mono font-semibold text-violet-400">
                      {computedSummary.totalTco > 0
                        ? ((computedSummary.totalOpex / computedSummary.totalTco) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-400">NPV Discount Rate</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {(discountRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Domain Impact Chart */}
          {computedSummary.byDayDomain && Object.keys(computedSummary.byDayDomain).length > 0 && (
            <DomainImpact byDayDomain={computedSummary.byDayDomain} />
          )}

          {/* Active Adjustments Info */}
          {activeAdjustments.length > 0 && (
            <Card variant="glow" glowColor="info">
              <CardHeader
                title="Active Adjustments"
                description="What-if adjustments applied to this calculation"
              />
              <CardContent>
                <div className="space-y-3">
                  {activeAdjustments.map((set) => (
                    <div key={set.id} className="flex items-center justify-between p-4 bg-[#181c25] rounded-lg border border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{set.name}</p>
                          {set.description && (
                            <p className="text-sm text-slate-500">{set.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-500 bg-[#232933] px-3 py-1 rounded-full">
                        {set.rules.length} rule{set.rules.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
                {computedSummary.adjustments && computedSummary.adjustments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-sm text-slate-500 mb-3">Adjustment Impact Summary:</p>
                    <div className="space-y-2">
                      {computedSummary.adjustments.map((adj) => (
                        <div key={adj.id} className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">{adj.name}</span>
                          <span className={`font-mono font-medium ${adj.totalImpact >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {adj.totalImpact >= 0 ? '+' : ''}{formatCurrency(adj.totalImpact)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
