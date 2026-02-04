# OSS Implementation Guide

## Overview

This document covers all OSS/SMO/RIC (Operations Support Systems, Service Management and Orchestration, RAN Intelligent Controller) inputs across the complete lifecycle:
- **Day 0**: Hardware procurement and software licensing
- **Day 1**: Installation and integration
- **Day 2**: Software support and operations staffing
- **OSS $ Summary**: Network-scaled cost rollups across all days

**Page Location**: `src/app/(main)/oss/page.tsx`

**Navigation**: Sidebar → **OSS** → Day 0 / Day 1 / Day 2 / OSS $ Summary tabs

**Note**: The OSS domain also includes **Operations Staffing** for all roles (NOC, SOC, RAN Ops, Cloud Ops, OSS/Automation) in the Day 2 tab, as this is where NOC/SOC operations are typically managed.

---

## Day 0 - Design + Procurement

Day 0 covers all upfront OSS hardware and software procurement costs.

### OSS Hardware BoM

**Scope**: Network-global (single cost entry for entire network, not per archetype)

| Bucket | Description | Driver |
|--------|-------------|--------|
| `site_mgmt_servers` | Site Manager servers | per_server |
| `intelligent_ops_servers` | AI/ML operations servers | per_server |
| `platform_apps_servers` | Platform application servers | per_server |
| `cnp_platform_servers` | CNP platform servers | per_server |
| `cns_platform_servers` | CNS platform servers | per_server |
| `other_oss_servers` | Other OSS servers | per_server |

**Note**: OSS hardware is network-wide infrastructure. Unlike RAN hardware which varies by site type, OSS servers are shared across the entire network and should be entered once with total quantities.

### OSS/SMO/RIC Software

| Bucket | Description |
|--------|-------------|
| `site_manager` | Site Manager license |
| `netpulse` | NetPulse license |
| `inventory_manager` | Inventory Manager |
| `fault_monitoring` | Fault Monitoring |
| `performance_monitoring` | Performance Monitoring |
| `configuration_manager` | Configuration Manager |
| `service_desk` | Service Desk |
| `network_navigator` | Network Navigator |
| `smo_orchestrator` | SMO Orchestrator |
| `non_rt_ric` | Non-RT RIC + rApps |
| `near_rt_ric` | Near-RT RIC + xApps |
| `rapps_license` | Individual rApps |
| `xapps_license` | Individual xApps |
| `ai_platform_license` | AI Platform |

### Day 0 Cost Treatment

All Day 0 OSS costs are treated as **CAPEX**:
1. **Standard CAPEX**: Full amount in Year 0
2. **Spread CAPEX**: If `perpetual_spread_years > 1`, amount divided equally across N years
3. **Support/Maintenance**: For perpetual licenses, 15% annual support added as OPEX starting Year 0

### Perpetual License Spreading Toggle

The "OSS Modules SW Pricing" card includes a toggle to enable perpetual license spreading:

- **Toggle OFF (default)**: All software costs charged as CAPEX in Year 0
- **Toggle ON**: Sets `licenseModel='perpetual'` on all OSS software InputFacts, spreading costs over the number of years defined by "Perpetual License Spread (Years)" in the Setup tab

When enabled, the toggle displays the spread duration (e.g., "Over 3 years"). The spreading is reflected in both the OSS Summary yearly breakdown and the Dashboard TCO calculations.

---

## Day 1 - Build, Install, Integrate

Day 1 covers all OSS installation and integration service costs. The UI is organized into two collapsible groups.

### OSS Installation & Integration

**Scope**: Network-global (single cost entry for entire network, not per archetype)

The table displays two expandable/collapsible groups:

#### OSS Installation Group (Fixed Driver)

One-time installation costs:

| Bucket | Description | Driver |
|--------|-------------|--------|
| `oss_server_install` | OSS Servers (Install) | fixed |
| `oss_server_sw_onboarding` | OSS Servers (SW Onboarding) | fixed |

**Input Method**: Single value input per bucket.

#### OSS Integration Group (Per-Integration Driver)

Integration costs using Count × Per-Unit:

| Bucket | Description | Driver |
|--------|-------------|--------|
| `oss_ran_integration` | RAN Integrations | per_integration |
| `oss_transport_integration` | Transport Integrations | per_integration |
| `oss_mw_integration` | MW Integrations | per_integration |
| `oss_northbound_integration` | North Bound Integrations | per_integration |
| `oss_southbound_integration` | South Bound Integrations | per_integration |
| `oss_other_integration` | Other Integrations | per_integration |

