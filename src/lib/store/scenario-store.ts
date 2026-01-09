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

interface SiteArchetype {
  id: string;
  scenarioVersionId: string;
  name: string;
  numSites: number;
  numCus: number;
  description: string | null;
}

interface DcType {
  id: string;
  scenarioVersionId: string;
  name: string;
  numDcs: number;
  description: string | null;
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
}

interface ScenarioState {
  // Current selections
  scenarios: Scenario[];
  currentScenario: Scenario | null;
  currentVersion: ScenarioVersion | null;
  
  // Data for current version
  siteArchetypes: SiteArchetype[];
  dcTypes: DcType[];
  inputFacts: InputFact[];
  computedSummary: ComputedSummary | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setScenarios: (scenarios: Scenario[]) => void;
  setCurrentScenario: (scenario: Scenario | null) => void;
  setCurrentVersion: (version: ScenarioVersion | null) => void;
  setSiteArchetypes: (archetypes: SiteArchetype[]) => void;
  setDcTypes: (dcTypes: DcType[]) => void;
  setInputFacts: (facts: InputFact[]) => void;
  setComputedSummary: (summary: ComputedSummary | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API actions
  fetchScenarios: () => Promise<void>;
  fetchVersionData: (versionId: string) => Promise<void>;
  createScenario: (name: string, description?: string) => Promise<Scenario>;
  cloneScenario: (scenarioId: string, name?: string) => Promise<Scenario>;
  saveInputFact: (fact: Partial<InputFact>) => Promise<void>;
  saveSiteArchetype: (archetype: Partial<SiteArchetype>) => Promise<void>;
  saveDcType: (dcType: Partial<DcType>) => Promise<void>;
  computeTco: () => Promise<void>;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenarios: [],
  currentScenario: null,
  currentVersion: null,
  siteArchetypes: [],
  dcTypes: [],
  inputFacts: [],
  computedSummary: null,
  isLoading: false,
  error: null,

  setScenarios: (scenarios) => set({ scenarios }),
  setCurrentScenario: (scenario) => set({ currentScenario: scenario }),
  setCurrentVersion: (version) => set({ currentVersion: version }),
  setSiteArchetypes: (archetypes) => set({ siteArchetypes: archetypes }),
  setDcTypes: (dcTypes) => set({ dcTypes }),
  setInputFacts: (facts) => set({ inputFacts: facts }),
  setComputedSummary: (summary) => set({ computedSummary: summary }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

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
        dcTypes: data.dcTypes || [],
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

  saveDcType: async (dcType: Partial<DcType>) => {
    const { currentVersion, dcTypes } = get();
    if (!currentVersion) return;

    try {
      const res = await fetch('/api/dc-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dcType, scenarioVersionId: currentVersion.id }),
      });
      if (!res.ok) throw new Error('Failed to save DC type');
      const savedDcType = await res.json();
      
      const existingIndex = dcTypes.findIndex(d => d.id === savedDcType.id);
      if (existingIndex >= 0) {
        const updated = [...dcTypes];
        updated[existingIndex] = savedDcType;
        set({ dcTypes: updated });
      } else {
        set({ dcTypes: [...dcTypes, savedDcType] });
      }
    } catch (err) {
      set({ error: (err as Error).message });
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
}));

