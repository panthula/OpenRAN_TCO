# RAN Implementation Guide

## Overview

This document covers all Radio Access Network (RAN) inputs across the complete lifecycle:
- **Day 0**: Hardware procurement and software licensing
- **Day 1**: Installation, commissioning, and testing
- **Day 2**: Recurring site costs, software support, and lifecycle management
- **RAN $ Summary**: Network-scaled cost rollups across all days

**Page Location**: `src/app/(main)/ran/page.tsx`

**Navigation**: Sidebar → **RAN** → Day 0 / Day 1 / Day 2 / RAN $ Summary tabs

## UI Features

### Bucket Totals
Each input table displays:
- **Table Total**: Sum of all values in the header area (next to "Save Changes")
- **Scope Group Subtotals**: Sum per archetype/DC type in each group header row

### Numeric Inputs
- Number inputs use clean text entry without spinner controls
- Values are entered in USD
- Changes are highlighted until saved

---

## Day 0 - Design + Procurement

Day 0 covers all upfront hardware and software procurement costs for the RAN domain.

### RAN Site Hardware BoM

Per-site costs by archetype:

| Bucket | Description | Driver |
|--------|-------------|--------|
| `du_server` | DU Server hardware | per_site |
| `radios` | Radio units and ancillaries | per_site |
| `antennas` | Antenna hardware | per_site |
| `cell_site_router_or_fh_switch` | Router/switch for fronthaul | per_site |
| `gps_equipment` | GPS/timing equipment | per_site |
| `power_systems` | Rectifiers, batteries | per_site |
| `outdoor_infrastructure` | Cabinets, racks, cooling | per_site |
| `ancillary_and_passive` | Cables, jumpers, grounding | per_site |
| `other_ran_site` | Spares, staging, misc | per_site |

### DC Hardware BOM

Per-CU costs by DC type:

| Bucket | Description | Driver |
|--------|-------------|--------|
| `cu_server` | CU-CP and CU-UP servers | per_cu |
| `switches_tor_oob` | ToR, OOB switches | per_cu |
| `iptx_equipment` | IP transport equipment | per_cu |
| `rack_accessories` | PDUs, cables, etc. | per_cu |
| `other_ran_cu` | Spares, staging | per_cu |

### RAN - SW /Site

Per-site software licenses by archetype:

| Bucket | Description | Driver | Scope |
|--------|-------------|--------|-------|
| `du_software_per_site` | DU software license | per_site | site_archetype |
| `ru_software_per_site` | RU software license | per_site | site_archetype |

### RAN SW/ DC

CU software and DC-level licenses by site archetype:

| Bucket | Description | Driver | Scope |
|--------|-------------|--------|-------|
| `cu_software_per_cu` | CU software license | per_cu | site_archetype |
| `3pp_licenses_per_dc` | Third-party licenses | per_cu | site_archetype |
| `other_ran_software` | Other one-time licenses | per_cu | site_archetype |

### Day 0 Cost Treatment

All Day 0 RAN costs are treated as **CAPEX**:
1. **Standard CAPEX**: Full amount in Year 0
2. **Spread CAPEX**: If `perpetual_spread_years > 1`, amount divided equally across N years
3. **Support/Maintenance**: For perpetual licenses, 15% annual support added as OPEX starting Year 0

---

## Day 1 - Build, Install, Integrate

Day 1 covers all installation, commissioning, testing, and integration service costs.

### Physical Installation

The Physical Installation card is split into two sub-sections with different scaling drivers:

#### Site Installation (per_site)

| Bucket | Description | Driver | Scope |
|--------|-------------|--------|-------|
| `site_installation` | Site installation (labor, rigging) | per_site | site_archetype |
| `transport_fiber_integration` | DU configuration | per_site | site_archetype |
| `automation_ztp_enablement` | IPTX configuration | per_site | site_archetype |

#### DC Installation (per_dc)

| Bucket | Description | Driver | Scope |
|--------|-------------|--------|-------|
| `dc_installation` | DC installation for CU racks | per_dc | site_archetype |
| `ru_du_cu_commissioning` | All IPTX configuration | per_dc | site_archetype |

### Testing & Acceptance

