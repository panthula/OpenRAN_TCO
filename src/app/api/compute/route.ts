import { NextRequest, NextResponse } from 'next/server';
import { computeAndPersist } from '@/lib/compute/engine';

// POST /api/compute - Compute TCO for a scenario version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioVersionId } = body;

    if (!scenarioVersionId) {
      return NextResponse.json({ error: 'scenarioVersionId is required' }, { status: 400 });
    }

    const result = await computeAndPersist(scenarioVersionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error computing TCO:', error);
    return NextResponse.json({ error: 'Failed to compute TCO' }, { status: 500 });
  }
}

