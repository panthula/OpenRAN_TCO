'use client';

import React from 'react';
import { Database } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { DcTypeLabels, type DcTypeKey } from '@/lib/model/taxonomy';

export function DcTypeEditor() {
  const {
    currentVersion,
    dcTypes,
    saveDcType,
  } = useScenarioStore();

  const handleUpdateDcCount = async (id: string, numDcs: number) => {
    const dc = dcTypes.find(d => d.id === id);
    if (!dc) return;
    await saveDcType({
      id,
      name: dc.name,
      numDcs,
    });
  };

  if (!currentVersion) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select or create a scenario first
      </div>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader
        title="Data Centers"
        description="Configure number of DCs by type (Edge, Regional, Central)"
      />
      <CardContent>
        {dcTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No DC types configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dcTypes.map((dc) => (
              <div
                key={dc.id}
                className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700"
              >
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Database className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-200">
                    {DcTypeLabels[dc.name as DcTypeKey] || dc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {dc.name === 'edge' && 'Distributed locations near cell sites'}
                    {dc.name === 'regional' && 'Regional aggregation points'}
                    {dc.name === 'central' && 'Core network data centers'}
                  </p>
                </div>
                <div className="text-center">
                  <input
                    type="number"
                    value={dc.numDcs}
                    onChange={(e) => handleUpdateDcCount(dc.id, parseInt(e.target.value) || 0)}
                    className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Count</p>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="flex justify-end pt-4 border-t border-gray-700">
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-400">
                  {dcTypes.reduce((sum, d) => sum + d.numDcs, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total DCs</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

