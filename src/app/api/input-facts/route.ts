import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { InputFactSchema } from '@/lib/model/validation';
import { z } from 'zod';
import { handleApiError, ApiErrors } from '@/lib/api/errors';

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
      throw ApiErrors.badRequest('versionId is required');
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
    return handleApiError(error);
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
    return handleApiError(error);
  }
}

// DELETE /api/input-facts - Delete input facts
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw ApiErrors.badRequest('id is required');
    }

    await prisma.inputFact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
