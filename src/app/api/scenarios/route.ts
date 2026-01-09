import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { ScenarioSchema } from '@/lib/model/validation';
import { DefaultModelAssumptions } from '@/lib/model/taxonomy';

// GET /api/scenarios - List all scenarios
export async function GET() {
  try {
    const scenarios = await prisma.scenario.findMany({
      include: {
        versions: {
          orderBy: { versionNum: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
  }
}

// POST /api/scenarios - Create a new scenario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ScenarioSchema.parse(body);

    // Create scenario with initial version
    const scenario = await prisma.scenario.create({
      data: {
        name: validated.name,
        description: validated.description,
        isBaseline: validated.isBaseline,
        parentId: validated.parentId,
        versions: {
          create: {
            versionNum: 1,
            description: 'Initial version',
            isActive: true,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    // Create default model assumptions for the initial version
    const versionId = scenario.versions[0].id;
    await prisma.inputFact.createMany({
      data: [
        {
          scenarioVersionId: versionId,
          day: 'day2',
          domain: 'ran',
          layer: 'assumptions',
          bucket: 'tco_years',
          scopeType: 'network_global',
          driver: 'fixed',
          valueNumber: DefaultModelAssumptions.tco_years,
          unit: 'years',
          currency: 'USD',
        },
        {
          scenarioVersionId: versionId,
          day: 'day2',
          domain: 'ran',
          layer: 'assumptions',
          bucket: 'discount_rate',
          scopeType: 'network_global',
          driver: 'fixed',
          valueNumber: DefaultModelAssumptions.discount_rate,
          unit: 'rate',
          currency: 'USD',
        },
      ],
    });

    // Create default DC types
    await prisma.dcType.createMany({
      data: [
        { scenarioVersionId: versionId, name: 'edge', numDcs: 0 },
        { scenarioVersionId: versionId, name: 'regional', numDcs: 0 },
        { scenarioVersionId: versionId, name: 'central', numDcs: 0 },
      ],
    });

    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
  }
}

