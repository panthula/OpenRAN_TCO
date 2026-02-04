# Cloud Implementation Guide

## Overview

This document covers all Cloud/CaaS (Container as a Service) platform inputs across the complete lifecycle:
- **Day 0**: Cloud platform licensing
- **Day 1**: Cluster bring-up and integration
- **Day 2**: Platform operations and license support
- **Cloud $ Summary**: Network-scaled cost rollups across all days

**Page Location**: `src/app/(main)/cloud/page.tsx`

**Navigation**: Sidebar → **Cloud** → Day 0 / Day 1 / Day 2 / Cloud $ Summary tabs

---

## Day 0 - Design + Procurement

Day 0 covers all upfront cloud platform licensing costs.

### Cloud/CaaS Licensing

The Cloud/CaaS Licensing section is organized into two collapsible groups:

#### Platform Licenses (One-Time)

Fixed one-time platform license costs applied in Year 0 only.

| Bucket | Label | Driver | Cost Type |
|--------|-------|--------|-----------|
| `cloud_native_platform` | Cloud Native Platform (CNP) | fixed | One-time (Year 0) |
| `cloud_native_orchestrator` | Cloud Native Orchestrator (CNO) | fixed | One-time (Year 0) |

#### Unit Licenses

Per-unit license costs that scale with deployment counts.

| Bucket | Label | Driver | Cost Type |
|--------|-------|--------|-----------|
| `cloud_per_du_at_site` | Cloud License (per DU) | per_site | Per-unit |
| `cloud_per_cu_server` | Cloud License (per CU) | per_cu | Per-unit |
| `cloud_per_oss_server` | Cloud License (per OSS Server) | per_server | Per-unit |
| `storage_licenses` | Storage Licenses | fixed | Per-unit |

### Bucket Groups Configuration

The bucket groups are defined in `taxonomy.ts`:

```typescript
export const CloudLicenseBucketGroups: BucketGroup[] = [
  {
    id: 'platform_licenses',
    label: 'Platform Licenses (One-Time)',
    buckets: ['cloud_native_platform', 'cloud_native_orchestrator'],
  },
  {
    id: 'unit_licenses',
    label: 'Unit Licenses',
    buckets: ['cloud_per_du_at_site', 'cloud_per_cu_server', 'cloud_per_oss_server', 'storage_licenses'],
  },
];
```

### License Model Options

- **Perpetual**: Day 0 CAPEX + Day 2 support (15% default)
- **Subscription**: Day 2 OPEX only

### Day 0 Cost Treatment

All Day 0 Cloud costs are treated as **CAPEX**:
1. **Standard CAPEX**: Full amount in Year 0
2. **Spread CAPEX**: If `perpetual_spread_years > 1`, amount divided equally across N years
3. **Support/Maintenance**: For perpetual licenses, 15% annual support added as OPEX starting Year 0

---

## Day 1 - Build, Install, Integrate

Day 1 covers cluster deployment and integration service costs.

### Cluster Bring-up & Integration

| Bucket | Description | Driver |
|--------|-------------|--------|
| `cluster_bringup` | Initial cluster provisioning | per_dc |
| `cicd_pipeline_setup` | CI/CD pipeline configuration | fixed |
| `observability_setup` | Observability baseline setup | fixed |

### Deployment Services

Network-wide cloud deployment support costs that vary by year. These use the `per_year_deployment` driver and are only applied in years with deployment activity.

| Bucket | Description | Driver | Scope |
|--------|-------------|--------|-------|
| `cloud_deployment_support` | Cloud Deployment Support | per_year_deployment | network_global |
| `other_cloud_caas_support` | Other Cloud/CaaS Support | per_year_deployment | network_global |

**Input Method**: YearlyInputTable with per-year cost fields (Y1, Y2, Y3, etc.)

**Data Storage**: Values stored in `InputFact.valueJson` as `{"year_0": 50000, "year_1": 60000, ...}`

**Cost Application**: Only charged in years with deployments (sites/CUs/DCs > 0)

### Day 1 Cost Treatment

