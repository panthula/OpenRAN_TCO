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
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(archetypes);
  } catch (error) {
    console.error('Error fetching site archetypes:', error);
    return NextResponse.json({ error: 'Failed to fetch site archetypes' }, { status: 500 });
  }
}

// POST /api/site-archetypes - Create or update a site archetype
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SiteArchetypeSchema.parse(body);

    let result;
    if (validated.id) {
      result = await prisma.siteArchetype.update({
        where: { id: validated.id },
        data: {
          name: validated.name,
          numSites: validated.numSites,
          numCus: validated.numCus,
          description: validated.description,
        },
      });
    } else {
      result = await prisma.siteArchetype.create({
        data: {
          scenarioVersionId: validated.scenarioVersionId,
          name: validated.name,
          numSites: validated.numSites,
          numCus: validated.numCus,
          description: validated.description,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving site archetype:', error);
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

    await prisma.siteArchetype.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site archetype:', error);
    return NextResponse.json({ error: 'Failed to delete site archetype' }, { status: 500 });
  }
}

