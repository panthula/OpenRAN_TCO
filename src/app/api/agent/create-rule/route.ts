import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

interface Change {
  operation: 'update' | 'add' | 'delete';
  bucket: string;
  day?: string;
  domain?: string;
  layer?: string;
  scopeType?: string;
  scopeId?: string;
  currentValue?: number;
  proposedValue?: number;
  percentageChange?: number;
  reason?: string;
}

// POST /api/agent/create-rule - Create an AdjustmentSet from a ChangeSet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { changeSetId, name, description, makeActive } = body;

    if (!changeSetId) {
      return NextResponse.json({ error: 'changeSetId is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Get the change set
    const changeSet = await prisma.changeSet.findUnique({
      where: { id: changeSetId },
      include: {
        scenarioVersion: true,
      },
    });

    if (!changeSet) {
      return NextResponse.json({ error: 'ChangeSet not found' }, { status: 404 });
    }

    let changes: Change[];
    try {
      changes = JSON.parse(changeSet.changes);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid change set data format' },
        { status: 400 }
      );
    }

    if (!changes || changes.length === 0) {
      return NextResponse.json({ error: 'ChangeSet has no changes' }, { status: 400 });
    }

    // Build the rules to create
    const rulesToCreate = changes
      .filter((change) => change.operation === 'update')
      .map((change, index) => {
        // Determine adjustment type and value
        let adjustmentType: string;
        let adjustmentValue: number;

        if (change.percentageChange !== undefined) {
          // Percentage-based change
          adjustmentType = 'percentage';
          adjustmentValue = change.percentageChange;
        } else if (change.proposedValue !== undefined && change.currentValue !== undefined && change.currentValue !== 0) {
          // Calculate percentage from absolute values
          const pctChange = ((change.proposedValue - change.currentValue) / change.currentValue) * 100;
          adjustmentType = 'percentage';
          adjustmentValue = pctChange;
        } else if (change.proposedValue !== undefined) {
          // Use absolute replacement value
          adjustmentType = 'replace';
          adjustmentValue = change.proposedValue;
        } else {
          // Skip if we can't determine the adjustment
          return null;
        }

        return {
          targetDay: change.day || null,
          targetDomain: change.domain || null,
          targetLayer: change.layer || null,
          targetBucket: change.bucket,
          targetScopeType: change.scopeType || null,
          targetScopeId: change.scopeId || null,
          adjustmentType,
          adjustmentValue,
          priority: index,
          notes: change.reason || `AI-generated: ${changeSet.rationale || 'optimization'}`,
        };
      })
      .filter(Boolean) as Array<{
        targetDay: string | null;
        targetDomain: string | null;
        targetLayer: string | null;
        targetBucket: string;
        targetScopeType: string | null;
        targetScopeId: string | null;
        adjustmentType: string;
        adjustmentValue: number;
        priority: number;
        notes: string;
      }>;

    if (rulesToCreate.length === 0) {
      return NextResponse.json(
        { error: 'No valid adjustment rules could be created from the changes' },
        { status: 400 }
      );
    }

    // Create the AdjustmentSet with rules
    const adjustmentSet = await prisma.adjustmentSet.create({
      data: {
        scenarioVersionId: changeSet.scenarioVersionId,
        name: name.trim(),
        description: description?.trim() || `Created from AI agent proposal: ${changeSet.rationale || 'optimization'}`,
        isActive: makeActive !== false, // Default to active
        rules: {
          create: rulesToCreate,
        },
      },
      include: {
        rules: true,
      },
    });

    return NextResponse.json({
      success: true,
      id: adjustmentSet.id,
      name: adjustmentSet.name,
      description: adjustmentSet.description,
      isActive: adjustmentSet.isActive,
      rulesCreated: adjustmentSet.rules.length,
      rules: adjustmentSet.rules.map((rule: { id: string; targetBucket: string | null; adjustmentType: string; adjustmentValue: number; notes: string | null }) => ({
        id: rule.id,
        targetBucket: rule.targetBucket,
        adjustmentType: rule.adjustmentType,
        adjustmentValue: rule.adjustmentValue,
        notes: rule.notes,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create adjustment rule: ${message}` },
      { status: 500 }
    );
  }
}