All Day 1 Cloud costs are treated as **CAPEX**:
- Full amount recognized in Year 0 (or first year of deployment)
- No recurring component (these are one-time services)
- **Deployment Services**: Applied per-year based on `valueJson` values, only in deployment years

### Scaling Examples

**Per-DC Costs**:
- 5 Edge DCs @ $50,000/cluster bringup
- 2 Regional DCs @ $100,000/cluster bringup
- Total Cluster Bringup = (5 × $50,000) + (2 × $100,000) = $450K

**Fixed Costs**:
- CI/CD pipeline setup: One-time cost regardless of scale
- Observability baseline setup: One-time cost

---

## Day 2 - Operations

Day 2 covers all recurring platform operations and license support costs.

### Platform Operations

| Bucket | Description | Driver |
|--------|-------------|--------|
| `observability_ops` | Observability tools & ops | per_year |
| `cicd_ops` | CI/CD operations | per_year |
| `security_ops` | Security operations | per_year |
| `backup_dr` | Backup and DR | per_year |

### Cloud License Support

Annual cloud platform support (if perpetual) or subscription:

| Bucket | Label | Driver |
|--------|-------|--------|
| `cloud_native_platform` | Cloud Native Platform (CNP) | fixed per year |
| `cloud_native_orchestrator` | Cloud Native Orchestrator (CNO) | fixed per year |
| `cloud_per_du_at_site` | Cloud License (per DU) | per_site per year |
| `cloud_per_cu_server` | Cloud License (per CU) | per_cu per year |
| `cloud_per_oss_server` | Cloud License (per OSS Server) | per_server per year |
| `storage_licenses` | Storage Licenses | fixed per year |

### Day 2 Cost Treatment

All Day 2 Cloud costs are treated as **OPEX**:
- Recurring annually for the duration of the TCO (`tco_years`)
- Applied every year from Year 0 through Year N-1
- Subject to NPV discounting

### License Support Rates

Typical support rates:
- Perpetual licenses: 15-20% of license value
- Subscription: Included in subscription fee
- Premium support: 20-25%

---

## Cloud $ Summary Tab

The **Cloud $ Summary** tab provides a consolidated view of all Cloud costs using a dedicated Cloud-specific component with Cloud-centric category groupings.

### Summary Header

| Section | Description | Value Type |
|---------|-------------|------------|
| **One-Time Total** | Day 0 + Day 1 combined | Network-scaled |
| **Annual Run-Rate** | Day 2 recurring costs | Per year |

### Deployment Counts Display

- **Total DCs**: Sum of `numDcs` across all site archetypes
- **Total Sites (DU)**: Sum of `numSites` across all site archetypes
- **Total CUs**: Sum of `numCus` across all site archetypes

### Cloud-Specific Cost Categories

#### Day 0 - Licensing & Design

| Category | Buckets | Description |
|----------|---------|-------------|
| **Platform Licenses (One-Time)** | `cloud_native_platform`, `cloud_native_orchestrator` | One-time platform license costs |
| **Unit Licenses** | `cloud_per_du_at_site`, `cloud_per_cu_server`, `cloud_per_oss_server`, `storage_licenses` | Per-unit license costs that scale with deployments |
| **Cloud Design Services** | `cloud_design`, `cloud_architecture` | One-time cloud design and architecture planning |

#### Day 1 - Deployment & Integration

| Category | Buckets | Description |
|----------|---------|-------------|
| **Cluster Services (per DC)** | `cloud_deployment_services`, `cluster_bringup`, `cicd_pipeline_setup`, `observability_setup` | Per-DC cluster deployment costs |
| **Deployment Services (Network-wide)** | `cloud_deployment_support`, `other_cloud_caas_support` | Network-wide deployment support (per_year_deployment driver) |

#### Day 2 - Operations (Annual)

| Category | Buckets | Description |
|----------|---------|-------------|
| **Platform Operations** | `observability_ops`, `cicd_ops`, `security_ops`, `backup_dr` | Annual platform operations costs |
| **License Support** | Same as Day 0 license buckets | Annual license support costs |

### Grand Total Rollup

