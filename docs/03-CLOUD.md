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

| Bucket | Description | Driver |
|--------|-------------|--------|
| `cloud_per_du_at_site` | CaaS license per DU | per_site |
| `cloud_per_cu_server` | CaaS license per CU | per_cu |
| `cloud_per_oss_server` | CaaS license per OSS server | per_server |
| `storage_licenses` | Storage platform licenses | fixed |
| `cloud_platform_base` | Base platform license | fixed |

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

### Day 1 Cost Treatment

All Day 1 Cloud costs are treated as **CAPEX**:
- Full amount recognized in Year 0 (or first year of deployment)
- No recurring component (these are one-time services)

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

| Bucket | Description | Driver |
|--------|-------------|--------|
| `cloud_per_du_at_site` | CaaS support per DU | per_site per year |
| `cloud_per_cu_server` | CaaS support per CU | per_cu per year |
| `cloud_per_oss_server` | CaaS support per OSS server | per_server per year |
| `storage_licenses` | Storage support | fixed per year |
| `cloud_platform_base` | Base platform support | fixed per year |

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

The **Cloud $ Summary** tab provides a consolidated view of all Cloud costs:

### Network Counts Display
- **Total Sites**: Sum of `numSites` across all site archetypes
- **Total CUs**: Sum of `numCus` across all site archetypes
- **Total DCs**: Sum of `numDcs` across all DC types

### Cost Rollups

| Section | Description | Value Type |
|---------|-------------|------------|
| **One-Time Total** | Day 0 + Day 1 combined | Network-scaled |
| **Annual Run-Rate** | Day 2 recurring costs | Per year |

### Per-Day Breakdown Tables

Each day shows a breakdown by driver type:
- **Per-Site Costs**: Unit value × Total Sites
- **Per-DC Costs**: Unit value × Total DCs
- **Fixed Costs**: One-time amounts
- **Annual Costs**: Per-year recurring

**Component Location**: `src/components/summary/DomainDollarSummary.tsx`

---

## Code Structure

```typescript
// src/app/(main)/cloud/page.tsx

import { DomainDollarSummary } from '@/components/summary/DomainDollarSummary';

const cloudServicesBuckets = [
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

      {/* Cloud $ Summary */}
      {activeDay === 'cloud_summary' && <DomainDollarSummary domain="cloud" />}
    </div>
  );
}
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
