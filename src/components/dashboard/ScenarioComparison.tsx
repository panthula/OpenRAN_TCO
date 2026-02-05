'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

// Chart color palette - Obsidian Finance theme
const CHART_COLORS = {
  capex: '#f59e0b', // Amber for CAPEX
  opex: '#8b5cf6',  // Violet for OPEX
};

interface ScenarioData {
  name: string;
  capex: number;
  opex: number;
  tco: number;
  npv: number;
  isBaseline?: boolean;
}

interface ScenarioComparisonProps {
  scenarios: ScenarioData[];
  title?: string;
  description?: string;
}

export function ScenarioComparison({
  scenarios,
  title = 'Scenario Comparison',
  description = 'Compare TCO across different scenarios'
}: ScenarioComparisonProps) {
  const baseline = scenarios.find(s => s.isBaseline) || scenarios[0];

  // Calculate differences from baseline
  const comparisonData = React.useMemo(() => {
    if (!baseline) return [];
    return scenarios.map(s => ({
      ...s,
      tcoDiff: s.tco - baseline.tco,
      tcoDiffPercent: baseline.tco > 0 ? ((s.tco - baseline.tco) / baseline.tco) * 100 : 0,
    }));
  }, [scenarios, baseline]);

  const DiffIndicator = ({ value, percent }: { value: number; percent: number }) => {
    if (Math.abs(value) < 1) {
      return (
        <div className="flex items-center gap-1 text-slate-500">
          <Minus className="w-4 h-4" />
          <span className="text-sm">No change</span>
        </div>
      );
    }
    const isPositive = value > 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-red-400' : 'text-green-400'}`}>
        {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        <span className="text-sm font-mono font-medium">
          {formatCurrency(Math.abs(value))} ({Math.abs(percent).toFixed(1)}%)
        </span>
      </div>
    );
  };

  if (scenarios.length === 0) {
    return (
      <Card>
        <CardHeader title={title} description={description} />
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <p>No scenarios to compare</p>
            <p className="text-sm mt-1 text-slate-500">Create multiple scenarios to enable comparison</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scenarios} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
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

        {/* Comparison Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-left border-b border-white/10">
                <th className="pb-3 pr-4 font-medium">Scenario</th>
                <th className="pb-3 pr-4 text-right font-medium">TCO</th>
                <th className="pb-3 pr-4 text-right font-medium">NPV</th>
                <th className="pb-3 text-right font-medium">vs Baseline</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {comparisonData.map((s, idx) => (
                <tr key={idx} className="border-b border-white/[0.04]">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {s.name}
                      {s.isBaseline && (
                        <span className="px-2 py-0.5 text-xs bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/30">
                          Baseline
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-slate-200">
                    {formatCurrency(s.tco)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-slate-400">
                    {formatCurrency(s.npv)}
                  </td>
                  <td className="py-3 text-right">
                    {s.isBaseline ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <DiffIndicator value={s.tcoDiff} percent={s.tcoDiffPercent} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
