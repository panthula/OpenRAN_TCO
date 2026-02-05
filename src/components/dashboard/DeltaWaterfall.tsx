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
  total: '#f59e0b',    // Amber for totals
  increase: '#ef4444', // Red for cost increases
  decrease: '#22c55e', // Green for savings/decreases
};

interface DeltaWaterfallProps {
  baselineName: string;
  comparisonName: string;
  baselineTco: number;
  comparisonTco: number;
  baselineByDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  comparisonByDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  title?: string;
  description?: string;
}

interface WaterfallSegment {
  name: string;
  delta: number;
  start: number;
  end: number;
  fill: string;
  percentChange: number;
  isTotal?: boolean;
}

function getDayDomainLabel(key: string): string {
  const [day, domain] = key.split(':') as [Day, Domain];
  const dayLabel = DayLabels[day]?.split(' - ')[0] || day;
  const domainLabel = DomainLabels[domain] || domain;
  return `${domainLabel} ${dayLabel}`;
}

export function DeltaWaterfall({
  baselineName,
  comparisonName,
  baselineTco,
  comparisonTco,
  baselineByDayDomain,
  comparisonByDayDomain,
  title = 'Delta Waterfall',
  description = 'Bridge from baseline to comparison scenario',
}: DeltaWaterfallProps) {
  const waterfallData = React.useMemo(() => {
    const segments: WaterfallSegment[] = [];

    // Starting bar: Baseline TCO
    segments.push({
      name: baselineName,
      delta: baselineTco,
      start: 0,
      end: baselineTco,
      fill: CHART_COLORS.total,
      percentChange: 0,
      isTotal: true,
    });

    // Calculate deltas for each day×domain
    const allKeys = new Set([
      ...Object.keys(baselineByDayDomain),
      ...Object.keys(comparisonByDayDomain),
    ]);

    const deltas: { key: string; delta: number; baseValue: number }[] = [];

    for (const key of allKeys) {
      const baseValue = baselineByDayDomain[key]?.tco || 0;
      const compValue = comparisonByDayDomain[key]?.tco || 0;
      const delta = compValue - baseValue;

      if (Math.abs(delta) > 0.01) { // Only include meaningful changes
        deltas.push({ key, delta, baseValue });
      }
    }

    // Sort by absolute impact (largest first)
    deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    // Build waterfall segments
    let runningTotal = baselineTco;

    for (const { key, delta, baseValue } of deltas) {
      const percentChange = baseValue > 0 ? (delta / baseValue) * 100 : 0;
      const newTotal = runningTotal + delta;

      segments.push({
        name: getDayDomainLabel(key),
        delta,
        start: Math.min(runningTotal, newTotal),
        end: Math.max(runningTotal, newTotal),
        fill: delta < 0 ? CHART_COLORS.decrease : CHART_COLORS.increase,
        percentChange,
      });

      runningTotal = newTotal;
    }

    // Ending bar: Comparison TCO
    segments.push({
      name: comparisonName,
      delta: comparisonTco,
      start: 0,
      end: comparisonTco,
      fill: CHART_COLORS.total,
      percentChange: baselineTco > 0 ? ((comparisonTco - baselineTco) / baselineTco) * 100 : 0,
      isTotal: true,
    });

    return segments;
  }, [baselineName, comparisonName, baselineTco, comparisonTco, baselineByDayDomain, comparisonByDayDomain]);

  const totalDelta = comparisonTco - baselineTco;
  const totalPercentChange = baselineTco > 0 ? (totalDelta / baselineTco) * 100 : 0;

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>
        {/* Summary */}
        <div className="flex justify-center gap-8 mb-6 text-sm">
          <div className="text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Baseline</p>
            <p className="text-xl font-mono font-bold text-amber-400">{formatCurrency(baselineTco)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Delta</p>
            <p className={`text-xl font-mono font-bold ${totalDelta < 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalDelta >= 0 ? '+' : ''}{formatCurrency(totalDelta)}
              <span className="text-sm ml-1 opacity-75">({totalPercentChange >= 0 ? '+' : ''}{totalPercentChange.toFixed(1)}%)</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Result</p>
            <p className="text-xl font-mono font-bold text-amber-400">{formatCurrency(comparisonTco)}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
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
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload as WaterfallSegment;
                return (
                  <div className="bg-[#181c25] border border-white/10 rounded-lg p-3 shadow-xl">
                    <p className="font-medium text-slate-100 mb-2">{data.name}</p>
                    {data.isTotal ? (
                      <p className="text-amber-400 font-mono">
                        Total: {formatCurrency(data.delta)}
                      </p>
                    ) : (
                      <>
                        <p className={`font-mono ${data.delta < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {data.delta >= 0 ? '+' : ''}{formatCurrency(data.delta)}
                        </p>
                        {data.percentChange !== 0 && (
                          <p className="text-slate-500 text-sm mt-1">
                            {data.percentChange >= 0 ? '+' : ''}{data.percentChange.toFixed(1)}% change
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine y={0} stroke="#64748b" />
            {/* Background bar (invisible, used for stacking) */}
            <Bar dataKey="start" stackId="a" fill="transparent" />
            {/* Visible bar showing the delta */}
            <Bar dataKey={(d: WaterfallSegment) => d.end - d.start} stackId="a" radius={[4, 4, 0, 0]}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.total }} />
            <span className="text-slate-400">Total TCO</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.decrease }} />
            <span className="text-slate-400">Savings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.increase }} />
            <span className="text-slate-400">Cost Increase</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