| Bucket | Description | Driver | Summary Display |
|--------|-------------|--------|-----------------|
| `site_acceptance_testing` | Individual site acceptance | per_site | Scales with sites |
| `cluster_acceptance_testing` | Cluster-level testing | per_site | Fixed (×1) |
| `network_acceptance_testing` | Network-wide acceptance | per_site | Fixed (×1) |
| `drive_tests` | Drive testing | per_site | Fixed (×1) |
| `security_validation` | Security validation | per_site | Fixed (×1) |

> **Note**: In the RAN $ Summary tab, `cluster_acceptance_testing`, `network_acceptance_testing`, `drive_tests`, and `security_validation` are displayed with a fixed multiplier of 1, regardless of their input driver. Only `site_acceptance_testing` scales with the number of sites.

### Integration

| Bucket | Description | Driver | Summary Display |
|--------|-------------|--------|-----------------|
| `site_integration` | Per-site integration work | per_site | Scales with sites |
| `core_integration` | Core network integration | per_site | Fixed (×1) |
| `other_integration` | Other integration costs | per_site | Fixed (×1) |

> **Note**: In the RAN $ Summary tab, `core_integration` and `other_integration` are displayed with a fixed multiplier of 1. Only `site_integration` scales with the number of sites.

### Deployment Services

Network-wide deployment support costs that vary by year. These use the `per_year_deployment` driver and are only applied in years with deployment activity.

| Bucket | Description | Driver | Scope |
|--------|-------------|--------|-------|
| `ran_engineering_support` | RAN Engineering Support | per_year_deployment | network_global |
| `core_engineering_support` | Core Engineering Support | per_year_deployment | network_global |
| `ip_transport_support` | IP/Transport Support | per_year_deployment | network_global |
| `product_support` | Product Support | per_year_deployment | network_global |

**Input Method**: YearlyInputTable with per-year cost fields (Y1, Y2, Y3, etc.)

**Data Storage**: Values stored in `InputFact.valueJson` as `{"year_0": 50000, "year_1": 60000, ...}`

**Cost Application**: Only charged in years with deployments (sites/CUs/DCs > 0)

### Day 1 Cost Treatment

All Day 1 RAN costs are treated as **CAPEX**:
- Full amount recognized in Year 0 (or first year of deployment)
- No recurring component (these are one-time services)
- May be spread if deployment is phased across years
- **Deployment Services**: Applied per-year based on `valueJson` values, only in deployment years

### Scaling Examples

**Per-Site Costs**:
- Urban Macro: 500 sites @ $15,000/site installation
- Rural: 200 sites @ $20,000/site installation
- Total Site Installation = (500 × $15,000) + (200 × $20,000) = $11.5M

**Fixed Costs**:
- Network acceptance testing: $200,000 (one-time, regardless of scale)

---

## Day 2 - Operations

Day 2 covers all recurring operational costs, software support, and lifecycle management.

### Site OPEX

Annual per-site recurring costs:

| Bucket | Description | Driver |
|--------|-------------|--------|
| `lease_per_site` | Site lease/rent | per_site per year |
| `power_per_site` | Power consumption | per_site per year |
| `backhaul_per_site` | Backhaul connectivity | per_site per year |

### RAN Software Support

Annual maintenance/support for RAN software:

| Bucket | Description | Driver |
|--------|-------------|--------|
| `du_software_per_site` | DU software support | per_site per year |
| `ru_software_per_site` | RU software support | per_site per year |
| `cu_software_per_cu` | CU software support | per_cu per year |
| `3pp_licenses_per_dc` | 3PP license support | per_dc per year |
| `other_ran_software` | Other license support | fixed per year |

### Lifecycle Management

Annual lifecycle costs:

| Bucket | Description | Driver |
|--------|-------------|--------|
| `patching` | Patching operations | per_year |
| `upgrades` | Software/hardware upgrades | per_year |
| `vulnerability_management` | Security vulnerability mgmt | per_year |
| `capacity_expansion` | Capacity expansion costs | per_year |
| `new_apps_introduction` | New xApps/rApps intro | per_year |

### Day 2 Cost Treatment

All Day 2 RAN costs are treated as **OPEX**:
- Recurring annually for the duration of the TCO (`tco_years`)
- Applied every year from Year 0 through Year N-1
- Subject to NPV discounting

### Calculation Examples

