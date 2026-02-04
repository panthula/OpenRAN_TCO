# Compute Engine Documentation

## Overview

The compute engine calculates Total Cost of Ownership (TCO) by processing all InputFacts, applying scaling rules, and generating year-by-year CAPEX/OPEX projections.

**Location**: `src/lib/compute/engine.ts`

## Core Functions

### computeTco(scenarioVersionId)

Main calculation function that returns a complete TCO summary.

**Input**: Scenario version ID

**Output**: `ComputeSummary` object

```typescript
interface ComputeSummary {
  totalCapex: number;
  totalOpex: number;
  totalTco: number;
  totalNpv: number;
  byYear: ComputeResult[];
  byDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  breakdown: ComputeBreakdown[];
}
```

### computeAndPersist(scenarioVersionId)

Computes TCO and persists results to the `ComputedFact` table.

Used when user clicks "Compute TCO" or when applying agent changes.

## Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Load Model Assumptions                                       │
│     - tco_years (default: 5)                                     │
│     - discount_rate (default: 0.08)                              │
│     - perpetual_spread_years (default: 1)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Load Active Adjustments                                      │
│     - Fetch AdjustmentSets where isActive = true                 │
│     - Collect all rules, sorted by priority                      │
│     - Initialize tracking for impact reporting                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Load Scaling Counts (Per Year)                               │
│     For each year Y in TCO window:                               │
│     - deploymentsThisYear: sites/CUs/DCs deployed in year Y      │
│     - cumulativeToYear: total deployed by end of year Y          │
│     (If no deployment schedule: all in Year 0, cumulative = total)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Process Each InputFact (Per Year)                            │
│     For each InputFact:                                          │
│     a. Apply adjustment rules to get effectiveValue              │
│     b. For each year Y:                                          │
│        - Day 0/1 CAPEX: multiplier from deploymentsThisYear      │
│        - Day 2 OPEX: multiplier from cumulativeToYear            │
│        - Compute yearValue = effectiveValue × multiplier         │
│        - Apply to year Y's CAPEX or OPEX                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Calculate NPV for Each Year                                  │
│     NPV_y = TCO_y / (1 + discount_rate)^y                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Aggregate Totals and Adjustment Metadata                     │
│     - Sum CAPEX across all years                                 │
│     - Sum OPEX across all years                                  │
│     - TCO = CAPEX + OPEX                                         │
│     - NPV = Sum of discounted TCO                                │
│     - Include adjustment impact summary in response              │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Schedule Phasing

Archetypes can have a deployment schedule that phases site/CU/DC deployments across multiple years.

### Scaling Counts Structure

```typescript
interface YearScalingCounts {
  // Deployments THIS year (for CAPEX)
  deploymentsThisYear: {
    sites: number;
    cus: number;
    dcs: number;
    sitesByScopeId: Record<string, number>;
    cusByScopeId: Record<string, number>;
    dcsByScopeId: Record<string, number>;
  };
  // Cumulative deployments TO this year (for OPEX)
  cumulativeToYear: {
    sites: number;
    cus: number;
    dcs: number;
    sitesByScopeId: Record<string, number>;
    cusByScopeId: Record<string, number>;
    dcsByScopeId: Record<string, number>;
  };
}
```

### Phasing Logic

```typescript
// For each year Y in TCO window
for (let y = 0; y < tcoYears; y++) {
  const counts = getScalingCounts(versionId, y);

  for (const fact of inputFacts) {
    if (fact.day === 'day0' || fact.day === 'day1') {
      // CAPEX: use deployments THIS year only
      const multiplier = getMultiplier(fact.driver, counts.deploymentsThisYear);
      byYear[y].capex += fact.valueNumber * multiplier;
    }

    if (fact.day === 'day2') {
      // OPEX: use CUMULATIVE deployments (operate all deployed assets)
      const multiplier = getMultiplier(fact.driver, counts.cumulativeToYear);
      byYear[y].opex += fact.valueNumber * multiplier;
    }
  }
}
```

### Example

Given an archetype with:
- Year 0: 500 sites deployed
- Year 1: 300 sites deployed
- Year 2: 200 sites deployed

| Year | deploymentsThisYear | cumulativeToYear | CAPEX Multiplier | OPEX Multiplier |
|------|---------------------|------------------|------------------|-----------------|
| 0    | 500                 | 500              | 500              | 500             |
| 1    | 300                 | 800              | 300              | 800             |
| 2    | 200                 | 1000             | 200              | 1000            |

### Backward Compatibility

Archetypes without a deployment schedule default to:
- All deployments in Year 0
- Cumulative = Total counts for all years

## Scaling Rules

### Driver-Based Multipliers

