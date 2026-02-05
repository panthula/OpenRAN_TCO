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
import { DomainLabels, DayLabels } from '@/lib/model/taxonomy';

// Chart color palette - Obsidian Finance theme
const CHART_COLORS = {
  day0: '#f59e0b', // Amber - Day 0
  day1: '#8b5cf6', // Violet - Day 1
  day2: '#06b6d4', // Cyan - Day 2
};

interface DomainImpactData {
  domain: string;
  day0: number;
  day1: number;
  day2: number;
}

interface DomainImpactProps {
  byDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  title?: string;
  description?: string;
}

export function DomainImpact({
  byDayDomain,
  title = 'Cost by Domain',
  description = 'TCO breakdown by domain and lifecycle phase'
}: DomainImpactProps) {
  // Transform byDayDomain data into chart format
  const chartData = React.useMemo(() => {
    const domains = ['ran', 'cloud', 'oss'];
    const days = ['day0', 'day1', 'day2'];

    return domains.map(domain => {
      const result: DomainImpactData = {
        domain: DomainLabels[domain as keyof typeof DomainLabels] || domain,
        day0: 0,
        day1: 0,
        day2: 0,
      };

      for (const day of days) {
        const key = `${day}:${domain}`;
        const data = byDayDomain[key];
        if (data) {
          result[day as 'day0' | 'day1' | 'day2'] = data.tco;
        }
      }

      return result;
    });
  }, [byDayDomain]);

  // Calculate totals per domain for the summary
  const domainTotals = React.useMemo(() => {
    return chartData.map(d => ({
      domain: d.domain,
      total: d.day0 + d.day1 + d.day2,
    }));
  }, [chartData]);

  const grandTotal = domainTotals.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="domain"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                DayLabels[name as keyof typeof DayLabels] || name
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
            <Legend
              formatter={(value) => DayLabels[value as keyof typeof DayLabels] || value}
              wrapperStyle={{ color: '#94a3b8' }}
            />
            <Bar dataKey="day0" name="day0" stackId="a" fill={CHART_COLORS.day0} radius={[0, 0, 0, 0]} />
            <Bar dataKey="day1" name="day1" stackId="a" fill={CHART_COLORS.day1} radius={[0, 0, 0, 0]} />
            <Bar dataKey="day2" name="day2" stackId="a" fill={CHART_COLORS.day2} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Domain Summary */}
        <div className="mt-6 space-y-3">
          {domainTotals.map(d => (
            <div key={d.domain} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
              <span className="text-slate-400">{d.domain}</span>
              <div className="flex items-center gap-4">
                <span className="font-mono font-semibold text-slate-200">
                  {formatCurrency(d.total)}
                </span>
                <span className="text-sm text-slate-500 w-16 text-right">
                  {grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-slate-300 font-medium">Total</span>
            <span className="font-mono font-bold text-amber-400">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