The summary includes a rollup table showing:
- **Scope**: Network Global or Site Archetype name
- **DCs**: Number of data centers (for archetypes)
- **Sites**: Number of sites (for archetypes)
- **CUs**: Number of CUs (for archetypes)
- **Day 0**: Total Day 0 costs
- **Day 1**: Total Day 1 costs
- **Day 2 (/yr)**: Annual Day 2 costs

**Component Location**: `src/components/cloud/CloudDollarSummary.tsx`

---

## Code Structure

```typescript
// src/app/(main)/cloud/page.tsx

import { CloudDollarSummary } from '@/components/cloud/CloudDollarSummary';

const cloudServicesBuckets = [
  'cloud_deployment_services',
  'cluster_bringup',
  'cicd_pipeline_setup',
  'observability_setup',
] as const;

const dayTabs = [
  { id: 'day0', label: 'Day 0', icon: <Settings /> },
  { id: 'day1', label: 'Day 1', icon: <Wrench /> },
  { id: 'day2', label: 'Day 2', icon: <Activity /> },
  { id: 'cloud_summary', label: 'Cloud $ Summary', icon: <DollarSign /> },
];

export default function CloudPage() {
  const [activeDay, setActiveDay] = useState('day0');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Tabs tabs={dayTabs} activeTab={activeDay} onChange={setActiveDay} />

      {/* Day 0 Inputs */}
      {activeDay === 'day0' && (
        <Card title="Cloud/CaaS Licensing">
          <InputTable
            day="day0"
            domain="cloud"
            layer="software"
            buckets={CloudLicenseBuckets}
          />
        </Card>
      )}

      {/* Day 1 Inputs */}
      {activeDay === 'day1' && (
        <Card title="Cluster Bring-up & Integration">
          <InputTable
            day="day1"
            domain="cloud"
            layer="services"
            buckets={cloudServicesBuckets}
          />
        </Card>
      )}

      {/* Day 2 Inputs */}
      {activeDay === 'day2' && (
        <>
          <Card title="Platform Operations">
            <InputTable day="day2" domain="cloud" layer="services" buckets={PlatformOpsBuckets} />
          </Card>
          <Card title="Cloud License Support">
            <InputTable day="day2" domain="cloud" layer="software" buckets={CloudLicenseBuckets} />
          </Card>
        </>
      )}

      {/* Cloud $ Summary - Uses dedicated Cloud-specific component */}
      {activeDay === 'cloud_summary' && <CloudDollarSummary />}
    </div>
  );
}
```

### File Structure

```
src/components/
├── cloud/
│   └── CloudDollarSummary.tsx    # Cloud-specific summary component
├── ran/
│   └── RanDollarSummary.tsx      # RAN-specific summary (if exists)
└── summary/
    ├── DomainDollarSummary.tsx   # Generic domain summary (used by OSS)
    └── YearlyCostBreakdown.tsx   # Shared yearly breakdown component
```

---

## Integration with Compute Engine

```typescript
// In src/lib/compute/engine.ts

// Day 0 Cloud costs - CAPEX
if (fact.day === 'day0' && fact.domain === 'cloud') {
  if (y === 0) {
    yearCapex = totalValue;
  }
}

// Day 1 Cloud costs - CAPEX
if (fact.day === 'day1' && fact.domain === 'cloud') {
  if (y === 0) {
    yearCapex = totalValue;
  }
}

// Day 2 Cloud costs - OPEX (recurring)
if (fact.day === 'day2' && fact.domain === 'cloud') {
  for (let y = 0; y < years; y++) {
    byYear[y].opex += totalValue;
  }
}
```

---

## Best Practices

### License Model Selection

Choose based on financial preference:
- **Perpetual**: Higher upfront cost, predictable ongoing support
- **Subscription**: No upfront cost, pay-as-you-go, included support

### Platform Sizing

Consider cluster sizing for:
- Edge DCs: Smaller clusters, more locations
- Regional DCs: Medium clusters, aggregation points
- Central DCs: Large clusters, core services

### Operations Budgeting

Plan for ongoing operations costs:
- Observability tooling and operations
- CI/CD pipeline maintenance
- Security monitoring and compliance
- Backup and disaster recovery