| Driver | Multiplier Source |
|--------|-------------------|
| `per_site` | numSites for archetype or total sites |
| `per_cu` | numCUs for archetype or total CUs |
| `per_dc` | numDCs for DC type or total DCs |
| `per_server` | 1 (or stored count if available) |
| `per_cluster` | 1 (or stored count if available) |
| `per_license_unit` | 1 (or stored count if available) |
| `fixed` | 1 |
| `per_year` | 1 (applied each year) |

### Multiplier Calculation

```typescript
function getMultiplier(
  driver: string,
  scopeType: string,
  scopeId: string | null,
  counts: ScalingCounts
): number {
  switch (driver) {
    case 'per_site':
      if (scopeType === 'site_archetype' && scopeId) {
        return counts.sitesByScopeId[scopeId] || 0;
      }
      return counts.totalSites;
    
    case 'per_cu':
      if (scopeType === 'site_archetype' && scopeId) {
        return counts.cusByScopeId[scopeId] || 0;
      }
      return counts.totalCus;
    
    case 'per_dc':
      if (scopeType === 'site_archetype' && scopeId) {
        return counts.dcsByScopeId[scopeId] || 0;
      }
      return counts.totalDcs;
    
    case 'fixed':
    default:
      return 1;
  }
}
```

## CAPEX vs OPEX Treatment

### Day 0 and Day 1 (CAPEX) - With Deployment Phasing

```typescript
if (fact.day === 'day0' || fact.day === 'day1') {
  // CAPEX uses deployments THIS year (phased based on schedule)
  const multiplier = getMultiplier(fact.driver, yearCounts.deploymentsThisYear);
  const totalValue = fact.valueNumber * multiplier;
  yearCapex = totalValue;

  // Perpetual license support based on cumulative deployments
  if (isPerpetual && fact.layer === 'software') {
    const opexMultiplier = getMultiplier(fact.driver, yearCounts.cumulativeToYear);
    yearOpex = fact.valueNumber * opexMultiplier * 0.15; // 15% support
  }
}
```

### Day 2 (OPEX) - Cumulative

```typescript
if (fact.day === 'day2') {
  // OPEX uses CUMULATIVE deployments (you operate all deployed assets)
  const multiplier = getMultiplier(fact.driver, yearCounts.cumulativeToYear);
  yearOpex = fact.valueNumber * multiplier;
}
```

**Key Insight**: Day 2 OPEX is cumulative because you pay to operate all assets that have been deployed, not just new deployments.

### Perpetual License Spreading

If `perpetual_spread_years > 1` and the InputFact has `licenseModel='perpetual'`:

```typescript
if (isPerpetual && spreadYears > 1) {
  // Divide CAPEX across N years
  capex = totalValue / spreadYears;

  for (let y = 0; y < spreadYears && y < years; y++) {
    byYear[y].capex += capex;
  }
}
```

**Implementation Locations**:
- **Server-side**: `src/lib/compute/engine.ts` - Used for Dashboard TCO computations
- **Client-side**: `src/lib/utils/yearly-breakdown.ts` - Used for domain summary yearly breakdowns

Both implementations read the `perpetual_spread_years` assumption and check `licenseModel='perpetual'` on each InputFact to determine spreading behavior.

## NPV Calculation

```typescript
for (let y = 0; y < years; y++) {
  const discountFactor = Math.pow(1 + discountRate, y);
  byYear[y].npv = byYear[y].tco / discountFactor;
}

const totalNpv = byYear.reduce((sum, yr) => sum + yr.npv, 0);
```

## Persisting Results

Results are stored in the `ComputedFact` table:

```typescript
await prisma.computedFact.createMany({
  data: [
    // Overall by year
    ...summary.byYear.map(yr => ({
      scenarioVersionId,
      metric: 'total',
      year: yr.year,
      capex: yr.capex,
      opex: yr.opex,
      tco: yr.tco,
      npv: yr.npv,
    })),
    
    // By day/domain aggregates
    ...Object.entries(summary.byDayDomain).map(([key, values]) => ({
      scenarioVersionId,
      metric: 'by_day_domain',
      day: key.split(':')[0],
      domain: key.split(':')[1],
      year: 0,
      ...values,
    })),
    
    // Detailed breakdown
    ...summary.breakdown.map(item => ({
      scenarioVersionId,
      metric: 'breakdown',
      ...item,
    })),
  ],
});
```

## API Endpoint

**POST `/api/compute`**

```typescript
// Request body
{ scenarioVersionId: string }

// Response
{
  totalCapex: number,
  totalOpex: number,
  totalTco: number,
  totalNpv: number,
  byYear: [...],
  byDayDomain: {...},
  breakdown: [...]
}
```

## Extending the Engine

