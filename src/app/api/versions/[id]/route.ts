import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

// GET /api/versions/[id] - Get a specific scenario version with all data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const version = await prisma.scenarioVersion.findUnique({
      where: { id },
      include: {
        scenario: true,
        siteArchetypes: true,
        dcTypes: true,
        inputFacts: {
          orderBy: [
            { day: 'asc' },
            { domain: 'asc' },
            { layer: 'asc' },
            { bucket: 'asc' },
          ],
        },
        computedFacts: {
          orderBy: { year: 'asc' },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 });
  }
}

