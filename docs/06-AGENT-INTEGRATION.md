# AI Agent Integration Guide

## Overview

The Agent tab provides an AI-powered interface for analyzing TCO data, suggesting optimizations, and proposing changes that users can approve before application.

**Page Location**: `src/app/(main)/agent/page.tsx`

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Agent Tab UI                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Chat Messages                                               ││
│  │  - User questions                                            ││
│  │  - Agent responses                                           ││
│  │  - Change proposals with Approve/Reject buttons              ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Input Box + Suggested Prompts                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Agent API                                    │
│  POST /api/agent/propose                                         │
│  POST /api/agent/apply                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI Provider (OpenAI/Claude)                    │
│  - Receives scenario context + user prompt                       │
│  - Returns analysis + optional ChangeSet                         │
└─────────────────────────────────────────────────────────────────┘
```

## ChangeSet Model

A ChangeSet represents a proposed set of modifications:

```typescript
interface ChangeSet {
  id: string;
  scenarioVersionId: string;
  changes: ChangeOperation[];
  rationale: string;
  prompt: string;
  status: 'proposed' | 'approved' | 'rejected' | 'applied';
  createdAt: Date;
  appliedAt?: Date;
  resultVersionId?: string;
}

interface ChangeOperation {
  operation: 'add' | 'update' | 'delete';
  factId?: string;        // For update/delete
  inputData?: {           // For add/update
    day: string;
    domain: string;
    layer: string;
    bucket: string;
    scopeType: string;
    scopeId?: string;
    driver: string;
    valueNumber: number;
  };
}
```

## Agent Capabilities

### 1. Analysis & Insights

The agent can:
- Identify main cost drivers
- Compare CAPEX vs OPEX distribution
- Highlight unusual cost patterns
- Suggest areas for investigation

**Example Prompt**: "What are the main cost drivers in my model?"

**Example Response**:
```
Based on your current TCO model, here are the main cost drivers:

CAPEX Drivers ($45M):
• DU Servers - 35% of site hardware
• Radios and Antennas - 30% of site hardware
• CU Infrastructure - 15% of DC costs

OPEX Drivers ($60M over 5 years):
• Site leases and power - 40% of annual OPEX
• Staffing costs - 30% of annual OPEX
• Software support - 20% of annual OPEX
```

### 2. Optimization Suggestions

The agent can propose specific changes to reduce costs:

**Example Prompt**: "How can I reduce OPEX?"

**Response with ChangeSet**:
```
I've identified optimization opportunities:

1. Increase automation - Raising auto-remediation from 60% to 80% 
   could reduce NOC staffing by 25%.

2. Power efficiency - Modern power systems can reduce power costs 
   by 15%.

Proposed Changes:
┌────────────────────┬───────────┬───────────┐
│ Bucket             │ Current   │ Proposed  │
├────────────────────┼───────────┼───────────┤
│ power_per_site     │ $5,000    │ $4,250    │
│ noc_staffing       │ $150,000  │ $112,500  │
└────────────────────┴───────────┴───────────┘

[Approve & Apply] [Reject]
```

### 3. Sensitivity Analysis

Run what-if scenarios without manual input changes:

**Example Prompt**: "What if site count increases by 20%?"

### 4. Scenario Comparison

Compare current scenario with baseline or alternatives:

**Example Prompt**: "Compare this scenario to baseline"

## Implementation Details

### Current Implementation (Mock)

The current implementation uses mock responses for demonstration:

```typescript
function generateMockResponse(input: string, summary: ComputeSummary): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('cost driver')) {
    return `Based on your current TCO model...`;
  }

  if (lowerInput.includes('reduce') || lowerInput.includes('optimize')) {
    return `I've analyzed your model...`;
  }

  // Default response
  return `I can help you analyze your TCO model...`;
}
```

### Production Implementation (TODO)

To connect to a real AI provider:

```typescript
// src/app/api/agent/propose/route.ts

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const { scenarioVersionId, prompt } = await request.json();

  // 1. Load scenario context
  const context = await getScenarioContext(scenarioVersionId);

  // 2. Build system prompt with TCO knowledge
  const systemPrompt = buildSystemPrompt(context);

  // 3. Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    functions: [
      {
        name: 'propose_changes',
        description: 'Propose changes to TCO inputs',
        parameters: ChangeSetSchema,
      },
    ],
  });

  // 4. Parse response and return
  return NextResponse.json({
    content: completion.choices[0].message.content,
    changeSet: parseChangeSet(completion.choices[0].message.function_call),
  });
}
```

### Applying Changes

When user approves a ChangeSet:

```typescript
// src/app/api/agent/apply/route.ts

export async function POST(request: NextRequest) {
  const { changeSetId } = await request.json();

  // 1. Load the ChangeSet
  const changeSet = await prisma.changeSet.findUnique({
    where: { id: changeSetId },
    include: { scenarioVersion: true },
  });

  // 2. Create new ScenarioVersion
  const newVersion = await prisma.scenarioVersion.create({
    data: {
      scenarioId: changeSet.scenarioVersion.scenarioId,
      versionNum: changeSet.scenarioVersion.versionNum + 1,
      description: `Applied agent changes: ${changeSet.rationale}`,
    },
  });

  // 3. Copy all InputFacts to new version
  await copyInputFacts(changeSet.scenarioVersion.id, newVersion.id);

  // 4. Apply the changes
  for (const change of JSON.parse(changeSet.changes)) {
    if (change.operation === 'add') {
      await prisma.inputFact.create({
        data: { ...change.inputData, scenarioVersionId: newVersion.id },
      });
    } else if (change.operation === 'update') {
      await prisma.inputFact.update({
        where: { id: change.factId },
        data: change.inputData,
      });
    } else if (change.operation === 'delete') {
      await prisma.inputFact.delete({
        where: { id: change.factId },
      });
    }
  }

  // 5. Recompute TCO
  await computeAndPersist(newVersion.id);

  // 6. Update ChangeSet status
  await prisma.changeSet.update({
    where: { id: changeSetId },
    data: {
      status: 'applied',
      appliedAt: new Date(),
      resultVersionId: newVersion.id,
    },
  });

  return NextResponse.json({ success: true, newVersionId: newVersion.id });
}
```

## Security Guardrails

1. **Read-only by default**: Agent can only propose changes, not apply them
2. **Explicit approval**: User must click "Approve & Apply" for any change
3. **Bounded operations**: Agent can only modify InputFacts, not schema
4. **Audit trail**: All changes tracked with ChangeSet records
5. **Version control**: Changes create new version, preserving history

## Prompt Engineering Tips

### System Prompt Structure

```
You are a TCO analysis assistant for OpenRAN networks.

Current Scenario Context:
- Scenario: {name}
- Version: {versionNum}
- Total Sites: {totalSites}
- Total CUs: {totalCUs}
- Computed TCO: ${totalTco}

Available Buckets:
{list of valid bucket keys}

When suggesting changes, use the propose_changes function with valid bucket keys and values.
```

### Few-Shot Examples

Include examples of good change proposals:

```
Example: User asks "reduce power costs"
Good response: Propose updating power_per_site from $5000 to $4250
Reason: Modern power systems with higher efficiency
```

## Future Enhancements

1. **Multiple AI Providers**: Support switching between OpenAI and Claude
2. **Streaming Responses**: Real-time response display
3. **Context Window Management**: Handle large scenario data
4. **Conversation Memory**: Maintain context across messages
5. **Automated Sweeps**: Agent can trigger parameter sweeps
6. **Visualization Generation**: Agent can suggest chart configurations

