'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calculator, RefreshCw } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const {
    currentScenario,
    currentVersion,
    computedSummary,
    computeTco,
    isLoading,
  } = useScenarioStore();

  const [hasComputed, setHasComputed] = useState(false);

  const handleCompute = async () => {
    await computeTco();
    setHasComputed(true);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  if (!currentVersion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
            <p className="text-gray-400">TCO computation results and analysis</p>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Scenario Selected</h3>
              <p className="text-gray-500">Select or create a scenario to view TCO results</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
            <p className="text-gray-400">
              {currentScenario?.name} - v{currentVersion.versionNum}
            </p>
          </div>
        </div>
        <Button onClick={handleCompute} isLoading={isLoading}>
          <RefreshCw className="w-4 h-4" />
          {hasComputed ? 'Recompute TCO' : 'Compute TCO'}
        </Button>
      </div>

      {!computedSummary ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Ready to Compute</h3>
              <p className="text-gray-500 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="gradient">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total CAPEX</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {formatCurrency(computedSummary.totalCapex)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total OPEX</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {formatCurrency(computedSummary.totalOpex)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total TCO</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(computedSummary.totalTco)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Calculator className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">NPV</p>
                    <p className="text-2xl font-bold text-orange-400">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(v) => `Y${v + 1}`}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke="#9ca3af"
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="capex" name="CAPEX" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="opex" name="OPEX" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cumulative TCO */}
            <Card>
              <CardHeader title="Cumulative TCO" description="Total cost over time" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={computedSummary.byYear.map((yr, idx) => ({
                      ...yr,
                      cumulative: computedSummary.byYear
                        .slice(0, idx + 1)
                        .reduce((sum, y) => sum + y.tco, 0),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(v) => `Y${v + 1}`}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke="#9ca3af"
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative TCO"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="npv"
                      name="NPV"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
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
                    >
                      <Cell fill="#06b6d4" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics Table */}
            <Card>
              <CardHeader title="Key Metrics" description="Summary statistics" />
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Average Annual Cost</span>
                    <span className="font-semibold text-gray-200">
                      {formatCurrency(computedSummary.totalTco / (computedSummary.byYear.length || 1))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Year 1 Cost</span>
                    <span className="font-semibold text-gray-200">
                      {formatCurrency(computedSummary.byYear[0]?.tco || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">CAPEX % of TCO</span>
                    <span className="font-semibold text-cyan-400">
                      {computedSummary.totalTco > 0
                        ? ((computedSummary.totalCapex / computedSummary.totalTco) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">OPEX % of TCO</span>
                    <span className="font-semibold text-purple-400">
                      {computedSummary.totalTco > 0
                        ? ((computedSummary.totalOpex / computedSummary.totalTco) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400">NPV Discount Rate</span>
                    <span className="font-semibold text-gray-200">8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

