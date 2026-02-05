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
      <header className="sticky top-0 z-40 bg-[#0d0f14]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo and title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
                <Radio className="w-5 h-5 text-white" />
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 blur-lg opacity-40" />
              </div>
              <div>
                <h1 className="text-xl font-serif text-slate-100 tracking-tight">OpenRAN TCO</h1>
                <p className="text-xs text-slate-500">Total Cost of Ownership Modeler</p>
              </div>
            </div>
          </div>

          {/* Scenario selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowScenarioMenu(!showScenarioMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#181c25] border border-white/10 rounded-lg hover:border-amber-500/50 transition-all duration-200"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
                <span className="text-sm text-slate-300">
                  {currentScenario ? currentScenario.name : 'Select Scenario'}
                </span>
                {currentVersion && (
                  <span className="px-2 py-0.5 text-xs bg-[#232933] rounded-full text-amber-400 border border-amber-500/20">
                    v{currentVersion.versionNum}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showScenarioMenu ? 'rotate-180' : ''}`} />
              </button>

              {showScenarioMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-[#12151c] border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-scale-in">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Scenarios</p>
                  </div>

                  {/* Scenario List */}
                  <div className="max-h-64 overflow-y-auto">
                    {scenarios.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-slate-500 text-center">No scenarios yet</p>
                    ) : (
                      displayedScenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className={`group flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors ${
                            currentScenario?.id === scenario.id ? 'bg-amber-500/5 border-l-2 border-amber-500' : 'border-l-2 border-transparent'
                          }`}
                        >
                          <button
                            onClick={() => handleSelectScenario(scenario)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-200 font-medium">{scenario.name}</span>
                              {scenario.isBaseline && (
                                <span className="px-2 py-0.5 text-xs bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/30">
                                  Baseline
                                </span>
                              )}
                            </div>
                            {scenario.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{scenario.description}</p>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteScenario(e, scenario.id)}
                            disabled={deletingId === scenario.id}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
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

                  {/* Footer */}
                  {hasMoreScenarios && (
                    <>
                      <div className="border-t border-white/[0.06]" />
                      <Link
                        href="/scenarios"
                        onClick={() => setShowScenarioMenu(false)}
                        className="flex items-center justify-between px-4 py-3 text-sm text-amber-400 hover:bg-white/5 transition-colors"
                      >
                        <span>Manage All Scenarios</span>
                        <span className="px-2 py-0.5 text-xs bg-[#232933] rounded-full text-slate-400">{scenarios.length}</span>
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
          <p className="text-sm text-slate-400">
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
