/**
 * Agent chat state slice
 */

import type { StateCreator } from 'zustand';
import type { AgentMessage } from '@/lib/types';

export interface AgentSlice {
  agentMessages: AgentMessage[];
  agentIsProcessing: boolean;
  addAgentMessage: (message: AgentMessage) => void;
  updateAgentMessage: (id: string, updates: Partial<AgentMessage>) => void;
  clearAgentMessages: () => void;
  setAgentProcessing: (isProcessing: boolean) => void;
}

export const createAgentSlice: StateCreator<AgentSlice, [], [], AgentSlice> = (set) => ({
  agentMessages: [],
  agentIsProcessing: false,

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
});
