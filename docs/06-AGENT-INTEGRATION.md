# AI Agent Integration Guide

## Overview

The Agent tab provides an AI-powered interface for analyzing TCO data, suggesting optimizations, and proposing changes that users can approve before application. The agent supports both real AI providers (Claude/OpenAI) and a mock mode for development.

**Page Location**: `src/app/(main)/agent/page.tsx`

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Agent Tab UI                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Chat Messages                                               ││
│  │  - User questions                                            ││
│  │  - Agent responses                                           ││
│  │  - Change proposals with Approve/Save as Rule/Reject         ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Quick Insight Buttons + Input Box                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Agent API                                    │
│  POST /api/agent/propose      → Generate analysis + proposals    │
│  POST /api/agent/apply        → Apply changes, create version    │
│  POST /api/agent/create-rule  → Convert to AdjustmentSet rules   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI Analysis Service                            │
│  src/lib/ai/analysis.ts                                          │
│  - Builds context from scenario data                             │
│  - Calls Claude/OpenAI or generates mock responses               │
│  - Parses responses into ChangeProposal format                   │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# .env.local
AI_PROVIDER=claude           # claude | openai | mock (default: mock)
AI_API_KEY=sk-ant-...        # API key for the provider
AI_MODEL=claude-sonnet-4-20250514  # Model to use (optional, has defaults)
AI_MAX_TOKENS=4096           # Max tokens for response (optional)
AI_TEMPERATURE=0.7           # Temperature for generation (optional)
```

### Configuration Files

| File | Purpose |
|------|---------|
| `src/lib/ai/config.ts` | AI provider configuration, environment parsing |
| `src/lib/ai/analysis.ts` | Main analysis service, API calls |
| `src/lib/ai/insights.ts` | Pre-built insight prompts and detection |

## Insight Types

The agent supports specialized analysis types with optimized prompts:

| Insight Type | Trigger Keywords | Description |
|--------------|-----------------|-------------|
| `cost_drivers` | "cost driver", "main cost" | Top contributors by domain/day |
| `optimization_opportunities` | "optimize", "reduce", "save" | Actionable cost reduction |
| `benchmark_comparison` | "benchmark", "compare", "industry" | Industry benchmark comparison |
| `staffing_analysis` | "staff", "noc", "soc" | Labor cost optimization |
| `license_optimization` | "license", "subscription" | Software licensing analysis |
| `deployment_pacing` | "deploy", "schedule", "rollout" | Schedule impact on TCO |

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
  bucket: string;
  day?: string;           // For precise targeting
  domain?: string;        // For precise targeting
  scopeType?: string;     // For precise targeting
  currentValue: number;
  proposedValue: number;
  percentageChange?: number; // e.g., -15 for 15% reduction
  reason: string;
}
```

## Agent Capabilities

### 1. Analysis & Insights

The agent can:
- Identify main cost drivers with scenario context
- Compare CAPEX vs OPEX distribution
- Highlight unusual cost patterns
- Suggest areas for investigation

**Example Prompt**: "What are the main cost drivers in my model?"

### 2. Optimization Proposals

The agent proposes specific changes users can approve:

**Example Prompt**: "How can I reduce OPEX?"

**Response with ChangeSet**:
```
I've identified optimization opportunities:

1. Power Efficiency (15% savings)
   Modern power systems can reduce power costs significantly.

2. Automation Improvements
   Increasing auto-remediation can reduce NOC staffing.

Proposed Changes:
┌────────────────────┬───────────┬───────────┐
│ Bucket             │ Current   │ Proposed  │
├────────────────────┼───────────┼───────────┤
│ power_per_site     │ $5,000    │ $4,250    │
└────────────────────┴───────────┴───────────┘

[Approve & Apply] [Save as Rule] [Reject]
```

### 3. One-Click Apply

When "Approve & Apply" is clicked:
1. Creates new ScenarioVersion
2. Copies all InputFacts with modifications applied
3. Recomputes TCO
4. Updates UI with new version and TCO delta

### 4. Save as Adjustment Rule

Convert proposals to reusable AdjustmentSet rules:
1. Click "Save as Rule"
2. Name the rule set
3. Choose whether to activate immediately
4. Rules persist and can be toggled on/off

## API Endpoints

### POST /api/agent/propose

Generate analysis and optional change proposals.

