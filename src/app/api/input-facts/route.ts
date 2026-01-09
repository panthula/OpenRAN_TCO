import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { InputFactSchema } from '@/lib/model/validation';
import { z, ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// GET /api/input-facts - Query input facts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioVersionId = searchParams.get('versionId');
    const day = searchParams.get('day');
    const domain = searchParams.get('domain');
    const layer = searchParams.get('layer');
    const bucket = searchParams.get('bucket');
    const scopeType = searchParams.get('scopeType');
    const scopeId = searchParams.get('scopeId');

    if (!scenarioVersionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { scenarioVersionId };
    if (day) where.day = day;
    if (domain) where.domain = domain;
    if (layer) where.layer = layer;
    if (bucket) where.bucket = bucket;
    if (scopeType) where.scopeType = scopeType;
    if (scopeId) where.scopeId = scopeId;

    const facts = await prisma.inputFact.findMany({
      where,
      orderBy: [
        { day: 'asc' },
        { domain: 'asc' },
        { layer: 'asc' },
        { bucket: 'asc' },
      ],
    });

    return NextResponse.json(facts);
  } catch (error) {
    console.error('Error fetching input facts:', error);
    return NextResponse.json({ error: 'Failed to fetch input facts' }, { status: 500 });
  }
}

// POST /api/input-facts - Create or update input facts (bulk)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const facts = z.array(InputFactSchema).parse(body);

    const results = [];
    for (const fact of facts) {
      if (fact.id) {
        // Update existing
        const updated = await prisma.inputFact.update({
          where: { id: fact.id },
          data: {
            valueNumber: fact.valueNumber,
            valueJson: fact.valueJson,
            notes: fact.notes,
            source: fact.source,
            assumptionFlag: fact.assumptionFlag,
            licenseModel: fact.licenseModel,
            spreadYears: fact.spreadYears,
          },
        });
        results.push(updated);
      } else {
        // Create new
        const created = await prisma.inputFact.create({
          data: {
            scenarioVersionId: fact.scenarioVersionId,
            day: fact.day,
            domain: fact.domain,
            layer: fact.layer,
            bucket: fact.bucket,
            scopeType: fact.scopeType,
            scopeId: fact.scopeId || null,
            driver: fact.driver,
            valueNumber: fact.valueNumber,
            valueJson: fact.valueJson,
            unit: fact.unit,
            currency: fact.currency,
            notes: fact.notes,
            source: fact.source,
            assumptionFlag: fact.assumptionFlag,
            licenseModel: fact.licenseModel,
            spreadYears: fact.spreadYears,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error saving input facts:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details = error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return NextResponse.json(
        { error: 'Validation failed', details },
        { status: 400 }
      );
    }

    // Handle Prisma known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError: { error: string; code: string; meta?: unknown } = {
        error: 'Database operation failed',
        code: error.code,
      };
      // Common Prisma error codes
      if (error.code === 'P2002') {
        prismaError.error = 'A record with this unique constraint already exists';
      } else if (error.code === 'P2025') {
        prismaError.error = 'Record not found for update';
      } else if (error.code === 'P2003') {
        prismaError.error = 'Foreign key constraint failed - referenced record does not exist';
      }
      // Include meta in dev for debugging
      if (process.env.NODE_ENV === 'development') {
        prismaError.meta = error.meta;
      }
      return NextResponse.json(prismaError, { status: 500 });
    }

    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: 'Invalid data format for database operation', details: error.message },
        { status: 400 }
      );
    }

    // Generic error fallback
    const message = error instanceof Error ? error.message : 'Failed to save input facts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/input-facts - Delete input facts
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.inputFact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting input fact:', error);
    return NextResponse.json({ error: 'Failed to delete input fact' }, { status: 500 });
  }
}

