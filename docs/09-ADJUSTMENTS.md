# Scenario Adjustment Modifiers

## Overview

Adjustment modifiers enable **what-if analysis** by applying rules that modify cost values during TCO computation. This allows you to model scenarios like:

- Vendor discount negotiations (e.g., 10% reduction on hardware)
- Cost escalation assumptions (e.g., 5% increase in labor costs)
- Alternative pricing (e.g., replace cloud license cost with a fixed amount)
- Domain-specific changes (e.g., reduce all RAN Day 2 costs by 15%)

Adjustments are applied **at compute time**, leaving the original InputFacts unchanged. This makes it easy to toggle adjustments on/off and compare scenarios.

## Data Model

### AdjustmentSet

A named collection of adjustment rules associated with a scenario version.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `scenarioVersionId` | String | FK to ScenarioVersion |
| `name` | String | Display name (e.g., "Vendor Discount") |
| `description` | String? | Optional description |
| `isActive` | Boolean | Whether rules are applied during compute |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### AdjustmentRule

Individual rule that modifies matching InputFacts.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `adjustmentSetId` | String | FK to AdjustmentSet |
| `targetDay` | String? | Filter by day (null = all days) |
| `targetDomain` | String? | Filter by domain (null = all domains) |
| `targetLayer` | String? | Filter by layer (null = all layers) |
| `targetBucket` | String? | Filter by bucket (null = all buckets) |
| `targetScopeType` | String? | Filter by scope type (null = all) |
| `targetScopeId` | String? | Filter by specific scope (null = all within type) |
| `adjustmentType` | String | Type: `percentage`, `fixed`, `replace` |
| `adjustmentValue` | Float | Adjustment amount |
| `priority` | Int | Order of application (lower = first) |
| `notes` | String? | Optional notes |

## Adjustment Types

### Percentage (`percentage`)

Multiplies the value by `(1 + adjustmentValue / 100)`.

```
adjustmentValue = 10   -> +10% increase
adjustmentValue = -20  -> 20% decrease
```

**Example**: A hardware cost of $100,000 with `adjustmentValue = -10` becomes $90,000.

### Fixed (`fixed`)

Adds the adjustment value to the original value.

```
adjustmentValue = 5000   -> adds $5,000
adjustmentValue = -1000  -> subtracts $1,000
```

**Example**: A service cost of $50,000 with `adjustmentValue = -5000` becomes $45,000.

### Replace (`replace`)

Replaces the original value entirely with the adjustment value.

```
adjustmentValue = 75000  -> value becomes $75,000
```

**Example**: A license cost of $100,000 with `adjustmentValue = 75000` becomes $75,000.

## Targeting Rules

Rules use dimension filters to match specific InputFacts. A `null` value means "match all" for that dimension.

### Filter Dimensions

| Dimension | Values | Example |
|-----------|--------|---------|
| `targetDay` | `day0`, `day1`, `day2` | Only Day 2 OPEX |
| `targetDomain` | `ran`, `cloud`, `oss` | Only RAN costs |
| `targetLayer` | `hardware_bom`, `software`, `services`, etc. | Only hardware |
| `targetBucket` | Any bucket key | Only `du_server` bucket |
| `targetScopeType` | `site_archetype`, `dc_type`, `network_global` | Only site costs |
| `targetScopeId` | Specific archetype/DC ID | Only "Urban Macro" sites |

### Matching Logic

A rule matches an InputFact when **all** specified filters match:

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

### Priority and Stacking

When multiple rules match the same InputFact:
1. Rules are sorted by `priority` (ascending)
2. Rules are applied sequentially
3. Each rule operates on the result of the previous rule

**Example**: With priority 0 = -10% and priority 1 = +$5000:
- Original: $100,000
- After priority 0: $90,000
- After priority 1: $95,000

## Compute Integration

The compute engine integrates adjustments in `src/lib/compute/engine.ts`.

### Loading Adjustments

```typescript
async function getActiveAdjustments(scenarioVersionId: string): Promise<AdjustmentSetWithRules[]> {
  return prisma.adjustmentSet.findMany({
    where: { scenarioVersionId, isActive: true },
    include: { rules: { orderBy: { priority: 'asc' } } },
  });
}
```

### Applying Adjustments

For each InputFact during computation:

```typescript
const { adjustedValue, appliedRules } = getAdjustedValue(
  fact.valueNumber,
  { day: fact.day, domain: fact.domain, layer: fact.layer, ... },
  allRules
);

// Use adjustedValue instead of fact.valueNumber for calculations
const effectiveValue = adjustedValue;
```

### Impact Tracking

The compute engine tracks adjustment impact in the response:

```typescript
interface AdjustmentMetadata {
  id: string;        // AdjustmentSet ID
  name: string;      // AdjustmentSet name
  rulesApplied: number;  // Count of rule applications
  totalImpact: number;   // Sum of (adjusted - original) values
}
```