**Request:**
```json
{
  "scenarioVersionId": "clx...",
  "prompt": "What are my main cost drivers?"
}
```

**Response:**
```json
{
  "content": "Based on your TCO model...",
  "insightType": "cost_drivers",
  "changeSet": {
    "id": "clx...",
    "changes": [...],
    "status": "proposed"
  }
}
```

### POST /api/agent/apply

Apply an approved ChangeSet.

**Request:**
```json
{
  "changeSetId": "clx..."
}
```

**Response:**
```json
{
  "success": true,
  "newVersionId": "clx...",
  "newVersionNum": 2,
  "appliedChanges": [
    {
      "bucket": "power_per_site",
      "originalValue": 5000,
      "newValue": 4250,
      "change": "-15%"
    }
  ],
  "computeResult": {
    "totalCapex": 45000000,
    "totalOpex": 55000000,
    "totalTco": 100000000,
    "totalNpv": 85000000
  }
}
```

### POST /api/agent/create-rule

Convert a ChangeSet to an AdjustmentSet.

**Request:**
```json
{
  "changeSetId": "clx...",
  "name": "Power Optimization",
  "description": "Reduce power costs through efficiency",
  "makeActive": true
}
```

**Response:**
```json
{
  "success": true,
  "id": "clx...",
  "name": "Power Optimization",
  "isActive": true,
  "rulesCreated": 1,
  "rules": [
    {
      "id": "clx...",
      "targetBucket": "power_per_site",
      "adjustmentType": "percentage",
      "adjustmentValue": -15
    }
  ]
}
```

## Security Guardrails

1. **Read-only by default**: Agent can only propose changes, not apply them
2. **Explicit approval**: User must click "Approve & Apply" for any change
3. **Bounded operations**: Agent can only modify InputFacts, not schema
4. **Audit trail**: All changes tracked with ChangeSet records
5. **Version control**: Changes create new version, preserving history
6. **API key security**: Keys stored server-side in environment variables

## System Prompt Strategy

The AI receives rich context including:

```
You are an OpenRAN TCO analyst. You have access to:
- Network topology: {sites, CUs, DCs}
- Cost breakdown by Day×Domain×Layer
- Current CAPEX/OPEX/TCO totals
- Year-by-year cost projections

Your task is to:
1. Analyze cost drivers and patterns
2. Identify optimization opportunities
3. Propose specific, actionable changes with rationale

When proposing changes, specify:
- Exact bucket to modify
- Current value and proposed value
- Expected impact ($ and %)
- Implementation considerations
```

## Testing the Agent

1. **Test with Mock Mode** (no API key needed):
   - Get a proposal: Ask "What are my main cost drivers?"
   - Verify response uses actual scenario data

2. **Test Apply Flow:**
   - Ask "How can I reduce costs?"
   - Click "Approve & Apply"
   - Verify new version created
   - Verify TCO recalculated

3. **Test Adjustment Rule Creation:**
   - Get optimization proposal
   - Click "Save as Rule"
   - Name it and activate
   - Toggle rule on/off in Setup
   - Verify TCO changes accordingly

4. **Test Real AI (if configured):**
   - Set `AI_PROVIDER=claude` and `AI_API_KEY=...`
   - Ask complex questions
   - Verify contextual, specific responses

## Mock Mode Behavior

When AI is not configured (`AI_PROVIDER=mock` or no API key):

- Agent uses pre-built responses based on keyword matching
- Responses still include actual scenario data (TCO, sites, etc.)
- Change proposals use realistic sample modifications
- Useful for development and demonstration

## Extending the Agent

### Add New Insight Type

1. Add type to `InsightType` union in `src/lib/ai/insights.ts`
2. Add prompt configuration to `INSIGHT_PROMPTS` record
3. Add detection logic to `detectInsightType()` function
4. Update mock response in `generateMockResponse()` if needed

### Add New AI Provider

1. Add provider type to `AIProvider` in `src/lib/ai/config.ts`
2. Add default model to `DEFAULT_MODELS`
3. Create `callProvider()` function in `src/lib/ai/analysis.ts`
4. Add case to provider selection in `analyzeScenario()`

### Customize System Prompt

Edit `buildSystemPrompt()` in `src/lib/ai/analysis.ts` to:
- Add domain-specific knowledge
- Include additional context
- Modify response formatting instructions
