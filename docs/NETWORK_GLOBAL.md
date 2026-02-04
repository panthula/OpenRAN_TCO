# Network Global Scope

## Overview

**Network Global** is a scope type in the OpenRAN TCO model that represents costs that apply once across the entire network, rather than being scaled by site archetypes or DC types. These are typically one-time planning, design, or fixed operational costs that don't multiply with network size.

## Key Characteristics

| Attribute | Value |
|-----------|-------|
| Scope Type | `network_global` |
| Scaling | Fixed (not multiplied by sites, DCs, or archetypes) |
| Typical Driver | `fixed` (one-time cost) |
| Cost Type | Usually CAPEX (Day 0/1), can be annual OPEX (Day 2) |

## Input Categories by Domain

### RAN Domain - Day 0

**Network Planning Services** - One-time planning costs that apply across the entire network:

| Bucket Key | Label | Description |
|------------|-------|-------------|
| `rf_survey` | RF Survey | Initial radio frequency site surveys |
| `rf_planning` | RF Planning | Network-wide RF coverage planning |
| `rf_design` | RF Design | Detailed RF network design |
| `interop_testing` | InterOp Testing | Multi-vendor interoperability testing |
| `ip_planning` | IP Planning | IP address and synchronization planning |
| `other_ran_planning` | Other RAN Planning | Miscellaneous RAN planning activities |

### Cloud Domain - Day 0

**Cloud Design & Architecture** - One-time cloud platform design costs:

| Bucket Key | Label | Description |
|------------|-------|-------------|
| `cloud_design` | Cloud Design | Cloud platform design services |
| `cloud_architecture` | Cloud Architecture Planning | Cloud architecture and capacity planning |

### OSS Domain - Day 0

**OSS Planning & Dimensioning** - One-time OSS planning costs:

| Bucket Key | Label | Description |
|------------|-------|-------------|
| `oss_dimensioning` | OSS Dimensioning | OSS capacity and sizing analysis |
| `oss_planning` | OSS Planning | OSS implementation planning |

## How Costs Are Calculated

Network Global costs follow a simple calculation model:

```
Total Cost = Input Value × 1 (fixed multiplier)
```

Unlike `site_archetype` scoped inputs where costs are multiplied by site counts, Network Global costs are applied exactly once regardless of network size.

### Comparison with Site Archetype Scope

| Scope | Multiplier | Example |
|-------|------------|---------|
| `network_global` | 1 (fixed) | RF Planning: $100,000 → Total: $100,000 |
| `site_archetype` | per_site count | DU Server: $50,000 × 500 sites → $25,000,000 |

## UI Behavior

### Input Pages (RAN, Cloud, OSS)

Network Global inputs appear in dedicated cards with:
- Clear labeling indicating "network-wide" or "one-time" costs
- Single input row (no archetype breakdown)
- Fixed driver pre-selected

### Bucket Groups (Collapsible Sections)

Network Global tables can optionally use **bucket groups** to organize related items into collapsible sections. This provides:
- Expand/Collapse All controls
- Collapsible group headers with chevron icons
- Item counts when collapsed (e.g., "3 items")
- Subtotals per group displayed in cyan
- Overall total unchanged at top

#### Using Bucket Groups

To add grouping to a network_global InputTable:

1. **Define groups in taxonomy.ts:**

```typescript
import { BucketGroup } from '@/lib/model/taxonomy';

export const NetworkPlanningBucketGroups: BucketGroup[] = [
  {
    id: 'rf_services',
    label: 'RF Services',
    buckets: ['rf_survey', 'rf_planning', 'rf_design'],
  },
  {
    id: 'other_planning',
    label: 'Other Planning Services',
    buckets: ['interop_testing', 'ip_planning', 'other_ran_planning'],
  },
];
```

2. **Pass groups to InputTable:**

```tsx
<InputTable
  day="day0"
  domain="ran"
  layer="services"
  buckets={['rf_survey', 'rf_planning', 'rf_design', 'interop_testing', 'ip_planning', 'other_ran_planning']}
  defaultDriver="fixed"
  defaultScope="network_global"
  bucketGroups={NetworkPlanningBucketGroups}
/>
```

#### BucketGroup Interface

```typescript
interface BucketGroup {
  id: string;      // Unique identifier for the group
  label: string;   // Display name shown in the header
  buckets: readonly string[];  // Array of bucket keys in this group
}
```

#### Current Bucket Groups

| Table | Groups |
|-------|--------|
| Network Planning Services | RF Services (3), Other Planning Services (3) |

### $ Summary Tab

Network Global costs are displayed in a dedicated "Network Global" section, separate from archetype-based costs. This provides clear visibility into:
- Total fixed costs by category
- Breakdown by domain (RAN, Cloud, OSS)
- Day segmentation (Day 0, Day 1, Day 2)

## Configuration in Taxonomy

Network Global inputs are configured in `src/lib/model/taxonomy.ts` using the `InputConfigurations` array:

```typescript
{
  day: 'day0',
  domain: 'ran',
  layer: 'services',
  buckets: ['rf_survey', 'rf_planning', 'rf_design', ...],
  defaultDriver: 'fixed',
  defaultScope: 'network_global'
}
```

## Examples

### Example 1: RF Planning Cost

**Input:**
- Bucket: `rf_planning`
- Value: $150,000
- Scope: `network_global`
- Driver: `fixed`

**Calculation:**
- Total = $150,000 × 1 = **$150,000**
- Applied once to the entire network

### Example 2: Cloud Architecture Planning

**Input:**
- Bucket: `cloud_architecture`
- Value: $75,000
- Scope: `network_global`
- Driver: `fixed`

**Calculation:**
- Total = $75,000 × 1 = **$75,000**
- One-time design cost for the cloud platform

## Related Documentation

- [01-TAXONOMY.md](./01-TAXONOMY.md) - Bucket and dimension definitions
- [05-COMPUTE-ENGINE.md](./05-COMPUTE-ENGINE.md) - Cost calculation logic
- [02-RAN.md](./02-RAN.md) - RAN domain specifics
- [03-CLOUD.md](./03-CLOUD.md) - Cloud domain specifics
- [04-OSS.md](./04-OSS.md) - OSS domain specifics