**Input Method**: Each row has:
- **Count**: Number of integrations (stored in `valueJson` as `{"count": N}`)
- **Per-Unit**: Cost per integration (stored in `valueNumber`)
- **Total**: Computed as Count × Per-Unit (displayed, not stored)

**Data Storage Example**:
```json
{
  "bucket": "oss_ran_integration",
  "valueNumber": 25000,           // per-unit cost
  "valueJson": "{\"count\": 5}",  // number of integrations
  "driver": "per_integration"
  // Total = 25000 × 5 = $125,000
}
```

**Note**: OSS installation and integration costs are network-wide one-time costs recognized in Year 0.

### Deployment Services

Network-wide OSS deployment support costs that vary by year. These use the `per_year_deployment` driver and are only applied in years with deployment activity.

| Bucket | Description | Driver | Scope |
|--------|-------------|--------|-------|
| `oss_deployment_support` | OSS Deployment Support | per_year_deployment | network_global |
| `rapp_development_support` | rApp Development Support | per_year_deployment | network_global |
| `oss_integration_support` | OSS Integration Support | per_year_deployment | network_global |

**Input Method**: YearlyInputTable with per-year cost fields (Y1, Y2, Y3, etc.)

**Data Storage**: Values stored in `InputFact.valueJson` as `{"year_0": 50000, "year_1": 60000, ...}`

**Cost Application**: Only charged in years with deployments (sites/CUs/DCs > 0)

### Day 1 Cost Treatment

All Day 1 OSS costs are treated as **CAPEX**:
- Full amount recognized in Year 0 (or first year of deployment)
- No recurring component (these are one-time services)
- **Deployment Services**: Applied per-year based on `valueJson` values, only in deployment years

---

## Day 2 - Operations

Day 2 covers all recurring software support and operations staffing costs.

### OSS Software Support

Annual subscriptions or support for OSS components:

| Bucket | Description |
|--------|-------------|
| `site_manager` | Site Manager subscription |
| `netpulse` | NetPulse subscription |
| `inventory_manager` | Inventory Manager subscription |
| `fault_monitoring` | Fault Monitoring subscription |
| `performance_monitoring` | Performance Monitoring subscription |
| `configuration_manager` | Config Manager subscription |
| `service_desk` | Service Desk subscription |
| `network_navigator` | Network Navigator subscription |
| `smo_orchestrator` | SMO Orchestrator subscription |
| `non_rt_ric` | Non-RT RIC subscription |
| `near_rt_ric` | Near-RT RIC subscription |
| `rapps_license` | rApps annual fees |
| `xapps_license` | xApps annual fees |
| `ai_platform_license` | AI Platform subscription |

### Operations Staffing

**Note**: All staffing roles across all domains are consolidated here in the OSS domain.

Annual personnel costs by role:

| Role | Description |
|------|-------------|
| `noc` | Network Operations Center |
| `soc` | Security Operations Center |
| `ran_ops` | RAN Operations |
| `cloud_ops` | Cloud/Platform Operations |
| `oss_automation_ops` | OSS and Automation Operations |

### Staffing Drivers (Future Enhancement)

Parameters that affect staffing requirements:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `coverage_factor` | 4.2 | 24x7 coverage multiplier |
| `events_per_site_per_period` | 10 | Events per site per period |
| `auto_remediation_pct` | 60% | % of events auto-remediated |
| `auto_containment_pct` | 40% | % of threats auto-contained |
| `handling_time_minutes` | 30 | Average handling time |
| `complexity_multiplier` | 1.0 | Complexity adjustment |

### Day 2 Cost Treatment

All Day 2 OSS costs are treated as **OPEX**:
- Recurring annually for the duration of the TCO (`tco_years`)
- Applied every year from Year 0 through Year N-1
- Subject to NPV discounting

---

## OSS $ Summary Tab

The **OSS $ Summary** tab provides a consolidated view of all OSS costs:

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
- **Per-Server Costs**: Unit value × 1 (not scaled)
- **Per-License Costs**: Unit value × 1 (not scaled)
- **Per-DC Costs**: Unit value × Total DCs
- **Annual Costs**: Per-year recurring

**Note**: `per_server` and `per_license_unit` drivers use a multiplier of 1 (costs are displayed as entered without network scaling).

**Component Location**: `src/components/summary/DomainDollarSummary.tsx`

---

## Code Structure