This metadata is included in `ComputeSummary.adjustments` for dashboard display.

## UI Components

### AdjustmentPanel

**Location**: `src/components/inputs/AdjustmentPanel.tsx`

The main UI for managing adjustment sets. Features:
- List view of all adjustment sets with active/inactive toggle
- Expandable view showing rules for each set
- Modal for creating/editing sets with rule builder
- Delete confirmation

**Usage on Setup Page**:
```tsx
import { AdjustmentPanel } from '@/components/inputs/AdjustmentPanel';

<AdjustmentPanel />
```

### Dashboard Display

**Location**: `src/app/(main)/dashboard/page.tsx`

When adjustments are active, the dashboard shows:
- An "Active Adjustments" card listing enabled sets
- Impact summary showing the net effect of each adjustment set
- Color-coded impact (green for savings, red for increases)

## API Endpoints

All endpoints at `/api/adjustments`.

### GET - List Adjustment Sets

```http
GET /api/adjustments?versionId={versionId}&activeOnly={true|false}
```

**Response**: Array of adjustment sets with nested rules.

### POST - Create/Update Adjustment Set

```http
POST /api/adjustments
Content-Type: application/json

{
  "id": "...",          // Include for update, omit for create
  "scenarioVersionId": "...",
  "name": "Hardware Discount",
  "description": "10% vendor discount on all hardware",
  "isActive": true,
  "rules": [
    {
      "targetDay": null,
      "targetDomain": null,
      "targetLayer": "hardware_bom",
      "targetBucket": null,
      "targetScopeType": null,
      "targetScopeId": null,
      "adjustmentType": "percentage",
      "adjustmentValue": -10,
      "priority": 0,
      "notes": "Negotiated Q4 2024"
    }
  ]
}
```

### PATCH - Toggle Active Status

```http
PATCH /api/adjustments
Content-Type: application/json

{ "id": "...", "isActive": false }
```

### DELETE - Remove Adjustment Set

```http
DELETE /api/adjustments?id={adjustmentSetId}
```

## Examples

### 1. Vendor Hardware Discount

Reduce all hardware costs by 15%:

```json
{
  "name": "Hardware Vendor Discount",
  "rules": [{
    "targetLayer": "hardware_bom",
    "adjustmentType": "percentage",
    "adjustmentValue": -15
  }]
}
```

### 2. RAN Operations Cost Increase

Model 5% annual increase in RAN Day 2 costs:

```json
{
  "name": "RAN OPEX Escalation",
  "rules": [{
    "targetDay": "day2",
    "targetDomain": "ran",
    "adjustmentType": "percentage",
    "adjustmentValue": 5
  }]
}
```

### 3. Alternative Cloud Pricing

Replace cloud license cost with negotiated rate:

```json
{
  "name": "Cloud License Renegotiation",
  "rules": [{
    "targetDomain": "cloud",
    "targetLayer": "software",
    "adjustmentType": "replace",
    "adjustmentValue": 250000
  }]
}
```

### 4. Site-Specific Discount

Apply discount only to Urban Macro archetype:

```json
{
  "name": "Urban Site Discount",
  "rules": [{
    "targetScopeType": "site_archetype",
    "targetScopeId": "urban_macro_archetype_id",
    "adjustmentType": "percentage",
    "adjustmentValue": -10
  }]
}
```

### 5. Stacked Adjustments

Combine percentage discount with fixed reduction:

```json
{
  "name": "Combined Hardware Savings",
  "rules": [
    {
      "targetLayer": "hardware_bom",
      "adjustmentType": "percentage",
      "adjustmentValue": -10,
      "priority": 0
    },
    {
      "targetLayer": "hardware_bom",
      "adjustmentType": "fixed",
      "adjustmentValue": -50000,
      "priority": 1
    }
  ]
}
```

## Best Practices

1. **Meaningful Names**: Use descriptive names that explain the business reason (e.g., "Q4 Vendor Discount" not "10% off")

2. **Document with Notes**: Add notes to rules explaining the rationale or source

3. **Test Impact**: Compute TCO before and after enabling adjustments to verify expected impact

4. **Prioritize Carefully**: When stacking rules, consider the order of operations

5. **Keep Sets Focused**: Create separate adjustment sets for different scenarios rather than one large set

6. **Use Toggle Feature**: Keep historical adjustments inactive rather than deleting them

## Related Documentation

- [Database Schema](./07-DATABASE-SCHEMA.md) - AdjustmentSet and AdjustmentRule models
- [Compute Engine](./05-COMPUTE-ENGINE.md) - How adjustments are applied during calculation
- [Taxonomy](./01-TAXONOMY.md) - Available dimension values for targeting
