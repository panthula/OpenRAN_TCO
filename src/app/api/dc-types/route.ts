import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { DcTypeSchema } from '@/lib/model/validation';

// GET /api/dc-types - Get DC types for a version
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioVersionId = searchParams.get('versionId');

    if (!scenarioVersionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    const dcTypes = await prisma.dcType.findMany({
      where: { scenarioVersionId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(dcTypes);
  } catch (error) {
    console.error('Error fetching DC types:', error);
    return NextResponse.json({ error: 'Failed to fetch DC types' }, { status: 500 });
  }
}

// POST /api/dc-types - Update a DC type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = DcTypeSchema.parse(body);

    let result;
    if (validated.id) {
      result = await prisma.dcType.update({
        where: { id: validated.id },
        data: {
          numDcs: validated.numDcs,
          description: validated.description,
        },
      });
    } else {
      result = await prisma.dcType.create({
        data: {
          scenarioVersionId: validated.scenarioVersionId,
          name: validated.name,
          numDcs: validated.numDcs,
          description: validated.description,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving DC type:', error);
    return NextResponse.json({ error: 'Failed to save DC type' }, { status: 500 });
  }
}

