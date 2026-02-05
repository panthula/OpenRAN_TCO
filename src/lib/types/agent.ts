/**
 * Agent chat types for AI-assisted TCO analysis
 */

/**
 * Message in the agent chat
 */
export interface AgentMessage {
  id: string;
  versionId: string;
  role: 'user' | 'assistant';
  content: string;
  changeSet?: AgentChangeSet;
  timestamp: number;
}

/**
 * Proposed change from the agent
 */
export interface AgentChange {
  bucket: string;
  currentValue: number;
  proposedValue: number;
  reason: string;
}

/**
 * Set of changes proposed by the agent
 */
export interface AgentChangeSet {
  id: string;
  changes: AgentChange[];
  status: 'proposed' | 'approved' | 'rejected' | 'applying';
  appliedResult?: {
    newVersionNum: number;
    tcoDelta: number;
    newTco: number;
  };
}
