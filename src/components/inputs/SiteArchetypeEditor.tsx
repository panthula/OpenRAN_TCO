'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Server, Building } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Button } from '@/components/ui/Button';
import { Input, NumberInput } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export function SiteArchetypeEditor() {
  const {
    currentVersion,
    siteArchetypes,
    saveSiteArchetype,
  } = useScenarioStore();

  const [newArchetype, setNewArchetype] = useState({
    name: '',
    numSites: 0,
    numCus: 0,
    description: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddArchetype = async () => {
    if (!newArchetype.name.trim() || !currentVersion) return;
    await saveSiteArchetype({
      name: newArchetype.name,
      numSites: newArchetype.numSites,
      numCus: newArchetype.numCus,
      description: newArchetype.description || null,
    });
    setNewArchetype({ name: '', numSites: 0, numCus: 0, description: '' });
    setShowAddForm(false);
  };

  const handleUpdateArchetype = async (id: string, field: string, value: number | string) => {
    const archetype = siteArchetypes.find(a => a.id === id);
    if (!archetype) return;
    await saveSiteArchetype({
      id,
      name: archetype.name,
      numSites: archetype.numSites,
      numCus: archetype.numCus,
      [field]: value,
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
        title="Site Archetypes"
        description="Define different site types and their quantities"
        action={
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4" />
            Add Archetype
          </Button>
        }
      />
      <CardContent>
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label="Archetype Name"
                placeholder="e.g., Urban Macro"
                value={newArchetype.name}
                onChange={(e) => setNewArchetype({ ...newArchetype, name: e.target.value })}
              />
              <Input
                label="Description"
                placeholder="Brief description"
                value={newArchetype.description}
                onChange={(e) => setNewArchetype({ ...newArchetype, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <NumberInput
                label="Number of Sites"
                value={newArchetype.numSites}
                onChange={(v) => setNewArchetype({ ...newArchetype, numSites: v })}
                min={0}
              />
              <NumberInput
                label="Number of CUs"
                value={newArchetype.numCus}
                onChange={(v) => setNewArchetype({ ...newArchetype, numCus: v })}
                min={0}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddArchetype} disabled={!newArchetype.name.trim()}>
                Add Archetype
              </Button>
            </div>
          </div>
        )}

        {siteArchetypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No site archetypes defined</p>
            <p className="text-sm mt-1">Add archetypes to define your network topology</p>
          </div>
        ) : (
          <div className="space-y-3">
            {siteArchetypes.map((archetype) => (
              <div
                key={archetype.id}
                className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Server className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-200">{archetype.name}</p>
                  {archetype.description && (
                    <p className="text-xs text-gray-500">{archetype.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <input
                      type="number"
                      value={archetype.numSites}
                      onChange={(e) => handleUpdateArchetype(archetype.id, 'numSites', parseInt(e.target.value) || 0)}
                      className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Sites</p>
                  </div>
                  <div className="text-center">
                    <input
                      type="number"
                      value={archetype.numCus}
                      onChange={(e) => handleUpdateArchetype(archetype.id, 'numCus', parseInt(e.target.value) || 0)}
                      className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">CUs</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="flex justify-end gap-6 pt-4 border-t border-gray-700">
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-400">
                  {siteArchetypes.reduce((sum, a) => sum + a.numSites, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total Sites</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-400">
                  {siteArchetypes.reduce((sum, a) => sum + a.numCus, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total CUs</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

