import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { computeAndPersist } from '@/lib/compute/engine';

// GET /api/sweeps - Get sweeps for a scenario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get('scenarioId');

    if (!scenarioId) {
      return NextResponse.json({ error: 'scenarioId is required' }, { status: 400 });
    }

    const sweeps = await prisma.sweepDefinition.findMany({
      where: { scenarioId },
      include: {
        runs: {
          orderBy: { runIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sweeps);
  } catch (error) {
    console.error('Error fetching sweeps:', error);
    return NextResponse.json({ error: 'Failed to fetch sweeps' }, { status: 500 });
  }
}

// POST /api/sweeps - Create a new sweep definition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioId, name, description, parameters } = body;

    if (!scenarioId || !name || !parameters) {
      return NextResponse.json(
        { error: 'scenarioId, name, and parameters are required' },
        { status: 400 }
      );
    }

    const sweep = await prisma.sweepDefinition.create({
      data: {
        scenarioId,
        name,
        description,
        parameters: JSON.stringify(parameters),
      },
    });

    return NextResponse.json(sweep, { status: 201 });
  } catch (error) {
    console.error('Error creating sweep:', error);
    return NextResponse.json({ error: 'Failed to create sweep' }, { status: 500 });
  }
}

