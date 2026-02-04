import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeAndPersist } from '@/lib/compute/engine';
import prisma from '@/lib/db/client';
import { handleApiError, ApiErrors } from '@/lib/api/errors';

const ComputeRequestSchema = z.object({
  scenarioVersionId: z.string().min(1, 'scenarioVersionId is required'),
});

// POST /api/compute - Compute TCO for a scenario version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = ComputeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { scenarioVersionId } = validation.data;

    // Verify scenario version exists
    const version = await prisma.scenarioVersion.findUnique({
      where: { id: scenarioVersionId },
    });

    if (!version) {
      throw ApiErrors.notFound('Scenario version');
    }

    const result = await computeAndPersist(scenarioVersionId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

