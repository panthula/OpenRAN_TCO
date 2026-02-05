/**
 * Scenario comparison state slice
 */

import type { StateCreator } from 'zustand';
import type { ScenarioComparisonData } from '@/lib/types';

export interface ComparisonSlice {
  comparisonScenarios: ScenarioComparisonData[];
  isComparing: boolean;
  loadComparisonData: (scenarioIds: string[]) => Promise<void>;
  clearComparison: () => void;
}

// We need to pass the setError function from the UI slice
export interface ComparisonSliceDeps {
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const createComparisonSlice = (
  deps: () => ComparisonSliceDeps
): StateCreator<ComparisonSlice, [], [], ComparisonSlice> => (set) => ({
  comparisonScenarios: [],
  isComparing: false,

  loadComparisonData: async (scenarioIds: string[]) => {
    const { setError, setLoading } = deps();

    if (scenarioIds.length < 2) {
      setError('At least 2 scenarios are required for comparison');
      return;
    }

    setLoading(true);
    set({ isComparing: true });
    setError(null);

    try {
      const res = await fetch(`/api/compare?ids=${scenarioIds.join(',')}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load comparison data');
      }
      const data = await res.json();
      set({ comparisonScenarios: data.scenarios });
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
      set({ isComparing: false });
    }
  },

  clearComparison: () => {
    set({ comparisonScenarios: [], isComparing: false });
  },
});
