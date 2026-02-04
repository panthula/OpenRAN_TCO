import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { AdjustmentSetSchema } from '@/lib/model/validation';
import { handleApiError, ApiErrors } from '@/lib/api/errors';

// GET /api/adjustments - Get adjustment sets for a version
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!versionId) {
      throw ApiErrors.badRequest('versionId is required');
    }

    const where: Record<string, unknown> = { scenarioVersionId: versionId };
    if (activeOnly) {
      where.isActive = true;
    }

    const adjustmentSets = await prisma.adjustmentSet.findMany({
      where,
      include: {
        rules: {
          orderBy: { priority: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(adjustmentSets);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/adjustments - Create or update adjustment set with rules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = AdjustmentSetSchema.parse(body);

    if (data.id) {
      // Update existing adjustment set
      const updated = await prisma.adjustmentSet.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          rules: data.rules
            ? {
                deleteMany: {},
                create: data.rules.map((rule, idx) => ({
                  targetDay: rule.targetDay,
                  targetDomain: rule.targetDomain,
                  targetLayer: rule.targetLayer,
                  targetBucket: rule.targetBucket,
                  targetScopeType: rule.targetScopeType,
                  targetScopeId: rule.targetScopeId,
                  adjustmentType: rule.adjustmentType,
                  adjustmentValue: rule.adjustmentValue,
                  priority: rule.priority ?? idx,
                  notes: rule.notes,
                })),
              }
            : undefined,
        },
        include: {
          rules: {
            orderBy: { priority: 'asc' },
          },
        },
      });
      return NextResponse.json(updated);
    } else {
      // Create new adjustment set
      const created = await prisma.adjustmentSet.create({
        data: {
          scenarioVersionId: data.scenarioVersionId,
          name: data.name,
          description: data.description,
          isActive: data.isActive ?? true,
          rules: data.rules
            ? {
                create: data.rules.map((rule, idx) => ({
                  targetDay: rule.targetDay,
                  targetDomain: rule.targetDomain,
                  targetLayer: rule.targetLayer,
                  targetBucket: rule.targetBucket,
                  targetScopeType: rule.targetScopeType,
                  targetScopeId: rule.targetScopeId,
                  adjustmentType: rule.adjustmentType,
                  adjustmentValue: rule.adjustmentValue,
                  priority: rule.priority ?? idx,
                  notes: rule.notes,
                })),
              }
            : undefined,
        },
        include: {
          rules: {
            orderBy: { priority: 'asc' },
          },
        },
      });
      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/adjustments - Delete an adjustment set
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw ApiErrors.badRequest('id is required');
    }

    await prisma.adjustmentSet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/adjustments - Toggle active status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      throw ApiErrors.badRequest('id is required');
    }

    if (typeof isActive !== 'boolean') {
      throw ApiErrors.badRequest('isActive must be a boolean');
    }

    const updated = await prisma.adjustmentSet.update({
      where: { id },
      data: { isActive },
      include: {
        rules: {
          orderBy: { priority: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
