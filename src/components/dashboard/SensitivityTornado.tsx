'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';

// Chart color palette - Obsidian Finance theme
const CHART_COLORS = {
  increase: '#ef4444', // Red for cost increases
  decrease: '#22c55e', // Green for savings/decreases
};

interface SensitivityItem {
  name: string;
  lowValue: number;  // TCO when parameter is at low end
  highValue: number; // TCO when parameter is at high end
  baseValue: number; // TCO at baseline
}

interface SensitivityTornadoProps {
  data: SensitivityItem[];
  baselineTco: number;
  title?: string;
  description?: string;
}

export function SensitivityTornado({
  data,
  baselineTco,
  title = 'Sensitivity Analysis',
  description = 'Impact of parameter variations on TCO'
}: SensitivityTornadoProps) {
  // Transform data for tornado chart
  const tornadoData = React.useMemo(() => {
    return data
      .map(item => ({
        name: item.name,
        low: item.lowValue - baselineTco,
        high: item.highValue - baselineTco,
        range: Math.abs(item.highValue - item.lowValue),
      }))
      .sort((a, b) => b.range - a.range);
  }, [data, baselineTco]);

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>
        {tornadoData.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No sensitivity data available</p>
            <p className="text-sm mt-1 text-slate-500">Run parameter sweeps to generate sensitivity analysis</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(200, tornadoData.length * 50)}>
              <BarChart
                data={tornadoData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCurrency(v)}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  width={110}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'low' ? 'Low Scenario' : 'High Scenario'
                  ]}
                  contentStyle={{
                    backgroundColor: '#181c25',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={2} />
                <Bar dataKey="low" stackId="a" fill={CHART_COLORS.decrease} radius={[4, 0, 0, 4]}>
                  {tornadoData.map((entry, index) => (
                    <Cell key={`low-${index}`} fill={entry.low < 0 ? CHART_COLORS.decrease : CHART_COLORS.increase} />
                  ))}
                </Bar>
                <Bar dataKey="high" stackId="b" fill={CHART_COLORS.increase} radius={[0, 4, 4, 0]}>
                  {tornadoData.map((entry, index) => (
                    <Cell key={`high-${index}`} fill={entry.high > 0 ? CHART_COLORS.increase : CHART_COLORS.decrease} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.decrease }} />
                <span className="text-slate-400">TCO Decrease</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.increase }} />
                <span className="text-slate-400">TCO Increase</span>
              </div>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">
              Baseline TCO: <span className="font-mono text-amber-400">{formatCurrency(baselineTco)}</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
