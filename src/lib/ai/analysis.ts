/**
 * AI Analysis Service
 *
 * Provides TCO analysis using Claude (Anthropic) or OpenAI.
 * Falls back to mock responses when AI is not configured.
 */

import { getAIConfig, isAIEnabled, AIConfig } from './config';
import { INSIGHT_PROMPTS, detectInsightType, InsightType } from './insights';

// Types for scenario context
interface SiteArchetype {
  name: string;
  numSites: number;
  numCus: number;
  numDcs: number;
  deploymentYears: number;
}

interface InputFact {
  day: string;
  domain: string;
  layer: string;
  bucket: string;
  valueNumber: number;
  driver: string;
  scopeType: string;
}

interface ComputedFact {
  year: number;
  capex: number;
  opex: number;
  tco: number;
}

export interface ScenarioContext {
  scenarioName: string;
  versionNum: number;
  siteArchetypes: SiteArchetype[];
  inputFacts: InputFact[];
  computedFacts: ComputedFact[];
  totalSites: number;
  totalTco: number;
  totalCapex: number;
  totalOpex: number;
}

export interface ChangeProposal {
  operation: 'update' | 'add' | 'delete';
  bucket: string;
  day?: string;
  domain?: string;
  layer?: string;
  scopeType?: string;
  currentValue: number;
  proposedValue: number;
  percentageChange?: number;
  reason: string;
}

export interface AnalysisResult {
  content: string;
  changes?: ChangeProposal[];
  rationale?: string;
  insightType: InsightType;
}

/**
 * Build the system prompt for TCO analysis
 */
function buildSystemPrompt(context: ScenarioContext, insightType: InsightType): string {
  const insightPrompt = INSIGHT_PROMPTS[insightType];

  const basePrompt = `You are an OpenRAN TCO (Total Cost of Ownership) analyst assistant. You have deep expertise in:
- OpenRAN network architecture (DU, CU, RU, SMO, RIC)
- Network deployment costs (CAPEX) and operations costs (OPEX)
- Day 0 (Design/Procurement), Day 1 (Build/Install), Day 2 (Operations) lifecycle phases
- RAN, Cloud, and OSS domain costs
- Industry benchmarks and best practices

You are analyzing a TCO scenario with the following context:

**Scenario:** ${context.scenarioName} (Version ${context.versionNum})

**Network Topology:**
- Total Sites: ${context.totalSites.toLocaleString()}
${context.siteArchetypes.map((a) => `- ${a.name}: ${a.numSites} sites, ${a.numCus} CUs, ${a.numDcs} DCs (${a.deploymentYears} year deployment)`).join('\n')}

**TCO Summary:**
- Total TCO: $${(context.totalTco / 1000000).toFixed(2)}M
- Total CAPEX: $${(context.totalCapex / 1000000).toFixed(2)}M (${((context.totalCapex / context.totalTco) * 100).toFixed(1)}%)
- Total OPEX: $${(context.totalOpex / 1000000).toFixed(2)}M (${((context.totalOpex / context.totalTco) * 100).toFixed(1)}%)

**Cost Breakdown by Year:**
${context.computedFacts.map((f) => `- Year ${f.year}: CAPEX $${(f.capex / 1000000).toFixed(2)}M, OPEX $${(f.opex / 1000000).toFixed(2)}M`).join('\n')}

${insightPrompt.systemPromptAddition}

When proposing changes, ALWAYS format them as structured JSON that includes:
- bucket: The exact bucket key to modify
- currentValue: The current value
- proposedValue: The new suggested value
- percentageChange: (optional) The percentage change if applicable
- reason: Brief explanation of why this change is beneficial

Be specific and actionable. Use actual bucket names from the data provided.`;

  return basePrompt;
}

/**
 * Build context string from input facts for the AI
 */
