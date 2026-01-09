import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { computeAndPersist } from '@/lib/compute/engine';

// POST /api/sweeps/[id]/run - Execute a sweep
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the sweep definition
    const sweep = await prisma.sweepDefinition.findUnique({
      where: { id },
      include: {
        scenario: {
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
        },
      },
    });

    if (!sweep || sweep.scenario.versions.length === 0) {
      return NextResponse.json({ error: 'Sweep or scenario not found' }, { status: 404 });
    }

    const baseVersion = sweep.scenario.versions[0];
    const parameters = JSON.parse(sweep.parameters);

    // Generate parameter combinations
    const combinations = generateCombinations(parameters);
    const runs = [];

    for (let i = 0; i < combinations.length; i++) {
      const paramValues = combinations[i];

      // Create a new version for this run
      const newVersion = await prisma.scenarioVersion.create({
        data: {
          scenarioId: sweep.scenarioId,
          versionNum: baseVersion.versionNum + i + 1,
          description: `Sweep run ${i + 1}: ${JSON.stringify(paramValues)}`,
          isActive: false, // Mark as sweep result, not active
        },
      });

      // Copy archetypes
      for (const arch of baseVersion.siteArchetypes) {
        await prisma.siteArchetype.create({
          data: {
            scenarioVersionId: newVersion.id,
            name: arch.name,
            numSites: arch.numSites,
            numCus: arch.numCus,
            description: arch.description,
          },
        });
      }

      // Copy DC types
      for (const dc of baseVersion.dcTypes) {
        await prisma.dcType.create({
          data: {
            scenarioVersionId: newVersion.id,
            name: dc.name,
            numDcs: dc.numDcs,
            description: dc.description,
          },
        });
      }

      // Copy input facts with modifications
      for (const fact of baseVersion.inputFacts) {
        let value = fact.valueNumber;

        // Check if this fact should be modified
        for (const param of parameters) {
          if (fact.bucket === param.bucket) {
            value = paramValues[param.bucket];
            break;
          }
        }

        await prisma.inputFact.create({
          data: {
            scenarioVersionId: newVersion.id,
            day: fact.day,
            domain: fact.domain,
            layer: fact.layer,
            bucket: fact.bucket,
            scopeType: fact.scopeType,
            scopeId: null, // Reset scope for simplicity
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

      // Compute TCO for this run
      const result = await computeAndPersist(newVersion.id);

      // Create sweep run record
      const run = await prisma.sweepRun.create({
        data: {
          sweepDefinitionId: id,
          scenarioVersionId: newVersion.id,
          runIndex: i,
          parameterValues: JSON.stringify(paramValues),
          results: JSON.stringify({
            totalCapex: result.totalCapex,
            totalOpex: result.totalOpex,
            totalTco: result.totalTco,
            totalNpv: result.totalNpv,
          }),
        },
      });

      runs.push(run);
    }

    return NextResponse.json({ sweepId: id, runs });
  } catch (error) {
    console.error('Error running sweep:', error);
    return NextResponse.json({ error: 'Failed to run sweep' }, { status: 500 });
  }
}

// Generate all combinations of parameter values
function generateCombinations(
  parameters: Array<{ bucket: string; minValue: number; maxValue: number; steps: number }>
): Record<string, number>[] {
  if (parameters.length === 0) return [{}];

  const combinations: Record<string, number>[] = [];

  // Generate values for first parameter
  const param = parameters[0];
  const step = (param.maxValue - param.minValue) / (param.steps - 1);
  const values: number[] = [];

  for (let i = 0; i < param.steps; i++) {
    values.push(param.minValue + step * i);
  }

  // Get combinations for remaining parameters
  const restCombinations = generateCombinations(parameters.slice(1));

  // Combine
  for (const value of values) {
    for (const rest of restCombinations) {
      combinations.push({
        [param.bucket]: value,
        ...rest,
      });
    }
  }

  return combinations;
}

