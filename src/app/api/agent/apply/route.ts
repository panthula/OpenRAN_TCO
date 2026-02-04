import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { computeAndPersist } from '@/lib/compute/engine';

interface Change {
  operation: 'update' | 'add' | 'delete';
  bucket: string;
  day?: string;           // Optional: for precise targeting
  domain?: string;        // Optional: for precise targeting
  scopeType?: string;     // Optional: for precise targeting
  scopeId?: string;       // Optional: for specific scope
  currentValue?: number;
  proposedValue?: number;
  percentageChange?: number; // e.g., -15 for 15% reduction
  reason?: string;
  inputData?: Record<string, unknown>; // For 'add' operations
}

// Check if a change matches a fact based on available criteria
function changeMatchesFact(
  change: Change,
  fact: { bucket: string; day: string; domain: string; scopeType: string; scopeId: string | null }
): boolean {
  // Bucket must always match
  if (change.bucket !== fact.bucket) return false;

  // Optional: match by day if specified
  if (change.day && change.day !== fact.day) return false;

  // Optional: match by domain if specified
  if (change.domain && change.domain !== fact.domain) return false;

  // Optional: match by scopeType if specified
  if (change.scopeType && change.scopeType !== fact.scopeType) return false;

  // Optional: match by scopeId if specified (null matches null)
  if (change.scopeId !== undefined && change.scopeId !== fact.scopeId) return false;

  return true;
}

// Calculate the new value based on change type
function calculateNewValue(change: Change, currentValue: number): number {
  if (change.percentageChange !== undefined) {
    // Percentage-based change (e.g., -15 = reduce by 15%)
    return currentValue * (1 + change.percentageChange / 100);
  } else if (change.proposedValue !== undefined) {
    // Absolute value replacement
    return change.proposedValue;
  }
  return currentValue;
}

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
    let changes: Change[];
    try {
      changes = JSON.parse(changeSet.changes);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid change set data format' },
        { status: 400 }
      );
    }

    // Track applied changes for summary
    const appliedChanges: { bucket: string; originalValue: number; newValue: number; change: string }[] = [];

    // Create NEW scenario with its own version (instead of new version in same scenario)
    const newScenario = await prisma.scenario.create({
      data: {
        name: `${sourceVersion.scenario.name} - Agent Optimized`,
        description: `Created from ${sourceVersion.scenario.name} via AI Agent`,
        isBaseline: false,
        parentId: sourceVersion.scenarioId,
        versions: {
          create: {
            versionNum: 1,
            description: `Applied agent changes: ${changeSet.rationale || 'AI optimization'}`,
            isActive: true,
          },
        },
      },
      include: { versions: true },
    });

    const newVersion = newScenario.versions[0];

    // DO NOT mark source version as inactive - leave baseline untouched

    // Copy site archetypes with all fields and deployment schedules
    const archetypeIdMap: Record<string, string> = {};
    for (const arch of sourceVersion.siteArchetypes) {
      const newArch = await prisma.siteArchetype.create({
        data: {
          scenarioVersionId: newVersion.id,
          name: arch.name,
          numSites: arch.numSites,
          numCus: arch.numCus,
          numDcs: arch.numDcs,
          numDusPerSite: arch.numDusPerSite,
          description: arch.description,
          deploymentYears: arch.deploymentYears,
        },
      });
      archetypeIdMap[arch.id] = newArch.id;

      // Copy deployment schedule
      for (const depYear of arch.deploymentSchedule) {
        await prisma.deploymentYear.create({
          data: {
            archetypeId: newArch.id,
            yearIndex: depYear.yearIndex,
            sitesDeployed: depYear.sitesDeployed,
            cusDeployed: depYear.cusDeployed,
            dcsDeployed: depYear.dcsDeployed,
          },
        });
      }
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
      let value = fact.valueNumber;
      let shouldSkip = false;

      // Check all changes to see if any match this fact
      for (const change of changes) {
        if (changeMatchesFact(change, fact)) {
          if (change.operation === 'update') {
            const newValue = calculateNewValue(change, fact.valueNumber);
            appliedChanges.push({
              bucket: fact.bucket,
              originalValue: fact.valueNumber,
              newValue,
              change: change.percentageChange !== undefined
                ? `${change.percentageChange}%`
                : `$${fact.valueNumber} → $${newValue}`,
            });
            value = newValue;
          } else if (change.operation === 'delete') {
            shouldSkip = true;
            break;
          }
        }
      }

      if (shouldSkip) continue;

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
        const inputData = change.inputData as {
          day: string;
          domain: string;
          layer: string;
          bucket: string;
          scopeType: string;
          scopeId?: string;
          driver: string;
          valueNumber: number;
          unit?: string;
          currency?: string;
          notes?: string;
        };
        await prisma.inputFact.create({
          data: {
            scenarioVersionId: newVersion.id,
            day: inputData.day,
            domain: inputData.domain,
            layer: inputData.layer,
            bucket: inputData.bucket,
            scopeType: inputData.scopeType,
            scopeId: inputData.scopeId || null,
            driver: inputData.driver,
            valueNumber: inputData.valueNumber,
            unit: inputData.unit || 'USD',
            currency: inputData.currency || 'USD',
            notes: inputData.notes || null,
          },
        });
        appliedChanges.push({
          bucket: change.bucket,
          originalValue: 0,
          newValue: inputData.valueNumber || 0,
          change: 'Added new',
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
      newScenarioId: newScenario.id,
      newScenarioName: newScenario.name,
      newVersionId: newVersion.id,
      newVersionNum: newVersion.versionNum,
      appliedChanges,
      computeResult: {
        totalCapex: result.totalCapex,
        totalOpex: result.totalOpex,
        totalTco: result.totalTco,
        totalNpv: result.totalNpv,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to apply changes: ${message}` },
      { status: 500 }
    );
  }
}

