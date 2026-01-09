'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  changeSet?: ChangeProposal;
}

interface ChangeProposal {
  id: string;
  changes: {
    bucket: string;
    currentValue: number;
    proposedValue: number;
    reason: string;
  }[];
  status: 'proposed' | 'approved' | 'rejected';
}

export default function AgentPage() {
  const { currentScenario, currentVersion, computedSummary } = useScenarioStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your TCO Analysis Agent. I can help you:

• **Analyze** your current TCO model and identify cost drivers
• **Compare** scenarios and highlight differences
• **Suggest** optimizations to reduce costs
• **Run** sensitivity analysis on key parameters

What would you like to explore?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate AI response (in production, this would call OpenAI/Claude API)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(input, computedSummary),
        changeSet: input.toLowerCase().includes('optimize') || input.toLowerCase().includes('reduce')
          ? generateMockChangeSet()
          : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  const handleApproveChanges = (changeSetId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.changeSet?.id === changeSetId
          ? { ...msg, changeSet: { ...msg.changeSet, status: 'approved' as const } }
          : msg
      )
    );
    // In production: Apply changes via API and trigger recompute
  };

  const handleRejectChanges = (changeSetId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.changeSet?.id === changeSetId
          ? { ...msg, changeSet: { ...msg.changeSet, status: 'rejected' as const } }
          : msg
      )
    );
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

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((message) => (
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
                          variant="ghost"
                          onClick={() => handleRejectChanges(message.changeSet!.id)}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    ) : message.changeSet.status === 'approved' ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Changes applied successfully
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

          {isProcessing && (
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
              disabled={isProcessing}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isProcessing}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            {['What are the main cost drivers?', 'How can I reduce OPEX?', 'Compare to baseline'].map(
              (suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1 text-xs bg-gray-800 text-gray-400 rounded-full hover:bg-gray-700 hover:text-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              )
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Mock response generator (replace with actual AI API call)
interface ComputedSummaryType {
  totalCapex: number;
  totalOpex: number;
  totalTco: number;
  totalNpv: number;
  byYear: { year: number; capex: number; opex: number; tco: number; npv: number }[];
}

function generateMockResponse(input: string, summary: ComputedSummaryType | null): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('cost driver') || lowerInput.includes('main cost')) {
    return `Based on your current TCO model, here are the main cost drivers:

**CAPEX Drivers (${summary ? `$${(summary.totalCapex / 1000000).toFixed(1)}M` : 'Not computed'}):**
• DU Servers - typically 30-40% of site hardware
• Radios and Antennas - 25-35% of site hardware
• CU Infrastructure in DCs - significant for pooled architectures

**OPEX Drivers (${summary ? `$${(summary.totalOpex / 1000000).toFixed(1)}M` : 'Not computed'}):**
• Site leases and power - largest recurring cost
• Software subscriptions/support - 15-20% of license value annually
• Staffing costs - driven by automation levels

Would you like me to analyze any specific area in more detail?`;
  }

  if (lowerInput.includes('reduce') || lowerInput.includes('optimize')) {
    return `I've analyzed your model and identified potential optimization opportunities:

**Quick Wins:**
1. **Increase automation** - Your current auto-remediation is at 60%. Increasing to 80% could reduce NOC staffing by 20-25%.

2. **Optimize CU pooling** - Consider increasing sites per CU from current ratio to reduce CU server costs.

3. **Power efficiency** - Power costs can be reduced 15-20% with modern power systems.

I've prepared specific change proposals below. Review and approve to apply them:`;
  }

  if (lowerInput.includes('compare') || lowerInput.includes('baseline')) {
    return `To compare scenarios, I need to access both the current scenario and your baseline.

**Current Scenario Summary:**
${summary ? `• Total TCO: $${(summary.totalTco / 1000000).toFixed(1)}M
• CAPEX: $${(summary.totalCapex / 1000000).toFixed(1)}M (${((summary.totalCapex / summary.totalTco) * 100).toFixed(0)}%)
• OPEX: $${(summary.totalOpex / 1000000).toFixed(1)}M (${((summary.totalOpex / summary.totalTco) * 100).toFixed(0)}%)` : 'Please compute TCO first to see summary.'}

To enable comparison:
1. Clone this scenario for what-if analysis
2. Make changes to the clone
3. Come back here to compare results

Would you like help setting up a comparison scenario?`;
  }

  return `I can help you analyze your TCO model. Here are some things I can do:

• **Analyze cost drivers** - Identify where your money is going
• **Suggest optimizations** - Find ways to reduce costs
• **Run sensitivity analysis** - See how changes affect outcomes
• **Compare scenarios** - Understand differences between configurations

What would you like to explore?`;
}

function generateMockChangeSet(): ChangeProposal {
  return {
    id: Date.now().toString(),
    changes: [
      { bucket: 'power_per_site', currentValue: 5000, proposedValue: 4250, reason: 'Power efficiency upgrade' },
      { bucket: 'noc_staffing', currentValue: 150000, proposedValue: 112500, reason: 'Increased automation' },
    ],
    status: 'proposed',
  };
}

