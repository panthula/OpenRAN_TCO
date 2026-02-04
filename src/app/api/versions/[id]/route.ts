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
        scenario: {
          select: {
            id: true,
            name: true,
            description: true,
            isBaseline: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        siteArchetypes: {
          select: {
            id: true,
            name: true,
            numSites: true,
            numCus: true,
            numDcs: true,
            numDusPerSite: true,
            description: true,
            deploymentYears: true,
            deploymentSchedule: {
              orderBy: { yearIndex: 'asc' },
              select: {
                id: true,
                yearIndex: true,
                sitesDeployed: true,
                cusDeployed: true,
                dcsDeployed: true,
              },
            },
          },
        },
        dcTypes: {
          select: {
            id: true,
            name: true,
            numDcs: true,
            description: true,
          },
        },
        inputFacts: {
          select: {
            id: true,
            day: true,
            domain: true,
            layer: true,
            bucket: true,
            scopeType: true,
            scopeId: true,
            driver: true,
            valueNumber: true,
            valueJson: true,
            licenseModel: true,
            notes: true,
          },
          orderBy: [
            { day: 'asc' },
            { domain: 'asc' },
            { layer: 'asc' },
            { bucket: 'asc' },
          ],
        },
        computedFacts: {
          select: {
            id: true,
            metric: true,
            day: true,
            domain: true,
            layer: true,
            bucket: true,
            year: true,
            capex: true,
            opex: true,
            tco: true,
            npv: true,
          },
          orderBy: { year: 'asc' },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json(version);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 });
  }
}

