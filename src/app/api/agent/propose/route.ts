import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

// POST /api/agent/propose - Generate a change proposal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioVersionId, prompt } = body;

    if (!scenarioVersionId || !prompt) {
      return NextResponse.json(
        { error: 'scenarioVersionId and prompt are required' },
        { status: 400 }
      );
    }

    // Get scenario context
    const version = await prisma.scenarioVersion.findUnique({
      where: { id: scenarioVersionId },
      include: {
        scenario: true,
        inputFacts: true,
        siteArchetypes: true,
        dcTypes: true,
        computedFacts: {
          where: { metric: 'total' },
          orderBy: { year: 'asc' },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // In production, this would call OpenAI/Claude API
    // For now, generate mock response based on prompt patterns
    const response = generateMockAgentResponse(prompt, version);

    // If the response includes changes, create a ChangeSet
    let changeSet = null;
    if (response.changes && response.changes.length > 0) {
      changeSet = await prisma.changeSet.create({
        data: {
          scenarioVersionId,
          changes: JSON.stringify(response.changes),
          rationale: response.rationale,
          prompt,
          status: 'proposed',
        },
      });
    }

    return NextResponse.json({
      content: response.content,
      changeSet: changeSet
        ? {
            id: changeSet.id,
            changes: response.changes,
            status: 'proposed',
          }
        : null,
    });
  } catch (error) {
    console.error('Error generating proposal:', error);
    return NextResponse.json({ error: 'Failed to generate proposal' }, { status: 500 });
  }
}

interface MockChange {
  operation: 'update';
  bucket: string;
  currentValue: number;
  proposedValue: number;
  reason: string;
}

interface MockResponse {
  content: string;
  changes?: MockChange[];
  rationale?: string;
}

function generateMockAgentResponse(
  prompt: string,
  version: {
    inputFacts: Array<{ bucket: string; valueNumber: number }>;
    computedFacts: Array<{ capex: number; opex: number; tco: number }>;
    siteArchetypes: Array<{ numSites: number }>;
  }
): MockResponse {
  const lowerPrompt = prompt.toLowerCase();
  const totalSites = version.siteArchetypes.reduce((sum, a) => sum + a.numSites, 0);
  const totalTco = version.computedFacts.reduce((sum, f) => sum + f.tco, 0);
  const totalCapex = version.computedFacts.reduce((sum, f) => sum + f.capex, 0);
  const totalOpex = version.computedFacts.reduce((sum, f) => sum + f.opex, 0);

  // Cost driver analysis
  if (lowerPrompt.includes('cost driver') || lowerPrompt.includes('main cost')) {
    const capexPct = totalTco > 0 ? ((totalCapex / totalTco) * 100).toFixed(0) : 0;
    const opexPct = totalTco > 0 ? ((totalOpex / totalTco) * 100).toFixed(0) : 0;

    return {
      content: `Based on your current TCO model for ${totalSites} sites:

**Overall Distribution:**
- Total TCO: $${(totalTco / 1000000).toFixed(1)}M
- CAPEX: $${(totalCapex / 1000000).toFixed(1)}M (${capexPct}%)
- OPEX: $${(totalOpex / 1000000).toFixed(1)}M (${opexPct}%)

**Top CAPEX Drivers:**
1. DU Servers - typically 30-40% of site hardware
2. Radios and Antennas - 25-35% of site hardware
3. CU Infrastructure - varies by pooling ratio

**Top OPEX Drivers:**
1. Site lease and power - largest recurring cost
2. Staffing (NOC, SOC, RAN Ops) - automation-dependent
3. Software support - 15-20% of license value annually

Would you like me to suggest optimizations for any of these areas?`,
    };
  }

  // Optimization request
  if (lowerPrompt.includes('reduce') || lowerPrompt.includes('optimize') || lowerPrompt.includes('save')) {
    const powerFact = version.inputFacts.find(f => f.bucket === 'power_per_site');
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
          reason: 'Power efficiency upgrade - modern rectifiers',
        },
      ],
      rationale: 'Power efficiency optimization through upgraded equipment',
    };
  }

  // Comparison request
  if (lowerPrompt.includes('compare') || lowerPrompt.includes('baseline')) {
    return {
      content: `**Current Scenario Summary:**
- Total Sites: ${totalSites}
- Total TCO: $${(totalTco / 1000000).toFixed(1)}M
- CAPEX: $${(totalCapex / 1000000).toFixed(1)}M
- OPEX: $${(totalOpex / 1000000).toFixed(1)}M

To compare with another scenario:
1. Clone this scenario using the "Clone" button
2. Make modifications to the clone
3. Come back here to compare results

I can help you set up comparison scenarios. What aspects would you like to explore?`,
    };
  }

  // Default response
  return {
    content: `I can help you analyze your TCO model for ${totalSites} sites.

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
  };
}

