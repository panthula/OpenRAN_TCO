import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { analyzeScenario, ScenarioContext } from '@/lib/ai/analysis';

// POST /api/agent/propose - Generate a change proposal using AI
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
        siteArchetypes: {
          include: {
            deploymentSchedule: true,
          },
        },
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

    // Build context for AI analysis
    const totalSites = version.siteArchetypes.reduce((sum: number, a: (typeof version.siteArchetypes)[number]) => sum + a.numSites, 0);
    const totalTco = version.computedFacts.reduce((sum: number, f: (typeof version.computedFacts)[number]) => sum + f.tco, 0);
    const totalCapex = version.computedFacts.reduce((sum: number, f: (typeof version.computedFacts)[number]) => sum + f.capex, 0);
    const totalOpex = version.computedFacts.reduce((sum: number, f: (typeof version.computedFacts)[number]) => sum + f.opex, 0);

    const context: ScenarioContext = {
      scenarioName: version.scenario.name,
      versionNum: version.versionNum,
      siteArchetypes: version.siteArchetypes.map((a: (typeof version.siteArchetypes)[number]) => ({
        name: a.name,
        numSites: a.numSites,
        numCus: a.numCus,
        numDcs: a.numDcs,
        deploymentYears: a.deploymentYears,
      })),
      inputFacts: version.inputFacts.map((f: (typeof version.inputFacts)[number]) => ({
        day: f.day,
        domain: f.domain,
        layer: f.layer,
        bucket: f.bucket,
        valueNumber: f.valueNumber,
        driver: f.driver,
        scopeType: f.scopeType,
      })),
      computedFacts: version.computedFacts.map((f: (typeof version.computedFacts)[number]) => ({
        year: f.year,
        capex: f.capex,
        opex: f.opex,
        tco: f.tco,
      })),
      totalSites,
      totalTco,
      totalCapex,
      totalOpex,
    };

    // Call AI analysis service
    const response = await analyzeScenario(prompt, context);

    // If the response includes changes, create a ChangeSet in the database
    let changeSet = null;
    if (response.changes && response.changes.length > 0) {
      changeSet = await prisma.changeSet.create({
        data: {
          scenarioVersionId,
          changes: JSON.stringify(response.changes),
          rationale: response.rationale || `AI analysis: ${response.insightType}`,
          prompt,
          status: 'proposed',
        },
      });
    }

    return NextResponse.json({
      content: response.content,
      insightType: response.insightType,
      changeSet: changeSet
        ? {
            id: changeSet.id,
            changes: response.changes,
            status: 'proposed',
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate proposal' }, { status: 500 });
  }
}