**Annual Site OPEX**:
- 1,000 total sites
- Lease: $1,500/site/year, Power: $2,000/site/year, Backhaul: $500/site/year
- Annual Site OPEX = 1,000 × ($1,500 + $2,000 + $500) = $4M/year
- Over 5 years = $20M

---

## RAN $ Summary Tab

The **RAN $ Summary** tab provides a consolidated view of all RAN costs:

### Network Counts Display
- **Total Sites**: Sum of `numSites` across all site archetypes
- **Total CUs**: Sum of `numCus` across all site archetypes
- **Total DCs**: Sum of `numDcs` across all DC types

### Cost Rollups

| Section | Description | Value Type |
|---------|-------------|------------|
| **One-Time Total** | Day 0 + Day 1 combined | Network-scaled |
| **Annual Run-Rate** | Day 2 recurring costs | Per year |

### Per-Day Breakdown Sections

#### Day 0 - Design & Procurement

| Section | Description | Multiplier Display |
|---------|-------------|-------------------|
| **Hardware BoM (Site)** | Per-site hardware costs | × N sites |
| **Hardware (per DC)** | DC-scoped hardware (CU servers, switches) | × N DCs |
| **Software Licenses (Site)** | Per-site software | × N sites |
| **Software Licenses (per DC)** | DC-scoped software | × N DCs |

#### Day 1 - Build & Integration

| Section | Description | Multiplier Display |
|---------|-------------|-------------------|
| **Installation (Site)** | Per-site installation costs | × N sites |
| **Installation (per DC)** | DC-scoped installation | × N DCs |
| **Testing & Acceptance** | Testing costs (see note below) | × N sites or ×1 |
| **Integration** | Integration costs (see note below) | × N sites or ×1 |

**Fixed Multiplier Override**: The following buckets always display with multiplier = 1 in the summary, regardless of their input driver:
- Testing: `cluster_acceptance_testing`, `network_acceptance_testing`, `drive_tests`, `security_validation`
- Integration: `core_integration`, `other_integration`

Only `site_acceptance_testing` and `site_integration` scale with the site count.

#### Day 2 - Operations (Annual)

Shows recurring annual costs with appropriate multipliers (per_site, per_year, etc.).

### Yearly Cost Breakdown

The **Yearly Cost Breakdown** card shows Day 0/1/2 costs broken down by year and archetype, enabling visibility into how costs evolve with phased deployments.

#### Features

- **Collapsible Year Rows**: Click any year row to expand/collapse archetype details
- **Color-Coded Columns**: Day 0 (cyan), Day 1 (purple), Day 2 (amber)
- **Deployment Tracking**: Shows sites deployed per year and cumulative totals
- **CAPEX/OPEX Phasing**: Day 0/1 uses this year's deployments, Day 2 uses cumulative

#### Table Structure

| Column | Description |
|--------|-------------|
| Year | Year index (Y1, Y2, etc.) |
| Archetype | Site archetype name or "Network Global" |
| Sites | Cumulative sites deployed through this year |
| Day 0 | CAPEX procurement costs for new deployments |
| Day 1 | CAPEX installation costs for new deployments |
| Day 2 | OPEX operations costs (scales with cumulative sites) |
| Total | Sum of Day 0 + Day 1 + Day 2 for the row |

#### Cost Calculation Logic

```typescript
// Day 0/1 (CAPEX) - uses THIS YEAR's deployments
if (fact.day === 'day0' || fact.day === 'day1') {
  multiplier = getMultiplier(fact.driver, sitesThisYear, cusThisYear, dcsThisYear);
}

// Day 2 (OPEX) - uses CUMULATIVE deployments
if (fact.day === 'day2') {
  multiplier = getMultiplier(fact.driver, cumulativeSites, cumulativeCus, cumulativeDcs);
}
```

This matches the compute engine logic in `src/lib/compute/engine.ts`.

#### Example: 3-Year Phased Deployment

For an archetype with 300 sites deployed as 100/150/50:

| Year | Sites This Year | Cumulative | Day 0 | Day 1 | Day 2 |
|------|-----------------|------------|-------|-------|-------|
| Y1 | 100 | 100 | $5.0M | $1.5M | $1.2M |
| Y2 | 150 | 250 | $7.5M | $2.3M | $3.0M |
| Y3 | 50 | 300 | $2.5M | $0.8M | $3.6M |

