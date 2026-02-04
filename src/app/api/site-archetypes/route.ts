import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { SiteArchetypeSchema } from '@/lib/model/validation';

// GET /api/site-archetypes - Get site archetypes for a version
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioVersionId = searchParams.get('versionId');

    if (!scenarioVersionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    const archetypes = await prisma.siteArchetype.findMany({
      where: { scenarioVersionId },
      include: {
        deploymentSchedule: {
          orderBy: { yearIndex: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(archetypes);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch site archetypes' }, { status: 500 });
  }
}

// POST /api/site-archetypes - Create or update a site archetype
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SiteArchetypeSchema.parse(body);

    // If deployment schedule is provided, derive totals from it
    let numSites = validated.numSites;
    let numCus = validated.numCus;
    let numDcs = validated.numDcs;
    const numDusPerSite = validated.numDusPerSite ?? 1;
    const deploymentSchedule = validated.deploymentSchedule;

    if (deploymentSchedule && deploymentSchedule.length > 0) {
      numSites = deploymentSchedule.reduce((sum, y) => sum + y.sitesDeployed, 0);
      numCus = deploymentSchedule.reduce((sum, y) => sum + y.cusDeployed, 0);
      numDcs = deploymentSchedule.reduce((sum, y) => sum + y.dcsDeployed, 0);
    }

    let result;
    if (validated.id) {
      // Update existing archetype
      result = await prisma.siteArchetype.update({
        where: { id: validated.id },
        data: {
          name: validated.name,
          numSites,
          numCus,
          numDcs,
          numDusPerSite,
          description: validated.description,
          deploymentYears: validated.deploymentYears,
        },
        include: {
          deploymentSchedule: {
            orderBy: { yearIndex: 'asc' },
          },
        },
      });

      // Update deployment schedule if provided
      if (deploymentSchedule) {
        // Delete existing schedule
        await prisma.deploymentYear.deleteMany({
          where: { archetypeId: validated.id },
        });

        // Create new schedule
        if (deploymentSchedule.length > 0) {
          await prisma.deploymentYear.createMany({
            data: deploymentSchedule.map((year) => ({
              archetypeId: validated.id!,
              yearIndex: year.yearIndex,
              sitesDeployed: year.sitesDeployed,
              cusDeployed: year.cusDeployed,
              dcsDeployed: year.dcsDeployed,
            })),
          });
        }

        // Fetch updated result with schedule
        result = await prisma.siteArchetype.findUnique({
          where: { id: validated.id },
          include: {
            deploymentSchedule: {
              orderBy: { yearIndex: 'asc' },
            },
          },
        });
      }
    } else {
      // Create new archetype
      result = await prisma.siteArchetype.create({
        data: {
          scenarioVersionId: validated.scenarioVersionId,
          name: validated.name,
          numSites,
          numCus,
          numDcs,
          numDusPerSite,
          description: validated.description,
          deploymentYears: validated.deploymentYears,
        },
        include: {
          deploymentSchedule: {
            orderBy: { yearIndex: 'asc' },
          },
        },
      });

      // Create deployment schedule if provided
      if (deploymentSchedule && deploymentSchedule.length > 0) {
        await prisma.deploymentYear.createMany({
          data: deploymentSchedule.map((year) => ({
            archetypeId: result!.id,
            yearIndex: year.yearIndex,
            sitesDeployed: year.sitesDeployed,
            cusDeployed: year.cusDeployed,
            dcsDeployed: year.dcsDeployed,
          })),
        });

        // Fetch updated result with schedule
        result = await prisma.siteArchetype.findUnique({
          where: { id: result!.id },
          include: {
            deploymentSchedule: {
              orderBy: { yearIndex: 'asc' },
            },
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to save site archetype' }, { status: 500 });
  }
}

// DELETE /api/site-archetypes
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Also delete associated input facts
    await prisma.inputFact.deleteMany({
      where: { scopeId: id, scopeType: 'site_archetype' },
    });

    // DeploymentYear records will be cascade deleted due to onDelete: Cascade
    await prisma.siteArchetype.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete site archetype' }, { status: 500 });
  }
}
