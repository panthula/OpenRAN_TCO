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
import { DayLabels, DomainLabels, Day, Domain } from '@/lib/model/taxonomy';

// Chart color palette - Obsidian Finance theme
const CHART_COLORS = {
  increase: '#ef4444', // Red for cost increases
  decrease: '#22c55e', // Green for savings/decreases
};

interface ComparisonTornadoProps {
  baselineByDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  comparisonByDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  title?: string;
  description?: string;
}

interface TornadoItem {
  name: string;
  key: string;
  delta: number;
  percentChange: number;
  baseValue: number;
  compValue: number;
  fill: string;
}

function getDayDomainLabel(key: string): string {
  const [day, domain] = key.split(':') as [Day, Domain];
  const dayLabel = DayLabels[day]?.split(' - ')[0] || day;
  const domainLabel = DomainLabels[domain] || domain;
  return `${domainLabel} ${dayLabel}`;
}

export function ComparisonTornado({
  baselineByDayDomain,
  comparisonByDayDomain,
  title = 'Impact by Category',
  description = 'Cost changes ranked by magnitude',
}: ComparisonTornadoProps) {
  const tornadoData = React.useMemo(() => {
    const allKeys = new Set([
      ...Object.keys(baselineByDayDomain),
      ...Object.keys(comparisonByDayDomain),
    ]);

    const items: TornadoItem[] = [];

    for (const key of allKeys) {
      const baseValue = baselineByDayDomain[key]?.tco || 0;
      const compValue = comparisonByDayDomain[key]?.tco || 0;
      const delta = compValue - baseValue;

      if (Math.abs(delta) > 0.01) { // Only include meaningful changes
        const percentChange = baseValue > 0 ? (delta / baseValue) * 100 : 0;
        items.push({
          name: getDayDomainLabel(key),
          key,
          delta,
          percentChange,
          baseValue,
          compValue,
          fill: delta < 0 ? CHART_COLORS.decrease : CHART_COLORS.increase,
        });
      }
    }

    // Sort by absolute magnitude (largest first)
    items.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return items;
  }, [baselineByDayDomain, comparisonByDayDomain]);

  if (tornadoData.length === 0) {
    return (
      <Card>
        <CardHeader title={title} description={description} />
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <p>No cost differences to display</p>
            <p className="text-sm mt-1 text-slate-500">The scenarios have identical costs across all categories</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate max absolute value for symmetric axis
  const maxAbsDelta = Math.max(...tornadoData.map(d => Math.abs(d.delta)));
  const axisDomain = [-maxAbsDelta * 1.1, maxAbsDelta * 1.1];

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(250, tornadoData.length * 45)}>
          <BarChart
            data={tornadoData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 140, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v)}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              domain={axisDomain}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              width={130}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload as TornadoItem;
                return (
                  <div className="bg-[#181c25] border border-white/10 rounded-lg p-3 shadow-xl">
                    <p className="font-medium text-slate-100 mb-2">{data.name}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-400">
                        Baseline: <span className="font-mono text-slate-200">{formatCurrency(data.baseValue)}</span>
                      </p>
                      <p className="text-slate-400">
                        Comparison: <span className="font-mono text-slate-200">{formatCurrency(data.compValue)}</span>
                      </p>
                      <p className={`font-mono ${data.delta < 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Delta: {data.delta >= 0 ? '+' : ''}{formatCurrency(data.delta)}
                        {' '}({data.percentChange >= 0 ? '+' : ''}{data.percentChange.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={2} />
            <Bar dataKey="delta" radius={[0, 4, 4, 0]}>
              {tornadoData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.decrease }} />
            <span className="text-slate-400">Savings (Cost Decrease)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.increase }} />
            <span className="text-slate-400">Cost Increase</span>
          </div>
        </div>

        {/* Summary table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-left border-b border-white/10">
                <th className="pb-3 pr-4 font-medium">Category</th>
                <th className="pb-3 pr-4 text-right font-medium">Baseline</th>
                <th className="pb-3 pr-4 text-right font-medium">Comparison</th>
                <th className="pb-3 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {tornadoData.slice(0, 10).map((item) => (
                <tr key={item.key} className="border-b border-white/[0.04]">
                  <td className="py-3 pr-4">{item.name}</td>
                  <td className="py-3 pr-4 text-right font-mono text-slate-400">
                    {formatCurrency(item.baseValue)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-slate-400">
                    {formatCurrency(item.compValue)}
                  </td>
                  <td className={`py-3 text-right font-mono ${item.delta < 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.delta >= 0 ? '+' : ''}{formatCurrency(item.delta)}
                    <span className="text-xs text-slate-500 ml-1">
                      ({item.percentChange >= 0 ? '+' : ''}{item.percentChange.toFixed(1)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tornadoData.length > 10 && (
            <p className="text-center text-xs text-slate-500 mt-3">
              Showing top 10 of {tornadoData.length} categories
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