function buildFactsContext(facts: InputFact[]): string {
  // Group facts by domain and day
  const grouped: Record<string, Record<string, InputFact[]>> = {};

  for (const fact of facts) {
    if (!grouped[fact.domain]) grouped[fact.domain] = {};
    if (!grouped[fact.domain][fact.day]) grouped[fact.domain][fact.day] = [];
    grouped[fact.domain][fact.day].push(fact);
  }

  const lines: string[] = ['**Key Input Facts:**'];

  for (const [domain, days] of Object.entries(grouped)) {
    lines.push(`\n${domain.toUpperCase()} Domain:`);
    for (const [day, domainFacts] of Object.entries(days)) {
      const significant = domainFacts
        .filter((f) => f.valueNumber > 0)
        .sort((a, b) => b.valueNumber - a.valueNumber)
        .slice(0, 5);

      if (significant.length > 0) {
        lines.push(`  ${day}:`);
        for (const f of significant) {
          lines.push(`    - ${f.bucket}: $${f.valueNumber.toLocaleString()} (${f.driver})`);
        }
      }
    }
  }

  return lines.join('\n');
}

/**
 * Call Claude API
 */
async function callClaude(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Parse AI response to extract change proposals
 */
function extractChanges(response: string): ChangeProposal[] {
  const changes: ChangeProposal[] = [];

  // Look for JSON code blocks
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
  let match;

  while ((match = jsonBlockRegex.exec(response)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.bucket && (item.proposedValue !== undefined || item.percentageChange !== undefined)) {
            changes.push({
              operation: 'update',
              bucket: item.bucket,
              day: item.day,
              domain: item.domain,
              layer: item.layer,
              scopeType: item.scopeType,
              currentValue: item.currentValue || 0,
              proposedValue: item.proposedValue || item.currentValue * (1 + (item.percentageChange || 0) / 100),
              percentageChange: item.percentageChange,
              reason: item.reason || 'AI-suggested optimization',
            });
          }
        }
      } else if (parsed.bucket) {
        changes.push({
          operation: 'update',
          bucket: parsed.bucket,
          day: parsed.day,
          domain: parsed.domain,
          layer: parsed.layer,
          scopeType: parsed.scopeType,
          currentValue: parsed.currentValue || 0,
          proposedValue: parsed.proposedValue || parsed.currentValue * (1 + (parsed.percentageChange || 0) / 100),
          percentageChange: parsed.percentageChange,
          reason: parsed.reason || 'AI-suggested optimization',
        });
      }
    } catch {
      // Not valid JSON, skip
    }
  }

  return changes;
}

/**
 * Generate mock response for when AI is not configured
 */
