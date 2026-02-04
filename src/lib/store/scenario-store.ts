/**
 * Zustand store for scenario state management
 */

import { create } from 'zustand';

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  isBaseline: boolean;
  versions: ScenarioVersion[];
}

interface ScenarioVersion {
  id: string;
  scenarioId: string;
  versionNum: number;
  description: string | null;
  isActive: boolean;
}

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

interface InputFact {
  id: string;
  scenarioVersionId: string;
  day: string;
  domain: string;
  layer: string;
  bucket: string;
  scopeType: string;
  scopeId: string | null;
  driver: string;
  valueNumber: number;
  valueJson: string | null;
  unit: string;
  currency: string;
  notes: string | null;
  licenseModel: string | null;
  spreadYears: number | null;
}

interface ComputedSummary {
  totalCapex: number;
  totalOpex: number;
  totalTco: number;
  totalNpv: number;
  byYear: { year: number; capex: number; opex: number; tco: number; npv: number }[];
  byDayDomain?: Record<string, { capex: number; opex: number; tco: number }>;
  adjustments?: { id: string; name: string; rulesApplied: number; totalImpact: number }[];
  baselineTco?: number;
}

interface ScenarioComparisonData {
  id: string;
  name: string;
  description: string | null;
  isBaseline: boolean;
  versionId: string;
  versionNum: number;
  summary: ComputedSummary | null;
}

interface AdjustmentRule {
  id?: string;
  adjustmentSetId?: string;
  targetDay: string | null;
  targetDomain: string | null;
  targetLayer: string | null;
  targetBucket: string | null;
  targetScopeType: string | null;
  targetScopeId: string | null;
  adjustmentType: string;
  adjustmentValue: number;
  priority: number;
  notes: string | null;
}

interface AdjustmentSet {
  id: string;
  scenarioVersionId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  rules: AdjustmentRule[];
}

interface AgentMessage {
  id: string;
  versionId: string;
  role: 'user' | 'assistant';
  content: string;
  changeSet?: {
    id: string;
    changes: Array<{
      bucket: string;
      currentValue: number;
      proposedValue: number;
      reason: string;
    }>;
    status: 'proposed' | 'approved' | 'rejected' | 'applying';
    appliedResult?: {
      newVersionNum: number;
      tcoDelta: number;
      newTco: number;
    };
  };
  timestamp: number;
}

interface ScenarioState {
  // Current selections
  scenarios: Scenario[];
  currentScenario: Scenario | null;
  currentVersion: ScenarioVersion | null;

  // Data for current version
  siteArchetypes: SiteArchetype[];
  inputFacts: InputFact[];
  adjustmentSets: AdjustmentSet[];
  computedSummary: ComputedSummary | null;

  // Comparison state
  comparisonScenarios: ScenarioComparisonData[];
  isComparing: boolean;

  // Agent chat state
  agentMessages: AgentMessage[];
  agentIsProcessing: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentScenario: (scenario: Scenario | null) => void;
  setCurrentVersion: (version: ScenarioVersion | null) => void;

  // API actions
  fetchScenarios: () => Promise<void>;
  fetchVersionData: (versionId: string) => Promise<void>;
  createScenario: (name: string, description?: string) => Promise<Scenario>;
  cloneScenario: (scenarioId: string, name?: string) => Promise<Scenario>;
  deleteScenario: (scenarioId: string) => Promise<void>;
  saveInputFact: (fact: Partial<InputFact>) => Promise<void>;
  saveSiteArchetype: (archetype: Partial<SiteArchetype>) => Promise<void>;
  deleteSiteArchetype: (id: string) => Promise<void>;
  computeTco: () => Promise<void>;
  batchUpdateLicenseModel: (
    filter: { day: string; domain: string; layer: string },
    licenseModel: string | null
  ) => Promise<void>;

  // Adjustment actions
  fetchAdjustmentSets: () => Promise<void>;
  saveAdjustmentSet: (set: Partial<AdjustmentSet>) => Promise<AdjustmentSet>;
  deleteAdjustmentSet: (id: string) => Promise<void>;
  toggleAdjustmentSet: (id: string, isActive: boolean) => Promise<void>;

  // Comparison actions
  loadComparisonData: (scenarioIds: string[]) => Promise<void>;
  clearComparison: () => void;

