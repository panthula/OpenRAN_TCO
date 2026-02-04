'use client';

import React, { useState } from 'react';
import { FolderOpen, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export default function ScenariosPage() {
  const {
    scenarios,
    currentScenario,
    setCurrentScenario,
    fetchVersionData,
    createScenario,
    deleteScenario,
  } = useScenarioStore();

  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const handleCreateScenario = async () => {
    if (!newName.trim()) return;
    await createScenario(newName, newDescription);
    setShowNewModal(false);
    setNewName('');
    setNewDescription('');
  };

  const handleSelectScenario = async (scenario: typeof scenarios[0]) => {
    if (currentScenario?.id === scenario.id) return;
    setSelectingId(scenario.id);
    try {
      setCurrentScenario(scenario);
      const firstVersion = scenario.versions[0];
      if (firstVersion) {
        await fetchVersionData(firstVersion.id);
      }
    } finally {
      setSelectingId(null);
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      setDeletingId(scenarioId);
      try {
        await deleteScenario(scenarioId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Manage Scenarios</h1>
            <p className="text-gray-400">
              {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4" />
          New Scenario
        </Button>
      </div>

      {/* Scenarios Grid */}
      {scenarios.length === 0 ? (
        <Card className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No scenarios yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first scenario to start modeling TCO
          </p>
          <Button variant="primary" onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4" />
            Create Scenario
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario) => {
            const isSelected = currentScenario?.id === scenario.id;
            const versionCount = scenario.versions?.length || 0;
            const latestVersion = scenario.versions?.[0];

            return (
              <Card
                key={scenario.id}
                variant={isSelected ? 'elevated' : 'default'}
                className={`relative transition-all ${
                  isSelected ? 'ring-2 ring-cyan-500' : 'hover:border-gray-600'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-100 truncate">
                        {scenario.name}
                      </h3>
                      {scenario.isBaseline && (
                        <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded shrink-0">
                          Baseline
                        </span>
                      )}
                    </div>
                    {scenario.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {scenario.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="p-1 bg-cyan-500 rounded-full shrink-0 ml-2">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>{versionCount} version{versionCount !== 1 ? 's' : ''}</span>
                  {latestVersion && (
                    <span>Latest: v{latestVersion.versionNum}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={isSelected ? 'ghost' : 'secondary'}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSelectScenario(scenario)}
                    disabled={isSelected || selectingId === scenario.id}
                  >
                    {selectingId === scenario.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : isSelected ? (
                      'Selected'
                    ) : (
                      'Select'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteScenario(scenario.id)}
                    disabled={deletingId === scenario.id}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    {deletingId === scenario.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Scenario Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create New Scenario"
      >
        <div className="space-y-4">
          <Input
            label="Scenario Name"
            placeholder="e.g., Baseline 2024"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="Brief description of this scenario"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateScenario} disabled={!newName.trim()}>
              Create Scenario
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
