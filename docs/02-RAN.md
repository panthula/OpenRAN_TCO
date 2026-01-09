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

### RAN CU-in-DC Hardware BoM

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

CU software and DC-level licenses by DC type:

| Bucket | Description | Driver | Scope |
|--------|-------------|--------|-------|
| `cu_software_per_cu` | CU software license | per_dc | dc_type |
| `3pp_licenses_per_dc` | Third-party licenses | per_dc | dc_type |
| `other_ran_software` | Other one-time licenses | per_dc | dc_type |

### Day 0 Cost Treatment

All Day 0 RAN costs are treated as **CAPEX**:
1. **Standard CAPEX**: Full amount in Year 0
2. **Spread CAPEX**: If `perpetual_spread_years > 1`, amount divided equally across N years
3. **Support/Maintenance**: For perpetual licenses, 15% annual support added as OPEX starting Year 0

---

## Day 1 - Build, Install, Integrate

Day 1 covers all installation, commissioning, testing, and integration service costs.

### Physical Installation

Per-site costs by archetype:

| Bucket | Description | Driver |
|--------|-------------|--------|
| `site_installation` | Site installation (labor, rigging) | per_site |
| `dc_installation` | DC installation for CU racks | per_dc |
| `ru_du_cu_commissioning` | RU/DU/CU commissioning | per_site |
| `transport_fiber_integration` | Transport and fiber integration | per_site |
| `automation_ztp_enablement` | Automation/ZTP enablement | per_site |

### Testing & Acceptance

| Bucket | Description | Driver |
|--------|-------------|--------|
| `site_acceptance_testing` | Individual site acceptance | per_site |
| `cluster_acceptance_testing` | Cluster-level testing | per_cluster |
| `network_acceptance_testing` | Network-wide acceptance | fixed |
| `drive_tests` | Drive testing | per_site |
| `security_validation` | Security validation | per_cluster |

### Day 1 Cost Treatment

All Day 1 RAN costs are treated as **CAPEX**:
- Full amount recognized in Year 0 (or first year of deployment)
- No recurring component (these are one-time services)
- May be spread if deployment is phased across years

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

### Per-Day Breakdown Tables

Each day shows a breakdown by driver type:
- **Per-Site Costs**: Unit value × Total Sites
- **Per-CU Costs**: Unit value × Total CUs
- **Per-DC Costs**: Unit value × Total DCs
- **Fixed Costs**: One-time amounts

**Component Location**: `src/components/ran/RanDollarSummary.tsx`

---

## Code Structure

```typescript
// src/app/(main)/ran/page.tsx

import { RanDollarSummary } from '@/components/ran/RanDollarSummary';

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
          <InputTable ... buckets={RanCuDcBomBuckets} defaultScope="dc_type" />
          <InputTable ... buckets={RanSoftwareSiteBuckets} defaultScope="site_archetype" />
          <InputTable ... buckets={RanSoftwareDcBuckets} defaultScope="dc_type" />
        </>
      )}

      {/* Day 1 Inputs */}
      {activeDay === 'day1' && (
        <>
          <InputTable ... buckets={ranInstallationBuckets} />
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
      {activeDay === 'ran_summary' && <RanDollarSummary />}
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
