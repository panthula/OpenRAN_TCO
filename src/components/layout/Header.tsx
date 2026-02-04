'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Radio, Plus, Copy, ChevronDown, Loader2, Trash2 } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export function Header() {
  const {
    scenarios,
    currentScenario,
    currentVersion,
    isLoading,
    setCurrentScenario,
    fetchVersionData,
    createScenario,
    cloneScenario,
    deleteScenario,
  } = useScenarioStore();

  const [showNewModal, setShowNewModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayedScenarios = scenarios.slice(0, 4);
  const hasMoreScenarios = scenarios.length > 4;

  const handleCreateScenario = async () => {
    if (!newName.trim()) return;
    await createScenario(newName, newDescription);
    setShowNewModal(false);
    setNewName('');
    setNewDescription('');
  };

  const handleCloneScenario = async () => {
    if (!currentScenario || !newName.trim()) return;
    await cloneScenario(currentScenario.id, newName);
    setShowCloneModal(false);
    setNewName('');
  };

  const handleSelectScenario = async (scenario: typeof scenarios[0]) => {
    setCurrentScenario(scenario);
    const firstVersion = scenario.versions[0];
    if (firstVersion) {
      await fetchVersionData(firstVersion.id);
    }
    setShowScenarioMenu(false);
  };

  const handleDeleteScenario = async (e: React.MouseEvent, scenarioId: string) => {
    e.stopPropagation();
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
    <>
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo and title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-700 to-purple-900">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100">OpenRAN TCO</h1>
                <p className="text-xs text-gray-500">Total Cost of Ownership Modeler</p>
              </div>
            </div>
          </div>

          {/* Scenario selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowScenarioMenu(!showScenarioMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-red-700 transition-colors"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-red-600" />}
                <span className="text-sm text-gray-300">
                  {currentScenario ? currentScenario.name : 'Select Scenario'}
                </span>
                {currentVersion && (
                  <span className="px-2 py-0.5 text-xs bg-gray-700 rounded text-red-500">
                    v{currentVersion.versionNum}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showScenarioMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
                  <div className="p-2 border-b border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wider px-2">Scenarios</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {scenarios.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500">No scenarios yet</p>
                    ) : (
                      displayedScenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className={`group flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors ${
                            currentScenario?.id === scenario.id ? 'bg-gray-800' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleSelectScenario(scenario)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-200">{scenario.name}</span>
                              {scenario.isBaseline && (
                                <span className="px-2 py-0.5 text-xs bg-red-700/20 text-red-500 rounded">
                                  Baseline
                                </span>
                              )}
                            </div>
                            {scenario.description && (
                              <p className="text-xs text-gray-500 mt-1">{scenario.description}</p>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteScenario(e, scenario.id)}
                            disabled={deletingId === scenario.id}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                            title="Delete scenario"
                          >
                            {deletingId === scenario.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {hasMoreScenarios && (
                    <>
                      <div className="border-t border-gray-700" />
                      <Link
                        href="/scenarios"
                        onClick={() => setShowScenarioMenu(false)}
                        className="flex items-center justify-between px-4 py-3 text-sm text-red-500 hover:bg-gray-800 transition-colors"
                      >
                        <span>Manage All Scenarios</span>
                        <span className="px-2 py-0.5 text-xs bg-gray-700 rounded">{scenarios.length}</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCloneModal(true)}
              disabled={!currentScenario}
            >
              <Copy className="w-4 h-4" />
              Clone
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewModal(true)}
            >
              <Plus className="w-4 h-4" />
              New Scenario
            </Button>
          </div>
        </div>
      </header>

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

      {/* Clone Scenario Modal */}
      <Modal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        title="Clone Scenario"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Create a copy of &ldquo;{currentScenario?.name}&rdquo; for what-if analysis.
          </p>
          <Input
            label="New Scenario Name"
            placeholder={`${currentScenario?.name} (What-if)`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowCloneModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloneScenario} disabled={!newName.trim()}>
              Clone Scenario
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

