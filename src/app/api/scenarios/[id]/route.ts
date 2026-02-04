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
  } catch {
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
  } catch {
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
            siteArchetypes: {
              include: {
                deploymentSchedule: true,
              },
            },
            dcTypes: true,
          },
        },
      },
    });

    if (!source || source.versions.length === 0) {
      return NextResponse.json({ error: 'Source scenario not found' }, { status: 404 });
    }

    const sourceVersion = source.versions[0];
    if (!sourceVersion) {
      return NextResponse.json({ error: 'Source scenario version not found' }, { status: 404 });
    }

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

    const newVersion = newScenario.versions[0];
    if (!newVersion) {
      return NextResponse.json({ error: 'Failed to create scenario version' }, { status: 500 });
    }
    const newVersionId = newVersion.id;

    // Clone site archetypes using batch insert for better performance
    const archetypeIdMap: Record<string, string> = {};
    if (sourceVersion.siteArchetypes.length > 0) {
      const archetypeData = sourceVersion.siteArchetypes.map((arch: (typeof sourceVersion.siteArchetypes)[number]) => ({
        scenarioVersionId: newVersionId,
        name: arch.name,
        numSites: arch.numSites,
        numCus: arch.numCus,
        numDcs: arch.numDcs,
        description: arch.description,
        deploymentYears: arch.deploymentYears,
      }));

      await prisma.siteArchetype.createMany({ data: archetypeData });

      // Query back to build ID mapping (1 query instead of N)
      const newArchetypes = await prisma.siteArchetype.findMany({
        where: { scenarioVersionId: newVersionId },
        select: { id: true, name: true },
      });

      for (const oldArch of sourceVersion.siteArchetypes) {
        const newArch = newArchetypes.find((a: (typeof newArchetypes)[number]) => a.name === oldArch.name);
        if (newArch) {
          archetypeIdMap[oldArch.id] = newArch.id;
        }
      }

      // Clone deployment schedules
      const deploymentScheduleData = [];
      for (const oldArch of sourceVersion.siteArchetypes) {
        const newArchId = archetypeIdMap[oldArch.id];
        if (newArchId && oldArch.deploymentSchedule) {
          for (const schedule of oldArch.deploymentSchedule) {
            deploymentScheduleData.push({
              archetypeId: newArchId,
              yearIndex: schedule.yearIndex,
              sitesDeployed: schedule.sitesDeployed,
              cusDeployed: schedule.cusDeployed,
              dcsDeployed: schedule.dcsDeployed,
            });
          }
        }
      }
      if (deploymentScheduleData.length > 0) {
        await prisma.deploymentYear.createMany({ data: deploymentScheduleData });
      }
    }

    // Clone DC types using batch insert
    const dcIdMap: Record<string, string> = {};
    if (sourceVersion.dcTypes.length > 0) {
      const dcData = sourceVersion.dcTypes.map(dc => ({
        scenarioVersionId: newVersionId,
        name: dc.name,
        numDcs: dc.numDcs,
        description: dc.description,
      }));

      await prisma.dcType.createMany({ data: dcData });

      // Query back to build ID mapping (1 query instead of N)
      const newDcTypes = await prisma.dcType.findMany({
        where: { scenarioVersionId: newVersionId },
        select: { id: true, name: true },
      });

      for (const oldDc of sourceVersion.dcTypes) {
        const newDc = newDcTypes.find((d: (typeof newDcTypes)[number]) => d.name === oldDc.name);
        if (newDc) {
          dcIdMap[oldDc.id] = newDc.id;
        }
      }
    }

    // Clone input facts with updated scope IDs
    const inputFactsData = sourceVersion.inputFacts.map((fact: (typeof sourceVersion.inputFacts)[number]) => {
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
  } catch {
    return NextResponse.json({ error: 'Failed to clone scenario' }, { status: 500 });
  }
}

