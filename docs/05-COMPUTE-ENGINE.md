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
│  2. Load Scaling Counts                                          │
│     - Total sites (sum of all archetypes)                        │
│     - Total CUs (sum of all archetypes)                          │
│     - Sites by archetype ID                                      │
│     - CUs by archetype ID                                        │
│     - DC counts by DC type ID                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Process Each InputFact                                       │
│     For each fact:                                               │
│     a. Calculate multiplier based on driver                      │
│     b. Compute totalValue = valueNumber × multiplier             │
│     c. Determine CAPEX vs OPEX based on day                      │
│     d. Apply to appropriate years                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Calculate NPV for Each Year                                  │
│     NPV_y = TCO_y / (1 + discount_rate)^y                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Aggregate Totals                                             │
│     - Sum CAPEX across all years                                 │
│     - Sum OPEX across all years                                  │
│     - TCO = CAPEX + OPEX                                         │
│     - NPV = Sum of discounted TCO                                │
└─────────────────────────────────────────────────────────────────┘
```

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
      if (scopeType === 'dc_type' && scopeId) {
        return counts.dcCountsByScopeId[scopeId] || 0;
      }
      return Object.values(counts.dcCountsByScopeId).reduce((a, b) => a + b, 0);
    
    case 'fixed':
    default:
      return 1;
  }
}
```

## CAPEX vs OPEX Treatment

### Day 0 and Day 1 (CAPEX)

```typescript
if (fact.day === 'day0' || fact.day === 'day1') {
  // Standard CAPEX in year 0
  if (y === 0) {
    yearCapex = totalValue;
  }
  
  // Perpetual license support starts in year 0
  if (isPerpetual && fact.layer === 'software') {
    yearOpex = totalValue * 0.15; // 15% support
  }
}
```

### Day 2 (OPEX)

```typescript
if (fact.day === 'day2') {
  // OPEX every year
  yearOpex = totalValue;
}
```

### Perpetual License Spreading

If `perpetual_spread_years > 1`:

```typescript
if (isPerpetual && spreadYears > 1) {
  // Divide CAPEX across N years
  capex = totalValue / spreadYears;
  
  for (let y = 0; y < spreadYears && y < years; y++) {
    byYear[y].capex += capex;
  }
}
```

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

## Performance Considerations

- Batch read all InputFacts in one query
- Use aggregation at database level when possible
- Cache computed results until inputs change
- Consider incremental recomputation for large models