### Adding New Scaling Drivers

1. Add driver to `ScalingDrivers` in taxonomy.ts
2. Add case in `getMultiplier()` function
3. Store the count in ScalingCounts if needed

### Adding Escalation/Inflation

```typescript
// Future enhancement
if (fact.day === 'day2') {
  const inflationRate = assumptions.inflation_rate || 0;
  yearOpex = opex * Math.pow(1 + inflationRate, y);
}
```

### Adding Cost Pools

For more granular tracking, add cost pool dimensions:

```typescript
interface CostPool {
  day: Day;
  domain: Domain;
  layer: Layer;
  bucket: string;
  year: number;
  capex: number;
  opex: number;
}
```

## Adjustment Application

Adjustment rules modify InputFact values during computation for what-if analysis. See [Adjustments](./09-ADJUSTMENTS.md) for full documentation.

### Loading Active Adjustments

```typescript
async function getActiveAdjustments(scenarioVersionId: string): Promise<AdjustmentSetWithRules[]> {
  return prisma.adjustmentSet.findMany({
    where: { scenarioVersionId, isActive: true },
    include: { rules: { orderBy: { priority: 'asc' } } },
  });
}
```

### Rule Matching

Rules use dimension filters to target specific InputFacts. A `null` filter value means "match all":

```typescript
function ruleMatchesFact(rule, fact): boolean {
  if (rule.targetDay !== null && rule.targetDay !== fact.day) return false;
  if (rule.targetDomain !== null && rule.targetDomain !== fact.domain) return false;
  if (rule.targetLayer !== null && rule.targetLayer !== fact.layer) return false;
  if (rule.targetBucket !== null && rule.targetBucket !== fact.bucket) return false;
  if (rule.targetScopeType !== null && rule.targetScopeType !== fact.scopeType) return false;
  if (rule.targetScopeId !== null && rule.targetScopeId !== fact.scopeId) return false;
  return true;
}
```

### Value Modification

Three adjustment types are supported:

```typescript
function applyAdjustment(value: number, rule: AdjustmentRule): number {
  switch (rule.adjustmentType) {
    case 'percentage':
      // adjustmentValue is the percentage change (e.g., -10 = 10% decrease)
      return value * (1 + rule.adjustmentValue / 100);
    case 'fixed':
      // adjustmentValue is added to the value
      return value + rule.adjustmentValue;
    case 'replace':
      // adjustmentValue replaces the original value
      return rule.adjustmentValue;
  }
}
```

### Applying Multiple Rules

When multiple rules match an InputFact, they are applied sequentially by priority:

```typescript
function getAdjustedValue(originalValue, fact, allRules) {
  let adjustedValue = originalValue;
  const appliedRules = [];

  for (const rule of allRules) {  // Already sorted by priority
    if (ruleMatchesFact(rule, fact)) {
      adjustedValue = applyAdjustment(adjustedValue, rule);
      appliedRules.push(rule);
    }
  }

  return { adjustedValue, appliedRules };
}
```

### Impact Tracking

The engine tracks adjustment impact for reporting:

```typescript
interface AdjustmentMetadata {
  id: string;        // AdjustmentSet ID
  name: string;      // AdjustmentSet name
  rulesApplied: number;  // Count of rule applications
  totalImpact: number;   // Sum of (adjusted - original) across all facts
}
```

This metadata is included in the `ComputeSummary` response and displayed on the dashboard.

## Error Handling

### Safe JSON Parsing

The engine uses a `safeJsonParse` helper function to handle potentially malformed JSON data in `valueJson` fields:

```typescript
function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    console.warn('Failed to parse JSON:', json);
    return fallback;
  }
}
```

This is used when parsing:
- Year-specific values for `per_year_deployment` driver
- Integration count data for `per_integration` driver

If JSON parsing fails, the engine logs a warning and uses the fallback value (typically an empty object `{}`), allowing computation to continue rather than crashing.

### Dashboard Error Display

When computation fails, errors are:
1. Caught by the store's `computeTco` action and stored in the `error` state
2. Displayed in the Dashboard as a red error card with the error message
3. Logged to the browser console for debugging

The Dashboard reads the `error` field from the Zustand store and displays it when present:

```typescript
{error && (
  <Card className="border-red-500/50 bg-red-500/10">
    <CardContent>
      <div className="flex items-center gap-3 text-red-400">
        <AlertCircle className="w-5 h-5" />
        <div>
          <p className="font-medium">Computation Error</p>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

## Performance Considerations

- Batch read all InputFacts in one query
- Use aggregation at database level when possible
- Cache computed results until inputs change
- Consider incremental recomputation for large models
- Adjustment rules are loaded once and applied in-memory during computation

