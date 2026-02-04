'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Trash2, Server, Building, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Button } from '@/components/ui/Button';
import { Input, NumberInput } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

interface DeploymentYear {
  id?: string;
  archetypeId?: string;
  yearIndex: number;
  sitesDeployed: number;
  cusDeployed: number;
  dcsDeployed: number;
}

interface SiteArchetype {
  id: string;
  scenarioVersionId: string;
  name: string;
  numSites: number;
  numCus: number;
  numDcs: number;
  numDusPerSite: number;
  description: string | null;
  deploymentYears: number;
  deploymentSchedule: DeploymentYear[];
}

export function SiteArchetypeEditor() {
  const {
    currentVersion,
    siteArchetypes,
    inputFacts,
    saveSiteArchetype,
    deleteSiteArchetype,
  } = useScenarioStore();

  const [newArchetype, setNewArchetype] = useState({
    name: '',
    numSites: 0,
    numCus: 0,
    numDcs: 1,
    numDusPerSite: 1,
    description: '',
    deploymentYears: 1,
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<SiteArchetype | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expanded deployment schedule state
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set());

  // Local deployment schedule state for editing
  const [localSchedules, setLocalSchedules] = useState<Record<string, DeploymentYear[]>>({});

  // Initialize local schedules when archetypes change
  useEffect(() => {
    const newLocalSchedules: Record<string, DeploymentYear[]> = {};
    for (const arch of siteArchetypes) {
      if (arch.deploymentSchedule && arch.deploymentSchedule.length > 0) {
        newLocalSchedules[arch.id] = [...arch.deploymentSchedule];
      } else {
        // Default: all in year 0
        newLocalSchedules[arch.id] = [{
          yearIndex: 0,
          sitesDeployed: arch.numSites,
          cusDeployed: arch.numCus,
          dcsDeployed: arch.numDcs,
        }];
      }
    }
    setLocalSchedules(newLocalSchedules);
  }, [siteArchetypes]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId, editingField]);

  const handleAddArchetype = async () => {
    if (!newArchetype.name.trim() || !currentVersion) return;

    // Create deployment schedule based on deploymentYears
    const schedule: DeploymentYear[] = [];
    if (newArchetype.deploymentYears === 1) {
      schedule.push({
        yearIndex: 0,
        sitesDeployed: newArchetype.numSites,
        cusDeployed: newArchetype.numCus,
        dcsDeployed: newArchetype.numDcs,
      });
    } else {
      // Distribute evenly across years
      const sitesPerYear = Math.floor(newArchetype.numSites / newArchetype.deploymentYears);
      const cusPerYear = Math.floor(newArchetype.numCus / newArchetype.deploymentYears);
      const dcsPerYear = Math.floor(newArchetype.numDcs / newArchetype.deploymentYears);

      for (let i = 0; i < newArchetype.deploymentYears; i++) {
        const isLastYear = i === newArchetype.deploymentYears - 1;
        schedule.push({
          yearIndex: i,
          sitesDeployed: isLastYear
            ? newArchetype.numSites - (sitesPerYear * (newArchetype.deploymentYears - 1))
            : sitesPerYear,
          cusDeployed: isLastYear
            ? newArchetype.numCus - (cusPerYear * (newArchetype.deploymentYears - 1))
            : cusPerYear,
          dcsDeployed: isLastYear
            ? newArchetype.numDcs - (dcsPerYear * (newArchetype.deploymentYears - 1))
            : dcsPerYear,
        });
      }
    }

    await saveSiteArchetype({
      name: newArchetype.name,
      numSites: newArchetype.numSites,
      numCus: newArchetype.numCus,
      numDcs: newArchetype.numDcs,
      numDusPerSite: newArchetype.numDusPerSite,
      description: newArchetype.description || null,
      deploymentYears: newArchetype.deploymentYears,
      deploymentSchedule: schedule,
    });
    setNewArchetype({ name: '', numSites: 0, numCus: 0, numDcs: 1, numDusPerSite: 1, description: '', deploymentYears: 1 });
    setShowAddForm(false);
  };

  const handleUpdateArchetype = async (id: string, field: string, value: number | string | null) => {
    const archetype = siteArchetypes.find(a => a.id === id);
    if (!archetype) return;

    const schedule = localSchedules[id] || archetype.deploymentSchedule || [];

    await saveSiteArchetype({
      id,
      name: archetype.name,
      numSites: archetype.numSites,
      numCus: archetype.numCus,
      numDcs: archetype.numDcs,
      numDusPerSite: archetype.numDusPerSite,
      deploymentYears: archetype.deploymentYears,
      deploymentSchedule: schedule,
      [field]: value,
    });
  };

  const handleDeploymentYearsChange = async (archetype: SiteArchetype, newYears: number) => {
    const currentSchedule = localSchedules[archetype.id] || [];
    let newSchedule: DeploymentYear[] = [];

    if (newYears < currentSchedule.length) {
      // Shrinking: keep first N years, add remainder to last year
      newSchedule = currentSchedule.slice(0, newYears);
      const droppedYears = currentSchedule.slice(newYears);
      const lastYear = newSchedule[newYears - 1];
      for (const dropped of droppedYears) {
        lastYear.sitesDeployed += dropped.sitesDeployed;
        lastYear.cusDeployed += dropped.cusDeployed;
        lastYear.dcsDeployed += dropped.dcsDeployed;
      }
    } else if (newYears > currentSchedule.length) {
      // Expanding: add empty years
      newSchedule = [...currentSchedule];
      for (let i = currentSchedule.length; i < newYears; i++) {
        newSchedule.push({
          yearIndex: i,
          sitesDeployed: 0,
          cusDeployed: 0,
          dcsDeployed: 0,
        });
      }
    } else {
      newSchedule = [...currentSchedule];
    }

    // Update local state
    setLocalSchedules(prev => ({
      ...prev,
      [archetype.id]: newSchedule,
    }));

    // Calculate totals
    const totalSites = newSchedule.reduce((sum, y) => sum + y.sitesDeployed, 0);
    const totalCus = newSchedule.reduce((sum, y) => sum + y.cusDeployed, 0);
    const totalDcs = newSchedule.reduce((sum, y) => sum + y.dcsDeployed, 0);

    await saveSiteArchetype({
      id: archetype.id,
      name: archetype.name,
      numSites: totalSites,
      numCus: totalCus,
      numDcs: totalDcs,
      numDusPerSite: archetype.numDusPerSite,
      description: archetype.description,
      deploymentYears: newYears,
      deploymentSchedule: newSchedule,
    });
  };

  const handleScheduleUpdate = async (archetype: SiteArchetype, yearIndex: number, field: 'sitesDeployed' | 'cusDeployed' | 'dcsDeployed', value: number) => {
    const schedule = localSchedules[archetype.id] || [];
    const newSchedule = schedule.map(year =>
      year.yearIndex === yearIndex
        ? { ...year, [field]: value }
        : year
    );

    // Update local state
    setLocalSchedules(prev => ({
      ...prev,
      [archetype.id]: newSchedule,
    }));

    // Calculate totals
    const totalSites = newSchedule.reduce((sum, y) => sum + y.sitesDeployed, 0);
    const totalCus = newSchedule.reduce((sum, y) => sum + y.cusDeployed, 0);
    const totalDcs = newSchedule.reduce((sum, y) => sum + y.dcsDeployed, 0);

    await saveSiteArchetype({
      id: archetype.id,
      name: archetype.name,
      numSites: totalSites,
      numCus: totalCus,
      numDcs: totalDcs,
      numDusPerSite: archetype.numDusPerSite,
      description: archetype.description,
      deploymentYears: archetype.deploymentYears,
      deploymentSchedule: newSchedule,
    });
  };

  const toggleScheduleExpanded = (id: string) => {
    setExpandedSchedules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const startEditing = (archetype: SiteArchetype, field: 'name' | 'description') => {
    setEditingId(archetype.id);
    setEditingField(field);
    setEditValue(field === 'name' ? archetype.name : archetype.description || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  const saveEditing = async () => {
    if (!editingId || !editingField) return;

    const trimmedValue = editValue.trim();
    // Don't allow empty names
    if (editingField === 'name' && !trimmedValue) {
      cancelEditing();
      return;
    }

    await handleUpdateArchetype(
      editingId,
      editingField,
      editingField === 'description' ? (trimmedValue || null) : trimmedValue
    );
    cancelEditing();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteSiteArchetype(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getAffectedInputFactsCount = (archetypeId: string) => {
    return inputFacts.filter(
      f => f.scopeId === archetypeId && f.scopeType === 'site_archetype'
    ).length;
  };

  // Calculate totals across all archetypes
  const totals = useMemo(() => {
    return siteArchetypes.reduce(
      (acc, arch) => ({
        sites: acc.sites + arch.numSites,
        cus: acc.cus + arch.numCus,
        dcs: acc.dcs + arch.numDcs,
        dus: acc.dus + (arch.numSites * (arch.numDusPerSite || 1)),
      }),
      { sites: 0, cus: 0, dcs: 0, dus: 0 }
    );
  }, [siteArchetypes]);

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
        description="Define different site types and their deployment schedules"
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
            <div className="grid grid-cols-5 gap-4 mb-4">
              <NumberInput
                label="Number of Sites"
                value={newArchetype.numSites}
                onChange={(v) => setNewArchetype({ ...newArchetype, numSites: v })}
                min={0}
              />
              <NumberInput
                label="DUs per Site"
                value={newArchetype.numDusPerSite}
                onChange={(v) => setNewArchetype({ ...newArchetype, numDusPerSite: v })}
                min={1}
              />
              <NumberInput
                label="Number of CU/DC"
                value={newArchetype.numCus}
                onChange={(v) => setNewArchetype({ ...newArchetype, numCus: v })}
                min={0}
              />
              <NumberInput
                label="Number of DCs"
                value={newArchetype.numDcs}
                onChange={(v) => setNewArchetype({ ...newArchetype, numDcs: v })}
                min={0}
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Deployment Years
                </label>
                <select
                  value={newArchetype.deploymentYears}
                  onChange={(e) => setNewArchetype({ ...newArchetype, deploymentYears: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Year' : 'Years'}</option>
                  ))}
                </select>
              </div>
            </div>
            {newArchetype.numSites > 0 && newArchetype.numDusPerSite > 1 && (
              <div className="mb-4 text-sm text-cyan-400">
                Total DUs: {(newArchetype.numSites * newArchetype.numDusPerSite).toLocaleString()}
              </div>
            )}
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
            {siteArchetypes.map((archetype) => {
              const isScheduleExpanded = expandedSchedules.has(archetype.id);
              const schedule = localSchedules[archetype.id] || archetype.deploymentSchedule || [];
              const hasMultiYearSchedule = archetype.deploymentYears > 1;

              return (
                <div
                  key={archetype.id}
                  className="p-4 bg-gray-800/30 rounded-lg border border-gray-700"
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Server className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Name - inline editing */}
                      {editingId === archetype.id && editingField === 'name' ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEditing}
                          onKeyDown={handleEditKeyDown}
                          className="w-full bg-gray-800 border border-cyan-500 rounded px-2 py-1 text-sm font-medium text-gray-100 focus:outline-none"
                        />
                      ) : (
                        <p
                          className="font-medium text-gray-200 cursor-pointer hover:text-cyan-400 transition-colors truncate"
                          onClick={() => startEditing(archetype, 'name')}
                          title="Click to edit name"
                        >
                          {archetype.name}
                        </p>
                      )}

                      {/* Description - inline editing */}
                      {editingId === archetype.id && editingField === 'description' ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEditing}
                          onKeyDown={handleEditKeyDown}
                          placeholder="Add description..."
                          className="w-full mt-1 bg-gray-800 border border-cyan-500 rounded px-2 py-0.5 text-xs text-gray-400 focus:outline-none"
                        />
                      ) : (
                        <p
                          className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors truncate"
                          onClick={() => startEditing(archetype, 'description')}
                          title="Click to edit description"
                        >
                          {archetype.description || 'Add description...'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Deployment Years Selector */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <select
                          value={archetype.deploymentYears}
                          onChange={(e) => handleDeploymentYearsChange(archetype, parseInt(e.target.value))}
                          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>{n}Y</option>
                          ))}
                        </select>
                      </div>

                      {/* Total counts (read-only derived values) */}
                      <div className="text-center">
                        <p className="text-lg font-semibold text-cyan-400">
                          {archetype.numSites.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Sites</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-orange-400">
                          {(archetype.numDusPerSite || 1)}
                        </p>
                        <p className="text-xs text-gray-500">DUs/Site</p>
                      </div>
                      {(archetype.numDusPerSite || 1) > 1 && (
                        <div className="text-center">
                          <p className="text-lg font-semibold text-amber-400">
                            {(archetype.numSites * (archetype.numDusPerSite || 1)).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">Total DUs</p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-lg font-semibold text-purple-400">
                          {archetype.numCus.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">CUs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-400">
                          {archetype.numDcs.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">DCs</p>
                      </div>

                      {/* Expand/collapse schedule button */}
                      {hasMultiYearSchedule && (
                        <button
                          onClick={() => toggleScheduleExpanded(archetype.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          title={isScheduleExpanded ? "Hide deployment schedule" : "Show deployment schedule"}
                        >
                          {isScheduleExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteTarget(archetype)}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete archetype"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Deployment Schedule Grid (expanded) */}
                  {hasMultiYearSchedule && isScheduleExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Deployment Schedule
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-400">
                              <th className="text-left px-2 py-1">Year</th>
                              <th className="text-center px-2 py-1">Sites</th>
                              <th className="text-center px-2 py-1">CUs</th>
                              <th className="text-center px-2 py-1">DCs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedule.map((year) => (
                              <tr key={year.yearIndex} className="border-t border-gray-700/50">
                                <td className="px-2 py-2 text-gray-300 font-medium">
                                  Y{year.yearIndex + 1}
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    value={year.sitesDeployed}
                                    onChange={(e) => handleScheduleUpdate(archetype, year.yearIndex, 'sitesDeployed', parseInt(e.target.value) || 0)}
                                    className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                                    min="0"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    value={year.cusDeployed}
                                    onChange={(e) => handleScheduleUpdate(archetype, year.yearIndex, 'cusDeployed', parseInt(e.target.value) || 0)}
                                    className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                                    min="0"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    value={year.dcsDeployed}
                                    onChange={(e) => handleScheduleUpdate(archetype, year.yearIndex, 'dcsDeployed', parseInt(e.target.value) || 0)}
                                    className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                                    min="0"
                                  />
                                </td>
                              </tr>
                            ))}
                            {/* Total row */}
                            <tr className="border-t-2 border-gray-600 bg-gray-800/30">
                              <td className="px-2 py-2 text-gray-200 font-bold">Total</td>
                              <td className="px-2 py-2 text-center text-cyan-400 font-bold">
                                {archetype.numSites.toLocaleString()}
                              </td>
                              <td className="px-2 py-2 text-center text-purple-400 font-bold">
                                {archetype.numCus.toLocaleString()}
                              </td>
                              <td className="px-2 py-2 text-center text-green-400 font-bold">
                                {archetype.numDcs.toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Single year: show editable inputs inline */}
                  {!hasMultiYearSchedule && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center gap-4">
                      <span className="text-xs text-gray-500">All deployed in Year 1:</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={schedule[0]?.sitesDeployed ?? archetype.numSites}
                            onChange={(e) => handleScheduleUpdate(archetype, 0, 'sitesDeployed', parseInt(e.target.value) || 0)}
                            className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                            min="0"
                          />
                          <span className="text-xs text-gray-500">sites</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">×</span>
                          <input
                            type="number"
                            value={archetype.numDusPerSite || 1}
                            onChange={(e) => handleUpdateArchetype(archetype.id, 'numDusPerSite', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
                            min="1"
                          />
                          <span className="text-xs text-gray-500">DUs/site</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={schedule[0]?.cusDeployed ?? archetype.numCus}
                            onChange={(e) => handleScheduleUpdate(archetype, 0, 'cusDeployed', parseInt(e.target.value) || 0)}
                            className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                            min="0"
                          />
                          <span className="text-xs text-gray-500">CUs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={schedule[0]?.dcsDeployed ?? archetype.numDcs}
                            onChange={(e) => handleScheduleUpdate(archetype, 0, 'dcsDeployed', parseInt(e.target.value) || 0)}
                            className="w-20 text-center bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                            min="0"
                          />
                          <span className="text-xs text-gray-500">DCs</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            <div className="flex justify-end gap-6 pt-4 border-t border-gray-700">
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-400">
                  {totals.sites.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total Sites</p>
              </div>
              {totals.dus > totals.sites && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-400">
                    {totals.dus.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Total DUs</p>
                </div>
              )}
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-400">
                  {totals.cus.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total CU/DC</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">
                  {totals.dcs.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total DCs</p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Delete Site Archetype?"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-100">
                &quot;{deleteTarget?.name}&quot;
              </span>
              ?
            </p>

            {deleteTarget && getAffectedInputFactsCount(deleteTarget.id) > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  Warning: This will also delete{' '}
                  <span className="font-semibold">
                    {getAffectedInputFactsCount(deleteTarget.id)}
                  </span>{' '}
                  associated cost input{getAffectedInputFactsCount(deleteTarget.id) !== 1 ? 's' : ''}.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Delete Archetype
              </Button>
            </div>
          </div>
        </Modal>
      </CardContent>
    </Card>
  );
}
