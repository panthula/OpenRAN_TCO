import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { computeAndPersist } from '@/lib/compute/engine';

// POST /api/agent/apply - Apply an approved change set
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { changeSetId } = body;

    if (!changeSetId) {
      return NextResponse.json({ error: 'changeSetId is required' }, { status: 400 });
    }

    // Get the change set
    const changeSet = await prisma.changeSet.findUnique({
      where: { id: changeSetId },
      include: {
        scenarioVersion: {
          include: {
            scenario: true,
            inputFacts: true,
            siteArchetypes: true,
            dcTypes: true,
          },
        },
      },
    });

    if (!changeSet) {
      return NextResponse.json({ error: 'ChangeSet not found' }, { status: 404 });
    }

    if (changeSet.status !== 'proposed') {
      return NextResponse.json(
        { error: `ChangeSet is already ${changeSet.status}` },
        { status: 400 }
      );
    }

    const sourceVersion = changeSet.scenarioVersion;
    const changes = JSON.parse(changeSet.changes);

    // Create new version
    const newVersion = await prisma.scenarioVersion.create({
      data: {
        scenarioId: sourceVersion.scenarioId,
        versionNum: sourceVersion.versionNum + 1,
        description: `Applied agent changes: ${changeSet.rationale || 'AI optimization'}`,
        isActive: true,
      },
    });

    // Mark old version as inactive
    await prisma.scenarioVersion.update({
      where: { id: sourceVersion.id },
      data: { isActive: false },
    });

    // Copy site archetypes
    const archetypeIdMap: Record<string, string> = {};
    for (const arch of sourceVersion.siteArchetypes) {
      const newArch = await prisma.siteArchetype.create({
        data: {
          scenarioVersionId: newVersion.id,
          name: arch.name,
          numSites: arch.numSites,
          numCus: arch.numCus,
          description: arch.description,
        },
      });
      archetypeIdMap[arch.id] = newArch.id;
    }

    // Copy DC types
    const dcIdMap: Record<string, string> = {};
    for (const dc of sourceVersion.dcTypes) {
      const newDc = await prisma.dcType.create({
        data: {
          scenarioVersionId: newVersion.id,
          name: dc.name,
          numDcs: dc.numDcs,
          description: dc.description,
        },
      });
      dcIdMap[dc.id] = newDc.id;
    }

    // Copy input facts with modifications
    for (const fact of sourceVersion.inputFacts) {
      // Check if this fact should be modified
      let value = fact.valueNumber;
      for (const change of changes) {
        if (change.bucket === fact.bucket) {
          if (change.operation === 'update') {
            value = change.proposedValue;
          } else if (change.operation === 'delete') {
            continue; // Skip this fact
          }
        }
      }

      // Map scope ID to new version
      let newScopeId = fact.scopeId;
      if (fact.scopeType === 'site_archetype' && fact.scopeId) {
        newScopeId = archetypeIdMap[fact.scopeId] || null;
      } else if (fact.scopeType === 'dc_type' && fact.scopeId) {
        newScopeId = dcIdMap[fact.scopeId] || null;
      }

      await prisma.inputFact.create({
        data: {
          scenarioVersionId: newVersion.id,
          day: fact.day,
          domain: fact.domain,
          layer: fact.layer,
          bucket: fact.bucket,
          scopeType: fact.scopeType,
          scopeId: newScopeId,
          driver: fact.driver,
          valueNumber: value,
          valueJson: fact.valueJson,
          unit: fact.unit,
          currency: fact.currency,
          notes: fact.notes,
          source: fact.source,
          assumptionFlag: fact.assumptionFlag,
          licenseModel: fact.licenseModel,
          spreadYears: fact.spreadYears,
        },
      });
    }

    // Handle 'add' operations
    for (const change of changes) {
      if (change.operation === 'add' && change.inputData) {
        await prisma.inputFact.create({
          data: {
            scenarioVersionId: newVersion.id,
            ...change.inputData,
          },
        });
      }
    }

    // Recompute TCO
    const result = await computeAndPersist(newVersion.id);

    // Update change set status
    await prisma.changeSet.update({
      where: { id: changeSetId },
      data: {
        status: 'applied',
        appliedAt: new Date(),
        resultVersionId: newVersion.id,
      },
    });

    return NextResponse.json({
      success: true,
      newVersionId: newVersion.id,
      newVersionNum: newVersion.versionNum,
      computeResult: {
        totalCapex: result.totalCapex,
        totalOpex: result.totalOpex,
        totalTco: result.totalTco,
        totalNpv: result.totalNpv,
      },
    });
  } catch (error) {
    console.error('Error applying changes:', error);
    return NextResponse.json({ error: 'Failed to apply changes' }, { status: 500 });
  }
}

