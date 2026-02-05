import { NextRequest, NextResponse } from 'next/server';
import { applyChangeSet } from '@/lib/api/agent/apply-changes';
import { handleApiError, ApiErrors, validateRequired, parseJsonBody } from '@/lib/api/errors';

interface ApplyRequest {
  changeSetId: string;
}

// POST /api/agent/apply - Apply an approved change set
export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<ApplyRequest>(request);
    validateRequired(body, ['changeSetId']);

    const result = await applyChangeSet(body.changeSetId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
