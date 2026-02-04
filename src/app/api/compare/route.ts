import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { handleApiError, ApiErrors } from '@/lib/api/errors';

interface ComputedSummary {
  totalCapex: number;
  totalOpex: number;
  totalTco: number;
  totalNpv: number;
  byYear: { year: number; capex: number; opex: number; tco: number; npv: number }[];
  byDayDomain?: Record<string, { capex: number; opex: number; tco: number }>;
}

interface ScenarioComparisonData {
  id: string;
  name: string;
  description: string | null;
  isBaseline: boolean;
  versionId: string;
  versionNum: number;
  summary: ComputedSummary | null;
}

// GET /api/compare?ids=uuid1,uuid2
// Returns computed summaries for selected scenarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'ids parameter is required (comma-separated scenario IDs)' },
        { status: 400 }
      );
    }

    const scenarioIds = idsParam.split(',').map(id => id.trim()).filter(Boolean);

    if (scenarioIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 scenario IDs are required for comparison' },
        { status: 400 }
      );
    }

    if (scenarioIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 scenarios can be compared at once' },
        { status: 400 }
      );
    }

    // Fetch scenarios with their active versions
    const scenarios = await prisma.scenario.findMany({
      where: {
        id: { in: scenarioIds },
      },
      include: {
        versions: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (scenarios.length !== scenarioIds.length) {
      const foundIds = new Set(scenarios.map(s => s.id));
      const missingIds = scenarioIds.filter(id => !foundIds.has(id));
      throw ApiErrors.notFound(`Scenarios with IDs: ${missingIds.join(', ')}`);
    }

    // For each scenario, get the computed summary from computed facts
    const comparisonData: ScenarioComparisonData[] = await Promise.all(
      scenarios.map(async (scenario) => {
        const activeVersion = scenario.versions[0];
        if (!activeVersion) {
          return {
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
            isBaseline: scenario.isBaseline,
            versionId: '',
            versionNum: 0,
            summary: null,
          };
        }

        // Query computed facts for this version
        const computedFacts = await prisma.computedFact.findMany({
          where: { scenarioVersionId: activeVersion.id },
          orderBy: { year: 'asc' },
        });

        if (computedFacts.length === 0) {
          return {
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
            isBaseline: scenario.isBaseline,
            versionId: activeVersion.id,
            versionNum: activeVersion.versionNum,
            summary: null,
          };
        }

        // Aggregate computed facts into summary
        const summary = aggregateComputedFacts(computedFacts);

        return {
          id: scenario.id,
          name: scenario.name,
          description: scenario.description,
          isBaseline: scenario.isBaseline,
          versionId: activeVersion.id,
          versionNum: activeVersion.versionNum,
          summary,
        };
      })
    );

    // Sort so baseline comes first
    comparisonData.sort((a, b) => {
      if (a.isBaseline && !b.isBaseline) return -1;
      if (!a.isBaseline && b.isBaseline) return 1;
      return 0;
    });

    return NextResponse.json({ scenarios: comparisonData });
  } catch (error) {
    return handleApiError(error);
  }
}

interface ComputedFactRecord {
  metric: string;
  year: number;
  capex: number;
  opex: number;
  tco: number;
  npv: number | null;
  day: string | null;
  domain: string | null;
}

function aggregateComputedFacts(facts: ComputedFactRecord[]): ComputedSummary {
  const byYear: Map<number, { year: number; capex: number; opex: number; tco: number; npv: number }> = new Map();
  const byDayDomain: Record<string, { capex: number; opex: number; tco: number }> = {};

  let totalCapex = 0;
  let totalOpex = 0;
  let totalTco = 0;
  let totalNpv = 0;

  for (const fact of facts) {
    // Yearly aggregation
    if (!byYear.has(fact.year)) {
      byYear.set(fact.year, { year: fact.year, capex: 0, opex: 0, tco: 0, npv: 0 });
    }
    const yearData = byYear.get(fact.year)!;

    // Aggregate values
    yearData.capex += fact.capex;
    yearData.opex += fact.opex;
    yearData.tco += fact.tco;
    yearData.npv += fact.npv || 0;

    totalCapex += fact.capex;
    totalOpex += fact.opex;
    totalTco += fact.tco;
    totalNpv += fact.npv || 0;

    // Day×Domain aggregation for breakdown charts
    if (fact.day && fact.domain) {
      const key = `${fact.day}:${fact.domain}`;
      if (!byDayDomain[key]) {
        byDayDomain[key] = { capex: 0, opex: 0, tco: 0 };
      }
      byDayDomain[key].capex += fact.capex;
      byDayDomain[key].opex += fact.opex;
      byDayDomain[key].tco += fact.tco;
    }
  }

  // Convert Map to sorted array
  const byYearArray = Array.from(byYear.values()).sort((a, b) => a.year - b.year);

  return {
    totalCapex,
    totalOpex,
    totalTco,
    totalNpv,
    byYear: byYearArray,
    byDayDomain,
  };
}
