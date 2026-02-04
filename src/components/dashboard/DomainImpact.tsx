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
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="domain"
              stroke="#9ca3af"
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              stroke="#9ca3af"
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                DayLabels[name as keyof typeof DayLabels] || name
              ]}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
            <Legend
              formatter={(value) => DayLabels[value as keyof typeof DayLabels] || value}
            />
            <Bar dataKey="day0" name="day0" stackId="a" fill="#BF0000" radius={[0, 0, 0, 0]} />
            <Bar dataKey="day1" name="day1" stackId="a" fill="#5F1C6B" radius={[0, 0, 0, 0]} />
            <Bar dataKey="day2" name="day2" stackId="a" fill="#ED5050" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Domain Summary */}
        <div className="mt-6 space-y-3">
          {domainTotals.map(d => (
            <div key={d.domain} className="flex items-center justify-between">
              <span className="text-gray-400">{d.domain}</span>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-200">
                  {formatCurrency(d.total)}
                </span>
                <span className="text-sm text-gray-500 w-16 text-right">
                  {grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <span className="text-gray-300 font-medium">Total</span>
            <span className="font-bold text-gray-100">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
