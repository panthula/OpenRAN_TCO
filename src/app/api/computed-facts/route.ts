import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';

// GET /api/computed-facts - Query computed facts for dashboards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioVersionId = searchParams.get('versionId');
    const metric = searchParams.get('metric');
    const day = searchParams.get('day');
    const domain = searchParams.get('domain');
    const year = searchParams.get('year');

    if (!scenarioVersionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { scenarioVersionId };
    if (metric) where.metric = metric;
    if (day) where.day = day;
    if (domain) where.domain = domain;
    if (year) where.year = parseInt(year, 10);

    const facts = await prisma.computedFact.findMany({
      where,
      orderBy: [
        { year: 'asc' },
        { metric: 'asc' },
      ],
    });

    return NextResponse.json(facts);
  } catch (error) {
    console.error('Error fetching computed facts:', error);
    return NextResponse.json({ error: 'Failed to fetch computed facts' }, { status: 500 });
  }
}

