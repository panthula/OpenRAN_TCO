'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, CheckCircle, XCircle, AlertCircle, Loader2, Save, Trash2 } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AgentPage() {
  const {
    currentScenario,
    currentVersion,
    computedSummary,
    fetchVersionData,
    fetchScenarios,
    computeTco,
    agentMessages,
    agentIsProcessing,
    addAgentMessage,
    updateAgentMessage,
    clearAgentMessages,
    setAgentProcessing,
  } = useScenarioStore();

  const [input, setInput] = useState('');

  // Initialize welcome message when version is available and no messages exist
  useEffect(() => {
    if (agentMessages.length === 0 && currentVersion) {
      addAgentMessage({
        id: `welcome-${Date.now()}`,
        versionId: currentVersion.id,
        role: 'assistant',
        content: `Hello! I'm your TCO Analysis Agent. I can help you:

• **Analyze** your current TCO model and identify cost drivers
• **Compare** scenarios and highlight differences
• **Suggest** optimizations to reduce costs
• **Run** sensitivity analysis on key parameters

What would you like to explore?`,
        timestamp: Date.now(),
      });
    }
  }, [currentVersion?.id, agentMessages.length, addAgentMessage]);

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedChangeSetId, setSelectedChangeSetId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [makeRuleActive, setMakeRuleActive] = useState(true);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || agentIsProcessing || !currentVersion) return;

    const userMessage = {
      id: Date.now().toString(),
      versionId: currentVersion.id,
      role: 'user' as const,
      content: input,
      timestamp: Date.now(),
    };

    addAgentMessage(userMessage);
    const promptText = input;
    setInput('');
    setAgentProcessing(true);

    try {
      const response = await fetch('/api/agent/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioVersionId: currentVersion.id,
          prompt: promptText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from agent');
      }

      const data = await response.json();

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        versionId: currentVersion.id,
        role: 'assistant' as const,
        content: data.content,
        changeSet: data.changeSet
          ? {
              id: data.changeSet.id,
              changes: data.changeSet.changes,
              status: 'proposed' as const,
            }
          : undefined,
        timestamp: Date.now(),
      };

      addAgentMessage(assistantMessage);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        versionId: currentVersion.id,
        role: 'assistant' as const,
        content: `Sorry, I encountered an error: ${(error as Error).message}. Please try again.`,
        timestamp: Date.now(),
      };
      addAgentMessage(errorMessage);
    } finally {
      setAgentProcessing(false);
    }
  };

  const handleApproveChanges = async (changeSetId: string) => {
    // Find the message with this changeSet
    const messageWithChangeSet = agentMessages.find((msg) => msg.changeSet?.id === changeSetId);
    if (!messageWithChangeSet) return;

    // Set status to applying
    updateAgentMessage(messageWithChangeSet.id, {
      changeSet: { ...messageWithChangeSet.changeSet!, status: 'applying' as const },
    });

    try {
      const response = await fetch('/api/agent/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeSetId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply changes');
      }

      const result = await response.json();

      // Calculate TCO delta
      const previousTco = computedSummary?.totalTco || 0;
      const newTco = result.computeResult.totalTco;
      const tcoDelta = newTco - previousTco;

      // Update message with success status
      updateAgentMessage(messageWithChangeSet.id, {
        changeSet: {
          ...messageWithChangeSet.changeSet!,
          status: 'approved' as const,
          appliedResult: {
            newVersionNum: result.newVersionNum,
            tcoDelta,
            newTco,
          },
        },
      });

      // Refresh scenario data to reflect new version
      await fetchScenarios();
      await fetchVersionData(result.newVersionId);
      await computeTco();
    } catch (error) {
      // Revert to proposed state on error
      updateAgentMessage(messageWithChangeSet.id, {
        changeSet: { ...messageWithChangeSet.changeSet!, status: 'proposed' as const },
      });

      // Add error message
      addAgentMessage({
        id: Date.now().toString(),
        versionId: currentVersion!.id,
        role: 'assistant',
        content: (error as Error).message,
        timestamp: Date.now(),
      });
    }
  };

  const handleRejectChanges = (changeSetId: string) => {
    const messageWithChangeSet = agentMessages.find((msg) => msg.changeSet?.id === changeSetId);
    if (!messageWithChangeSet) return;

    updateAgentMessage(messageWithChangeSet.id, {
      changeSet: { ...messageWithChangeSet.changeSet!, status: 'rejected' as const },
    });
  };

  const handleSaveAsRule = (changeSetId: string) => {
    setSelectedChangeSetId(changeSetId);
    setRuleName('AI Optimization');
    setRuleDescription('');
    setMakeRuleActive(true);
    setShowRuleModal(true);
  };

  const handleCreateRule = async () => {
    if (!selectedChangeSetId || !ruleName.trim() || !currentVersion) return;

    setIsCreatingRule(true);
    try {
      const response = await fetch('/api/agent/create-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeSetId: selectedChangeSetId,
          name: ruleName,
          description: ruleDescription,
          makeActive: makeRuleActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create adjustment rule');
      }

      const result = await response.json();

      // Add success message
      addAgentMessage({
        id: Date.now().toString(),
        versionId: currentVersion.id,
        role: 'assistant',
        content: `Created adjustment set "${result.name}" with ${result.rulesCreated} rule(s).${
          makeRuleActive ? ' The rules are now active and will affect TCO calculations.' : ' The rules are saved but inactive.'
        }`,
        timestamp: Date.now(),
      });

      // Close modal
      setShowRuleModal(false);
      setSelectedChangeSetId(null);

      // Refresh adjustments if active
      if (makeRuleActive) {
        await computeTco();
      }
    } catch (error) {
      addAgentMessage({
        id: Date.now().toString(),
        versionId: currentVersion.id,
        role: 'assistant',
        content: (error as Error).message,
        timestamp: Date.now(),
      });
    } finally {
      setIsCreatingRule(false);
    }
  };

  if (!currentVersion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">AI Agent</h1>
            <p className="text-gray-400">Intelligent analysis and optimization</p>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Scenario Selected</h3>
              <p className="text-gray-500">Select a scenario to start analyzing with AI</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse-glow">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">AI Agent</h1>
            <p className="text-gray-400">
              Analyzing: {currentScenario?.name} - v{currentVersion.versionNum}
            </p>
          </div>
        </div>
        {agentMessages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAgentMessages}
            className="text-gray-400 hover:text-gray-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
          {agentMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl p-4 ${
                  message.role === 'user'
                    ? 'bg-cyan-500/20 text-gray-100'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-xs text-violet-400 font-medium">TCO Agent</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                {/* Change Set Proposal */}
                {message.changeSet && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">Proposed Changes</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {message.changeSet.changes.map((change, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg text-xs"
                        >
                          <span className="text-gray-300">{change.bucket}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-red-400">${change.currentValue.toLocaleString()}</span>
                            <span className="text-gray-500">→</span>
                            <span className="text-green-400">${change.proposedValue.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {message.changeSet.status === 'proposed' ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveChanges(message.changeSet!.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve & Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSaveAsRule(message.changeSet!.id)}
                        >
                          <Save className="w-4 h-4" />
                          Save as Rule
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRejectChanges(message.changeSet!.id)}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    ) : message.changeSet.status === 'applying' ? (
                      <div className="flex items-center gap-2 text-cyan-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Applying changes and recomputing TCO...
                      </div>
                    ) : message.changeSet.status === 'approved' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Changes applied successfully
                        </div>
                        {message.changeSet.appliedResult && (
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>New Version: v{message.changeSet.appliedResult.newVersionNum}</div>
                            <div>
                              TCO: ${(message.changeSet.appliedResult.newTco / 1000000).toFixed(2)}M
                              {' '}
                              <span className={message.changeSet.appliedResult.tcoDelta < 0 ? 'text-green-400' : 'text-red-400'}>
                                ({message.changeSet.appliedResult.tcoDelta < 0 ? '' : '+'}
                                ${(message.changeSet.appliedResult.tcoDelta / 1000000).toFixed(2)}M)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <XCircle className="w-4 h-4" />
                        Changes rejected
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {agentIsProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Input Area */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about TCO, request optimizations, or run analysis..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
              disabled={agentIsProcessing}
            />
            <Button onClick={handleSend} disabled={!input.trim() || agentIsProcessing}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {/* Quick Insight Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { label: 'Analyze Cost Drivers', prompt: 'What are the main cost drivers in my TCO model?' },
              { label: 'Find Optimizations', prompt: 'How can I reduce costs? Suggest optimizations.' },
              { label: 'Staffing Analysis', prompt: 'Analyze my staffing costs and suggest improvements.' },
              { label: 'Deployment Analysis', prompt: 'Analyze my deployment schedule and its TCO impact.' },
            ].map((insight) => (
              <button
                key={insight.label}
                onClick={() => setInput(insight.prompt)}
                className="px-3 py-1 text-xs bg-gray-800 text-gray-400 rounded-full hover:bg-gray-700 hover:text-gray-200 transition-colors"
              >
                {insight.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Rule Creation Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Save as Adjustment Rule</h3>
            <p className="text-sm text-gray-400 mb-4">
              Create an adjustment set from the proposed changes. This allows you to toggle the changes on/off and reuse them across scenarios.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Rule Set Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., Power Optimization"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="Describe what these rules do..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="makeActive"
                  checked={makeRuleActive}
                  onChange={(e) => setMakeRuleActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-violet-500 focus:ring-violet-500"
                />
                <label htmlFor="makeActive" className="text-sm text-gray-300">
                  Activate immediately (apply to TCO calculations)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreateRule}
                disabled={!ruleName.trim() || isCreatingRule}
                className="flex-1"
              >
                {isCreatingRule ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Rule Set
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRuleModal(false);
                  setSelectedChangeSetId(null);
                }}
                disabled={isCreatingRule}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

