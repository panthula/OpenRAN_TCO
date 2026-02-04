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
          <div className="text-center py-8 text-gray-400">
            <p>No sensitivity data available</p>
            <p className="text-sm mt-1">Run parameter sweeps to generate sensitivity analysis</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(200, tornadoData.length * 50)}>
              <BarChart
                data={tornadoData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCurrency(v)}
                  stroke="#9ca3af"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  width={110}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'low' ? 'Low Scenario' : 'High Scenario'
                  ]}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <ReferenceLine x={0} stroke="#9ca3af" strokeWidth={2} />
                <Bar dataKey="low" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]}>
                  {tornadoData.map((entry, index) => (
                    <Cell key={`low-${index}`} fill={entry.low < 0 ? '#10b981' : '#D8000D'} />
                  ))}
                </Bar>
                <Bar dataKey="high" stackId="b" fill="#D8000D" radius={[0, 4, 4, 0]}>
                  {tornadoData.map((entry, index) => (
                    <Cell key={`high-${index}`} fill={entry.high > 0 ? '#D8000D' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-gray-400">TCO Decrease</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-gray-400">TCO Increase</span>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              Baseline TCO: {formatCurrency(baselineTco)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
