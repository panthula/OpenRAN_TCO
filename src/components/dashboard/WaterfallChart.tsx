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
  total: '#f59e0b',    // Amber for totals
  increase: '#ef4444', // Red for cost increases
  decrease: '#22c55e', // Green for savings/decreases
};

interface WaterfallData {
  name: string;
  value: number;
  isTotal?: boolean;
}

interface WaterfallChartProps {
  data: WaterfallData[];
  title?: string;
  description?: string;
}

export function WaterfallChart({ data, title = 'Cost Waterfall', description = 'Breakdown of cost components' }: WaterfallChartProps) {
  // Transform data for waterfall visualization
  const waterfallData = React.useMemo(() => {
    const result: Array<{
      name: string;
      value: number;
      start: number;
      end: number;
      fill: string;
      displayValue: number;
    }> = [];

    let cumulative = 0;
    for (const item of data) {
      const start = cumulative;
      const newCumulative = item.isTotal ? cumulative : cumulative + item.value;

      const fill = item.isTotal
        ? CHART_COLORS.total
        : item.value >= 0
          ? CHART_COLORS.increase
          : CHART_COLORS.decrease;

      result.push({
        name: item.name,
        value: item.isTotal ? item.value : Math.abs(item.value),
        start: item.isTotal ? 0 : Math.min(start, newCumulative),
        end: item.isTotal ? item.value : Math.max(start, newCumulative),
        fill,
        displayValue: item.value,
      });
      cumulative = newCumulative;
    }
    return result;
  }, [data]);

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={0}
              angle={-45}
              textAnchor="end"
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip
              formatter={(_value, _name, props) => {
                const item = props.payload;
                return [formatCurrency(item.displayValue), 'Value'];
              }}
              labelFormatter={(label) => label}
              contentStyle={{
                backgroundColor: '#181c25',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
              labelStyle={{ color: '#f1f5f9' }}
              itemStyle={{ color: '#94a3b8' }}
            />
            <ReferenceLine y={0} stroke="#64748b" />
            <Bar dataKey="end" radius={[4, 4, 0, 0]}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.total }} />
            <span className="text-slate-400">Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.increase }} />
            <span className="text-slate-400">Increase</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.decrease }} />
            <span className="text-slate-400">Decrease</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