- Day 0/1 costs scale with sites deployed that year
- Day 2 costs grow as more sites become operational

#### One-Time vs Recurring Costs

| Cost Type | Scope | Years Applied |
|-----------|-------|---------------|
| Day 0 (Procurement) | Network Global | Year 0 only |
| Day 0 (Procurement) | Site Archetype | Years with deployments |
| Day 1 (Installation) | Network Global | Year 0 only |
| Day 1 (Installation) | Site Archetype | Years with deployments |
| Day 2 (Operations) | All | Every year (cumulative scale) |

**Network Global costs** (RF planning, network integration, etc.) are one-time charges in Year 0 only.

**Archetype-scoped costs** appear in years where that archetype has deployments.

**Fixed multiplier costs** (testing, integration) only appear in years with actual deployments - they are not charged in years with no new sites/CUs/DCs.

**Component Location**: `src/components/summary/YearlyCostBreakdown.tsx`

**Utility Location**: `src/lib/utils/yearly-breakdown.ts`

**Component Location**: `src/components/summary/DomainDollarSummary.tsx`

---

## Code Structure

```typescript
// src/app/(main)/ran/page.tsx

import { DomainDollarSummary } from '@/components/summary/DomainDollarSummary';

// Day1 service buckets - split by scaling driver
const ranSiteInstallationBuckets = [
  'site_installation',
  'transport_fiber_integration',
  'automation_ztp_enablement',
] as const;

const ranCuInstallationBuckets = [
  'dc_installation',
  'ru_du_cu_commissioning',
] as const;

const dayTabs = [
  { id: 'day0', label: 'Day 0', icon: <Settings /> },
  { id: 'day1', label: 'Day 1', icon: <Wrench /> },
  { id: 'day2', label: 'Day 2', icon: <Activity /> },
  { id: 'ran_summary', label: 'RAN $ Summary', icon: <DollarSign /> },
];

export default function RanPage() {
  const [activeDay, setActiveDay] = useState('day0');

  return (
    <div className="space-y-6">
      <Tabs tabs={dayTabs} activeTab={activeDay} onChange={setActiveDay} />

      {/* Day 0 Inputs */}
      {activeDay === 'day0' && (
        <>
          <InputTable ... buckets={RanSiteBomBuckets} defaultScope="site_archetype" />
          <InputTable ... buckets={RanCuDcBomBuckets} defaultScope="site_archetype" />
          <InputTable ... buckets={RanSoftwareSiteBuckets} defaultScope="site_archetype" />
          <InputTable ... buckets={RanSoftwareDcBuckets} defaultScope="site_archetype" defaultDriver="per_cu" />
        </>
      )}

      {/* Day 1 Inputs - Physical Installation split into sub-sections */}
      {activeDay === 'day1' && (
        <>
          <Card title="Physical Installation">
            {/* Site Installation sub-section */}
            <InputTable ... buckets={ranSiteInstallationBuckets} defaultDriver="per_site" />
            {/* CU Installation sub-section */}
            <InputTable ... buckets={ranCuInstallationBuckets} defaultDriver="per_cu" />
          </Card>
          <InputTable ... buckets={ranTestingBuckets} />
        </>
      )}

      {/* Day 2 Inputs */}
      {activeDay === 'day2' && (
        <>
          <InputTable ... buckets={SiteOpexBuckets} />
          <InputTable ... buckets={RanSoftwareBuckets} />
          <InputTable ... buckets={LifecycleBuckets} />
        </>
      )}

      {/* RAN $ Summary */}
      {activeDay === 'ran_summary' && <DomainDollarSummary domain="ran" />}
    </div>
  );
}
```

---

## Best Practices

### Site OPEX Estimation
- Get actual lease costs from property management
- Estimate power from DU power consumption specs
- Backhaul costs from transport contracts

### Vendor Rate Cards
Input the per-unit rate and let the compute engine calculate totals:
```
Site Installation Rate: $15,000/site
Number of Sites: 500
Total: Calculated automatically
```

### Multi-Year Deployment
If deploying over multiple years, create separate scenarios or use phase-based input:
1. Year 1: 40% of sites
2. Year 2: 40% of sites
3. Year 3: 20% of sites
