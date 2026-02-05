/**
 * Adjustment sets state slice
 */

import type { StateCreator } from 'zustand';
import type { AdjustmentSet, ScenarioVersion } from '@/lib/types';

export interface AdjustmentSlice {
  adjustmentSets: AdjustmentSet[];
  fetchAdjustmentSets: () => Promise<void>;
  saveAdjustmentSet: (set: Partial<AdjustmentSet>) => Promise<AdjustmentSet>;
  deleteAdjustmentSet: (id: string) => Promise<void>;
  toggleAdjustmentSet: (id: string, isActive: boolean) => Promise<void>;
}

export interface AdjustmentSliceDeps {
  getCurrentVersion: () => ScenarioVersion | null;
  setError: (error: string | null) => void;
}

export const createAdjustmentSlice = (
  deps: () => AdjustmentSliceDeps
): StateCreator<AdjustmentSlice, [], [], AdjustmentSlice> => (set, get) => ({
  adjustmentSets: [],

  fetchAdjustmentSets: async () => {
    const { getCurrentVersion, setError } = deps();
    const currentVersion = getCurrentVersion();
    if (!currentVersion) return;

    try {
      const res = await fetch(`/api/adjustments?versionId=${currentVersion.id}`);
      if (!res.ok) throw new Error('Failed to fetch adjustment sets');
      const data = await res.json();
      set({ adjustmentSets: data });
    } catch (err) {
      setError((err as Error).message);
    }
  },

  saveAdjustmentSet: async (adjustmentSet: Partial<AdjustmentSet>) => {
    const { getCurrentVersion, setError } = deps();
    const currentVersion = getCurrentVersion();
    if (!currentVersion) {
      throw new Error('No scenario version selected');
    }

    try {
      const res = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...adjustmentSet, scenarioVersionId: currentVersion.id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save adjustment set');
      }
      const savedSet = await res.json();

      const { adjustmentSets } = get();
      const existingIndex = adjustmentSets.findIndex(s => s.id === savedSet.id);
      if (existingIndex >= 0) {
        const updated = [...adjustmentSets];
        updated[existingIndex] = savedSet;
        set({ adjustmentSets: updated });
      } else {
        set({ adjustmentSets: [...adjustmentSets, savedSet] });
      }

      return savedSet;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  },

  deleteAdjustmentSet: async (id: string) => {
    const { setError } = deps();

    try {
      const res = await fetch(`/api/adjustments?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete adjustment set');

      const { adjustmentSets } = get();
      set({ adjustmentSets: adjustmentSets.filter(s => s.id !== id) });
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  },

  toggleAdjustmentSet: async (id: string, isActive: boolean) => {
    const { setError } = deps();

    try {
      const res = await fetch('/api/adjustments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle adjustment set');
      const updated = await res.json();

      const { adjustmentSets } = get();
      const index = adjustmentSets.findIndex(s => s.id === id);
      if (index >= 0) {
        const newSets = [...adjustmentSets];
        newSets[index] = updated;
        set({ adjustmentSets: newSets });
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  },
});