function generateMockResponse(
  prompt: string,
  context: ScenarioContext,
  insightType: InsightType
): AnalysisResult {
  const { totalTco, totalCapex, totalOpex, totalSites } = context;

  switch (insightType) {
    case 'cost_drivers':
      return {
        content: `Based on your current TCO model for ${totalSites.toLocaleString()} sites:

**Overall Distribution:**
- Total TCO: $${(totalTco / 1000000).toFixed(1)}M
- CAPEX: $${(totalCapex / 1000000).toFixed(1)}M (${((totalCapex / totalTco) * 100).toFixed(0)}%)
- OPEX: $${(totalOpex / 1000000).toFixed(1)}M (${((totalOpex / totalTco) * 100).toFixed(0)}%)

**Top CAPEX Drivers:**
1. DU Servers - typically 30-40% of site hardware
2. Radios and Antennas - 25-35% of site hardware
3. CU Infrastructure - varies by pooling ratio

**Top OPEX Drivers:**
1. Site lease and power - largest recurring cost
2. Staffing (NOC, SOC, RAN Ops) - automation-dependent
3. Software support - 15-20% of license value annually

Would you like me to suggest optimizations for any of these areas?`,
        insightType,
      };

    case 'optimization_opportunities': {
      const powerFact = context.inputFacts.find((f) => f.bucket === 'power_per_site');
      const currentPower = powerFact?.valueNumber || 5000;
      const proposedPower = Math.round(currentPower * 0.85);

      return {
        content: `I've analyzed your model and identified optimization opportunities:

**1. Power Efficiency (15% savings)**
Modern power systems with higher efficiency rectifiers can reduce power costs significantly.

**2. Automation Improvements**
Increasing auto-remediation levels can reduce NOC staffing requirements.

**3. License Optimization**
Consider consolidating software licenses where possible.

I've prepared specific changes for power efficiency below. Review and approve to apply:`,
        changes: [
          {
            operation: 'update',
            bucket: 'power_per_site',
            currentValue: currentPower,
            proposedValue: proposedPower,
            percentageChange: -15,
            reason: 'Power efficiency upgrade - modern rectifiers',
          },
        ],
        rationale: 'Power efficiency optimization through upgraded equipment',
        insightType,
      };
    }

    case 'staffing_analysis':
      return {
        content: `**Staffing Analysis for ${totalSites.toLocaleString()} Sites:**

**Current Staffing Model:**
Staffing costs are a significant OPEX driver, typically 20-30% of annual operating expenses.

**Key Areas:**
1. **NOC Operations** - 24/7 monitoring requires ~1 FTE per 100-200 sites with good automation
2. **RAN Operations** - Configuration and optimization needs ~1 FTE per 50-100 sites
3. **SOC Operations** - Security monitoring scales with incident volume

**Automation Potential:**
- Auto-remediation at 80%+ can reduce NOC headcount by 20-30%
- ML-based anomaly detection reduces alert fatigue
- Self-healing networks minimize manual intervention

Would you like specific recommendations for staffing optimization?`,
        insightType,
      };

    case 'deployment_pacing':
      return {
        content: `**Deployment Schedule Analysis:**

**Current Pace:**
Your deployment schedule affects both cash flow and operational scale-up.

**CAPEX Impact:**
- Day 0/1 costs occur during deployment years
- Front-loaded deployment = higher initial CAPEX, faster ROI
- Phased deployment = spread CAPEX, delayed full network benefits

**OPEX Impact:**
- Day 2 costs scale with cumulative deployed sites
- Staff ramp-up should match deployment pace
- Support costs grow as installed base increases

**NPV Considerations:**
- Higher discount rates favor delayed deployment
- Revenue timing should align with network availability

Would you like to model different deployment scenarios?`,
        insightType,
      };

    default:
      return {
        content: `I can help you analyze your TCO model for ${totalSites.toLocaleString()} sites.

**Current Summary:**
- Total TCO: $${(totalTco / 1000000).toFixed(1)}M over the analysis period
- CAPEX: $${(totalCapex / 1000000).toFixed(1)}M
- OPEX: $${(totalOpex / 1000000).toFixed(1)}M

**What I can help with:**
• Identify cost drivers and optimization opportunities
• Run sensitivity analysis on key parameters
• Compare scenarios and highlight differences
• Suggest specific changes to reduce costs

What would you like to explore?`,
        insightType,
      };
  }
}

/**
 * Main analysis function
 */
export async function analyzeScenario(
  prompt: string,
  context: ScenarioContext
): Promise<AnalysisResult> {
  const config = getAIConfig();
  const insightType = detectInsightType(prompt);

  // If AI is not configured, use mock responses
  if (!isAIEnabled()) {
    return generateMockResponse(prompt, context, insightType);
  }

  try {
    const systemPrompt = buildSystemPrompt(context, insightType);
    const factsContext = buildFactsContext(context.inputFacts);

    const insightPrompt = INSIGHT_PROMPTS[insightType];
    const userPrompt = insightType === 'general' ? prompt : `${insightPrompt.userPromptTemplate}\n\n${factsContext}\n\nUser question: ${prompt}`;

    let response: string;

    if (config.provider === 'claude') {
      response = await callClaude(config, systemPrompt, userPrompt);
    } else if (config.provider === 'openai') {
      response = await callOpenAI(config, systemPrompt, userPrompt);
    } else {
      return generateMockResponse(prompt, context, insightType);
    }

    // Extract any change proposals from the response
    const changes = extractChanges(response);

    // Clean the response by removing JSON blocks for display
    const cleanContent = response.replace(/```(?:json)?\s*[\s\S]*?```/g, '').trim();

    return {
      content: cleanContent || response,
      changes: changes.length > 0 ? changes : undefined,
      rationale: changes.length > 0 ? `AI analysis: ${insightType}` : undefined,
      insightType,
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    // Fall back to mock on error
    const mockResult = generateMockResponse(prompt, context, insightType);
    mockResult.content = `(AI unavailable, showing default analysis)\n\n${mockResult.content}`;
    return mockResult;
  }
}
