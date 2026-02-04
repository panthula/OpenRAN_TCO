# Multi-Scenario Comparison

This document describes the scenario comparison feature, which enables side-by-side analysis of TCO differences between scenarios using delta visualizations.

## Overview

The Multi-Scenario Comparison feature allows users to:
- Select two scenarios with computed TCO results
- View a Delta Waterfall chart showing the "bridge" from baseline to comparison
- View a Comparison Tornado chart showing impact by category
- Analyze detailed cost breakdowns by Day×Domain

## User Workflow

1. **Create baseline scenario** with inputs → Compute TCO
2. **Clone scenario** → Add adjustments (e.g., -15% RAN OPEX)
3. **Compute TCO** on adjusted scenario
4. **Open comparison mode** → Select both scenarios → View delta visualizations

## Accessing the Comparison View

There are two ways to access the comparison page:

1. **From Dashboard**: Click the "Compare Scenarios" button in the dashboard header
2. **From Sidebar**: Click the "Compare" navigation item

## Requirements

- At least 2 scenarios must have computed TCO results
- Each scenario must have an active version with computed facts

## Visualizations

### Delta Waterfall Chart

Shows the "bridge" from baseline TCO to comparison scenario:

```
[Baseline] ──[RAN -$4M]──[Cloud +$0.5M]──[OSS -$1M]──[Adjusted]
```

- **Starting bar**: Baseline total TCO (cyan)
- **Middle bars**: Each Day×Domain delta, sorted by impact magnitude
  - Green (#10b981): Savings (cost decrease)
  - Red (#ef4444): Cost increase
- **Ending bar**: Comparison total TCO (cyan)

Hover tooltip shows:
- Dollar amount of change
- Percentage change from baseline

### Comparison Tornado Chart

Horizontal bar chart showing impact by category:

```
RAN Day2    ████████████████  -$4.2M (-15%)
Cloud Day0  ██████            -$1.8M (-8%)
OSS Day1    ███               +$0.6M (+5%)
```

Features:
- Bars extend left (savings) or right (cost increases)
- Sorted by absolute magnitude (largest impact first)
- Shows dollar amount and percentage change
- Includes summary table with top 10 categories

### Summary Cards

Three cards showing:
- **Baseline TCO**: Total TCO of baseline scenario
- **Comparison TCO**: Total TCO of comparison scenario
- **Delta**: Difference with percentage change

## API Endpoint

### GET /api/compare

Fetches computed summaries for selected scenarios.

**Query Parameters:**
- `ids`: Comma-separated scenario IDs (required, minimum 2, maximum 10)

**Response:**
```json
{
  "scenarios": [
    {
      "id": "uuid",
      "name": "Baseline",
      "description": "...",
      "isBaseline": true,
      "versionId": "uuid",
      "versionNum": 1,
      "summary": {
        "totalCapex": 15000000,
        "totalOpex": 30000000,
        "totalTco": 45000000,
        "totalNpv": 38000000,
        "byYear": [...],
        "byDayDomain": {
          "day0:ran": { "capex": 5000000, "opex": 0, "tco": 5000000 },
          "day2:cloud": { "capex": 0, "opex": 2000000, "tco": 2000000 }
        }
      }
    },
    {
      "id": "uuid",
      "name": "With Adjustments",
      "description": "...",
      "isBaseline": false,
      "versionId": "uuid",
      "versionNum": 1,
      "summary": {...}
    }
  ]
}
```

**Error Responses:**
- `400`: Missing ids, fewer than 2 scenarios, or more than 10 scenarios
- `404`: One or more scenarios not found

## Store State

The scenario store includes comparison-specific state:

```typescript
// State
comparisonScenarios: ScenarioComparisonData[];
isComparing: boolean;

// Actions
loadComparisonData(scenarioIds: string[]): Promise<void>;
clearComparison(): void;
```

## Component Architecture

### ScenarioSelector

Dropdown component for choosing scenarios to compare:
- Lists all scenarios with computed results
- Two dropdowns: "Baseline" and "Compare To"
- Auto-selects scenario marked as `isBaseline`
- Shows computed status indicators
- "Load Comparison" button

### DeltaWaterfall

Props:
```typescript
interface DeltaWaterfallProps {
  baselineName: string;
  comparisonName: string;
  baselineTco: number;
  comparisonTco: number;
  baselineByDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  comparisonByDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  title?: string;
  description?: string;
}
```

### ComparisonTornado

Props:
```typescript
interface ComparisonTornadoProps {
  baselineByDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  comparisonByDayDomain: Record<string, { capex: number; opex: number; tco: number }>;
  title?: string;
  description?: string;
}
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── compare/
│   │       └── route.ts              # Comparison API endpoint
│   └── (main)/
│       └── dashboard/
│           └── comparison/
│               └── page.tsx          # Comparison page
├── components/
│   └── dashboard/
│       ├── index.ts                  # Component exports
│       ├── DeltaWaterfall.tsx        # Delta waterfall chart
│       ├── ComparisonTornado.tsx     # Tornado chart
│       └── ScenarioSelector.tsx      # Scenario selection UI
└── lib/
    └── store/
        └── scenario-store.ts         # Comparison state and actions
```

## Color Coding

| Color | Hex Code | Usage |
|-------|----------|-------|
| Cyan | #06b6d4 | Total TCO bars |
| Green | #10b981 | Savings (cost decrease) |
| Red | #ef4444 | Cost increase |

## Day×Domain Keys

The `byDayDomain` object uses composite keys in the format `{day}:{domain}`:

| Key | Description |
|-----|-------------|
| `day0:ran` | RAN Day 0 (Design + Procurement) |
| `day1:ran` | RAN Day 1 (Build, Install, Integrate) |
| `day2:ran` | RAN Day 2 (Operations) |
| `day0:cloud` | Cloud Day 0 |
| `day1:cloud` | Cloud Day 1 |
| `day2:cloud` | Cloud Day 2 |
| `day0:oss` | OSS Day 0 |
| `day1:oss` | OSS Day 1 |
| `day2:oss` | OSS Day 2 |

## Troubleshooting

### "Insufficient Computed Scenarios"

**Problem**: The comparison page shows this message when trying to select scenarios.

**Solution**: Ensure at least 2 scenarios have computed TCO results:
1. Go to Dashboard
2. Select a scenario
3. Click "Compute TCO"
4. Repeat for a second scenario
5. Return to Compare page

### Missing byDayDomain Data

**Problem**: Charts don't render or show empty state.

**Solution**: The byDayDomain breakdown is populated during TCO computation. Recompute TCO for both scenarios to ensure the data is available.

### Scenarios Not Appearing in Dropdown

**Problem**: A scenario exists but doesn't appear in the comparison dropdown.

**Solution**: Check that:
1. The scenario has an active version
2. The scenario has computed results (not just input facts)
3. Refresh the page to reload scenario list
