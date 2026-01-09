import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

// GET /api/scenarios/[id] - Get a specific scenario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenario = await prisma.scenario.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNum: 'desc' },
        },
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return NextResponse.json({ error: 'Failed to fetch scenario' }, { status: 500 });
  }
}

// DELETE /api/scenarios/[id] - Delete a scenario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.scenario.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json({ error: 'Failed to delete scenario' }, { status: 500 });
  }
}

// POST /api/scenarios/[id] - Clone a scenario
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    // Get the source scenario with its latest version
    const source = await prisma.scenario.findUnique({
      where: { id },
      include: {
        versions: {
          where: { isActive: true },
          orderBy: { versionNum: 'desc' },
          take: 1,
          include: {
            inputFacts: true,
            siteArchetypes: true,
            dcTypes: true,
          },
        },
      },
    });

    if (!source || source.versions.length === 0) {
      return NextResponse.json({ error: 'Source scenario not found' }, { status: 404 });
    }

    const sourceVersion = source.versions[0];

    // Create new scenario
    const newScenario = await prisma.scenario.create({
      data: {
        name: name || `${source.name} (Clone)`,
        description: description || `Cloned from ${source.name}`,
        isBaseline: false,
        parentId: id,
        versions: {
          create: {
            versionNum: 1,
            description: `Cloned from ${source.name} v${sourceVersion.versionNum}`,
            isActive: true,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    const newVersionId = newScenario.versions[0].id;

    // Clone site archetypes
    const archetypeIdMap: Record<string, string> = {};
    for (const arch of sourceVersion.siteArchetypes) {
      const newArch = await prisma.siteArchetype.create({
        data: {
          scenarioVersionId: newVersionId,
          name: arch.name,
          numSites: arch.numSites,
          numCus: arch.numCus,
          description: arch.description,
        },
      });
      archetypeIdMap[arch.id] = newArch.id;
    }

    // Clone DC types
    const dcIdMap: Record<string, string> = {};
    for (const dc of sourceVersion.dcTypes) {
      const newDc = await prisma.dcType.create({
        data: {
          scenarioVersionId: newVersionId,
          name: dc.name,
          numDcs: dc.numDcs,
          description: dc.description,
        },
      });
      dcIdMap[dc.id] = newDc.id;
    }

    // Clone input facts with updated scope IDs
    const inputFactsData = sourceVersion.inputFacts.map(fact => {
      let newScopeId = fact.scopeId;
      if (fact.scopeType === 'site_archetype' && fact.scopeId) {
        newScopeId = archetypeIdMap[fact.scopeId] || null;
      } else if (fact.scopeType === 'dc_type' && fact.scopeId) {
        newScopeId = dcIdMap[fact.scopeId] || null;
      }

      return {
        scenarioVersionId: newVersionId,
        day: fact.day,
        domain: fact.domain,
        layer: fact.layer,
        bucket: fact.bucket,
        scopeType: fact.scopeType,
        scopeId: newScopeId,
        driver: fact.driver,
        valueNumber: fact.valueNumber,
        valueJson: fact.valueJson,
        unit: fact.unit,
        currency: fact.currency,
        notes: fact.notes,
        source: fact.source,
        assumptionFlag: fact.assumptionFlag,
        licenseModel: fact.licenseModel,
        spreadYears: fact.spreadYears,
      };
    });

    if (inputFactsData.length > 0) {
      await prisma.inputFact.createMany({
        data: inputFactsData,
      });
    }

    return NextResponse.json(newScenario, { status: 201 });
  } catch (error) {
    console.error('Error cloning scenario:', error);
    return NextResponse.json({ error: 'Failed to clone scenario' }, { status: 500 });
  }
}