```typescript
// src/app/(main)/oss/page.tsx

import { DomainDollarSummary } from '@/components/summary/DomainDollarSummary';
import {
  OssBomBuckets,
  OssSoftwareBuckets,
  StaffingRoles,
  OssDay1DeploymentBuckets,
  OssDay1ServicesBuckets,
  OssDay1ServicesBucketGroups,
  OssIntegrationBuckets,
} from '@/lib/model/taxonomy';

const dayTabs = [
  { id: 'day0', label: 'Day 0', icon: <Settings /> },
  { id: 'day1', label: 'Day 1', icon: <Wrench /> },
  { id: 'day2', label: 'Day 2', icon: <Activity /> },
  { id: 'oss_summary', label: 'OSS $ Summary', icon: <DollarSign /> },
];

export default function OssPage() {
  const [activeDay, setActiveDay] = useState('day0');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Tabs tabs={dayTabs} activeTab={activeDay} onChange={setActiveDay} />

      {/* Day 0 Inputs */}
      {activeDay === 'day0' && (
        <>
          <Card title="OSS Hardware BoM">
            <InputTable day="day0" domain="oss" layer="hardware_bom" buckets={OssBomBuckets} />
          </Card>
          <Card title="OSS/SMO/RIC Software Procurement">
            <InputTable day="day0" domain="oss" layer="software" buckets={OssSoftwareBuckets} />
          </Card>
        </>
      )}

      {/* Day 1 Inputs */}
      {activeDay === 'day1' && (
        <Card title="OSS Installation & Integration">
          <InputTable
            day="day1"
            domain="oss"
            layer="services"
            buckets={OssDay1ServicesBuckets}
            defaultDriver="fixed"
            defaultScope="network_global"
            bucketGroups={OssDay1ServicesBucketGroups}
            integrationBuckets={OssIntegrationBuckets}
          />
        </Card>
      )}

      {/* Day 2 Inputs */}
      {activeDay === 'day2' && (
        <>
          <Card title="OSS Software Support">
            <InputTable day="day2" domain="oss" layer="software" buckets={OssSoftwareBuckets} />
          </Card>

          {/* Staffing Section */}
          <div className="pt-4 border-t border-gray-800">
            <h2>Operations Staffing</h2>
          </div>

          <Card title="Operations Staffing">
            <InputTable day="day2" domain="oss" layer="staffing" buckets={StaffingRoles} />
          </Card>

          <Card variant="gradient" title="Staffing Drivers (Coming Soon)">
            {/* Coverage Factor, Auto-Remediation %, Auto-Containment % */}
          </Card>
        </>
      )}

      {/* OSS $ Summary */}
      {activeDay === 'oss_summary' && <DomainDollarSummary domain="oss" />}
    </div>
  );
}
```

### InputTable Integration Features

The `InputTable` component now supports integration buckets with count × value UI:

```typescript
// For integration buckets (per_integration driver)
interface InputTableProps {
  // ... existing props
  bucketGroups?: BucketGroup[];         // Groups for collapsible sections
  integrationBuckets?: readonly string[]; // Buckets using count × value
}

// When integrationBuckets is provided:
// - Rows display Count | Per-Unit | Total columns
// - Count is stored in valueJson as {"count": N}
// - Per-Unit is stored in valueNumber
// - Total is computed (count × per-unit)
```

---

## Calculation Examples

### Staffing Cost

For a 24x7 NOC:
- FTE cost: $100,000/year
- Coverage factor: 4.2
- Required FTEs: 10 (based on workload)

Annual NOC Cost = 10 × $100,000 × 4.2 = $4.2M/year

### License Support

For perpetual licenses purchased in Day 0:
- Day 0 License CAPEX: $10M
- Annual Support Rate: 15%
- Annual Support OPEX: $1.5M/year

---

## Automation Impact

Higher automation levels reduce staffing needs:

| Metric | Low Automation | High Automation |
|--------|----------------|-----------------|
| Auto-remediation | 30% | 80% |
| Auto-containment | 20% | 70% |
| Handling time | 45 min | 15 min |
| FTE requirement | Baseline | -40% |

The staffing model can be enhanced to calculate FTE requirements based on these drivers.

---

## Best Practices

### Staffing Benchmarks

Industry benchmarks for sites-per-FTE:
- Traditional OSS: 50-100 sites/FTE
- With automation: 200-500 sites/FTE
- High automation: 500-1000 sites/FTE

### License Support Rates

Typical support rates:
- Perpetual licenses: 15-20% of license value
- Subscription: Included in subscription fee
- Premium support: 20-25%

### Integration Planning

Consider the number of integrations required:
- NMS/EMS integration points
- Transport network integration
- Existing OSS/BSS integration
- Security tool integration