  // Agent actions
  addAgentMessage: (message: AgentMessage) => void;
  updateAgentMessage: (id: string, updates: Partial<AgentMessage>) => void;
  clearAgentMessages: () => void;
  setAgentProcessing: (isProcessing: boolean) => void;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenarios: [],
  currentScenario: null,
  currentVersion: null,
  siteArchetypes: [],
  inputFacts: [],
  adjustmentSets: [],
  computedSummary: null,
  comparisonScenarios: [],
  isComparing: false,
  agentMessages: [],
  agentIsProcessing: false,
  isLoading: false,
  error: null,

  setCurrentScenario: (scenario) => set({ currentScenario: scenario }),
  setCurrentVersion: (version) => set({ currentVersion: version }),

  fetchScenarios: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/scenarios');
      if (!res.ok) throw new Error('Failed to fetch scenarios');
      const data = await res.json();
      set({ scenarios: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchVersionData: async (versionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/versions/${versionId}`);
      if (!res.ok) throw new Error('Failed to fetch version data');
      const data = await res.json();
      
      set({
        currentVersion: {
          id: data.id,
          scenarioId: data.scenarioId,
          versionNum: data.versionNum,
          description: data.description,
          isActive: data.isActive,
        },
        siteArchetypes: data.siteArchetypes || [],
        inputFacts: data.inputFacts || [],
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createScenario: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isBaseline: true }),
      });
      if (!res.ok) throw new Error('Failed to create scenario');
      const scenario = await res.json();
      
      const { scenarios } = get();
      set({
        scenarios: [scenario, ...scenarios],
        currentScenario: scenario,
        currentVersion: scenario.versions[0],
        isLoading: false,
      });
      
      // Fetch the version data
      await get().fetchVersionData(scenario.versions[0].id);
      
      return scenario;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  cloneScenario: async (scenarioId: string, name?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to clone scenario');
      const scenario = await res.json();
      
      const { scenarios } = get();
      set({
        scenarios: [scenario, ...scenarios],
        currentScenario: scenario,
        currentVersion: scenario.versions[0],
        isLoading: false,
      });
      
      await get().fetchVersionData(scenario.versions[0].id);

      return scenario;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  deleteScenario: async (scenarioId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete scenario');

      const { scenarios, currentScenario } = get();
      const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);

      // If deleted scenario was current, auto-select next available
      if (currentScenario?.id === scenarioId) {
        const nextScenario = updatedScenarios[0] || null;
        set({
          scenarios: updatedScenarios,
          currentScenario: nextScenario,
          currentVersion: nextScenario?.versions[0] || null,
          isLoading: false,
        });

        // Fetch version data for the new current scenario
        if (nextScenario?.versions[0]) {
          await get().fetchVersionData(nextScenario.versions[0].id);
        }
      } else {
        set({ scenarios: updatedScenarios, isLoading: false });
      }
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  saveInputFact: async (fact: Partial<InputFact>) => {
    const { currentVersion } = get();
    if (!currentVersion) {
      throw new Error('No scenario version selected');
    }

    try {
      const res = await fetch('/api/input-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ ...fact, scenarioVersionId: currentVersion.id }]),
      });
      if (!res.ok) {
        // Try to parse JSON error response
        let errorMessage = `HTTP ${res.status}: Failed to save input fact`;
        try {
          const errorData = await res.json();
          if (errorData.error) {
            errorMessage = errorData.error;
            // Include validation details if present
            if (errorData.details) {
              if (Array.isArray(errorData.details)) {
                const detailStr = errorData.details
                  .map((d: { path?: string; message?: string }) => `${d.path}: ${d.message}`)
                  .join(', ');
                errorMessage += ` (${detailStr})`;
              } else if (typeof errorData.details === 'string') {
                errorMessage += `: ${errorData.details}`;
              }
            }
            // Include Prisma error code if present
            if (errorData.code) {
              errorMessage += ` [${errorData.code}]`;
            }
          }
        } catch {
          // If JSON parsing fails, try to get text
          try {
            const text = await res.text();
            if (text) {
              errorMessage = `HTTP ${res.status}: ${text.slice(0, 200)}`;
            }
          } catch {
            // Use default error message
          }
        }
        throw new Error(errorMessage);
      }
      const [savedFact] = await res.json();
      
      // Use get() again to get LATEST inputFacts (fixes race condition in sequential saves)
      const { inputFacts } = get();
      const existingIndex = inputFacts.findIndex(f => f.id === savedFact.id);
      if (existingIndex >= 0) {
        const updated = [...inputFacts];
        updated[existingIndex] = savedFact;
        set({ inputFacts: updated });
      } else {
        set({ inputFacts: [...inputFacts, savedFact] });
      }
    } catch (err) {
      set({ error: (err as Error).message });
      throw err; // Re-throw so callers know the save failed
    }
  },

  saveSiteArchetype: async (archetype: Partial<SiteArchetype>) => {
    const { currentVersion, siteArchetypes } = get();
    if (!currentVersion) return;

    try {
      const res = await fetch('/api/site-archetypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...archetype, scenarioVersionId: currentVersion.id }),
      });
      if (!res.ok) throw new Error('Failed to save site archetype');
      const savedArchetype = await res.json();
      
      const existingIndex = siteArchetypes.findIndex(a => a.id === savedArchetype.id);
      if (existingIndex >= 0) {
        const updated = [...siteArchetypes];
        updated[existingIndex] = savedArchetype;
        set({ siteArchetypes: updated });
      } else {
        set({ siteArchetypes: [...siteArchetypes, savedArchetype] });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  deleteSiteArchetype: async (id: string) => {
    try {
      const res = await fetch(`/api/site-archetypes?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete site archetype');

      const { siteArchetypes, inputFacts } = get();
      set({
        siteArchetypes: siteArchetypes.filter(a => a.id !== id),
        inputFacts: inputFacts.filter(f => !(f.scopeId === id && f.scopeType === 'site_archetype')),
      });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  computeTco: async () => {
    const { currentVersion } = get();
    if (!currentVersion) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioVersionId: currentVersion.id }),
      });
      if (!res.ok) throw new Error('Failed to compute TCO');
      const summary = await res.json();
      set({ computedSummary: summary, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  batchUpdateLicenseModel: async (
    filter: { day: string; domain: string; layer: string },
    licenseModel: string | null
  ) => {
    const { currentVersion, inputFacts, saveInputFact } = get();
    if (!currentVersion) {
      throw new Error('No scenario version selected');
    }

    // Find all facts matching the filter
    const matchingFacts = inputFacts.filter(
      (f) =>
        f.day === filter.day &&
        f.domain === filter.domain &&
        f.layer === filter.layer
    );

    if (matchingFacts.length === 0) {
      return; // No facts to update
    }

    // Update each matching fact with the new licenseModel
    const updatePromises = matchingFacts.map((fact) =>
      saveInputFact({
        ...fact,
        licenseModel,
      })
    );

    await Promise.all(updatePromises);
  },

  fetchAdjustmentSets: async () => {
    const { currentVersion } = get();
    if (!currentVersion) return;

    try {
      const res = await fetch(`/api/adjustments?versionId=${currentVersion.id}`);
      if (!res.ok) throw new Error('Failed to fetch adjustment sets');
      const data = await res.json();
      set({ adjustmentSets: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  saveAdjustmentSet: async (adjustmentSet: Partial<AdjustmentSet>) => {
    const { currentVersion, adjustmentSets } = get();
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
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteAdjustmentSet: async (id: string) => {
    try {
      const res = await fetch(`/api/adjustments?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete adjustment set');

      const { adjustmentSets } = get();
      set({ adjustmentSets: adjustmentSets.filter(s => s.id !== id) });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  toggleAdjustmentSet: async (id: string, isActive: boolean) => {
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
      set({ error: (err as Error).message });
      throw err;
    }
  },

  loadComparisonData: async (scenarioIds: string[]) => {
    if (scenarioIds.length < 2) {
      set({ error: 'At least 2 scenarios are required for comparison' });
      return;
    }

    set({ isLoading: true, isComparing: true, error: null });
    try {
      const res = await fetch(`/api/compare?ids=${scenarioIds.join(',')}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load comparison data');
      }
      const data = await res.json();
      set({ comparisonScenarios: data.scenarios, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false, isComparing: false });
    }
  },

  clearComparison: () => {
    set({ comparisonScenarios: [], isComparing: false });
  },

  // Agent actions
  addAgentMessage: (message) => set((state) => ({
    agentMessages: [...state.agentMessages, message]
  })),

  updateAgentMessage: (id, updates) => set((state) => ({
    agentMessages: state.agentMessages.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),

  clearAgentMessages: () => set({ agentMessages: [] }),

  setAgentProcessing: (isProcessing) => set({ agentIsProcessing: isProcessing }),
}));

