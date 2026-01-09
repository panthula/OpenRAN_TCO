# TCO Taxonomy Documentation

## Overview

The taxonomy defines the canonical structure for all TCO inputs. It ensures every cost item is queryable by multiple dimensions and can be aggregated in various ways.

**Location**: `src/lib/model/taxonomy.ts`

## Dimensional Axes

### Axis 1: Day (Lifecycle Phase)

```typescript
export const Days = ['day0', 'day1', 'day2'] as const;
```

| Value | Label | Description |
|-------|-------|-------------|
| `day0` | Day 0 - Design + Procurement | Hardware/software procurement, planning |
| `day1` | Day 1 - Build, Install, Integrate | Physical installation, commissioning, testing |
| `day2` | Day 2 - Operations | Recurring costs, staffing, lifecycle management |

### Axis 2: Domain

```typescript
export const Domains = ['ran', 'cloud', 'oss'] as const;
```

| Value | Label | Description |
|-------|-------|-------------|
| `ran` | RAN | Radio Access Network (DU, CU, radios, antennas) |
| `cloud` | Cloud/CaaS | Container platform, Kubernetes, storage |
| `oss` | OSS/SMO/RIC | Operations support, SMO platform, xApps/rApps |

### Axis 3: Layer

```typescript
export const Layers = [
  'hardware_bom',
  'software',
  'services',
  'staffing',
  'site_opex',
  'lifecycle',
  'assumptions',
] as const;
```

| Value | Description |
|-------|-------------|
| `hardware_bom` | Physical hardware costs (servers, radios, antennas) |
| `software` | Software licenses (perpetual or subscription) |
| `services` | Professional services (planning, installation, integration) |
| `staffing` | Personnel costs (NOC, SOC, RAN ops, etc.) |
| `site_opex` | Recurring site costs (lease, power, backhaul) |
| `lifecycle` | Ongoing lifecycle (patching, upgrades, expansion) |
| `assumptions` | Model parameters (TCO years, discount rate) |

### Axis 4: Bucket Keys

Buckets are standardized cost categories. Each bucket maps to a specific type of cost.

#### RAN Site Hardware BoM

```typescript
export const RanSiteBomBuckets = [
  'du_server',           // DU Server (Compute, accelerators, NICs)
  'radios',              // Radios (Units & Ancillaries)
  'antennas',            // Antennas
  'cell_site_router_or_fh_switch',  // Cell Site Router / Fronthaul Switch
  'gps_equipment',       // GPS Equipment
  'power_systems',       // Power Systems (rectifiers, batteries)
  'outdoor_infrastructure', // Outdoor Infrastructure (cabinets, racks, cooling)
  'ancillary_and_passive',  // Ancillary & Passive (cables, jumpers, grounding)
  'other_ran_site',      // Other (spares, staging)
] as const;
```

#### RAN CU-in-DC Hardware BoM

```typescript
export const RanCuDcBomBuckets = [
  'cu_server',           // CU Server (CU-CP, CU-UP servers)
  'switches_tor_oob',    // Switches (TOR, OOB & Support, SW)
  'iptx_equipment',      // IPTX Equipment
  'rack_accessories',    // Rack Accessories (PDUs, cables, jumpers)
  'other_ran_cu',        // Other (spares, staging)
] as const;
```

#### OSS Hardware BoM

```typescript
export const OssBomBuckets = [
  'site_mgmt_servers',       // Site Management Servers
  'intelligent_ops_servers', // Intelligent Operations Servers
  'platform_apps_servers',   // Platform Applications Servers
  'cnp_platform_servers',    // CNP Platform Servers
  'cns_platform_servers',    // CNS Platform Servers
  'other_oss_servers',       // Other OSS Servers
] as const;
```

#### RAN Software

The RAN software buckets are split into **Site-scoped** and **DC-scoped** categories for cleaner cost entry:

```typescript
// All RAN Software buckets (combined)
export const RanSoftwareBuckets = [
  'du_software_per_site',    // DU Software (per site)
  'ru_software_per_site',    // RU Software (per site)
  'cu_software_per_cu',      // CU Software (per DC)
  '3pp_licenses_per_dc',     // 3PP Licenses (per DC)
  'other_ran_software',      // Other One-time Licenses
] as const;

// RAN Software - Site buckets (per-site scoped)
export const RanSoftwareSiteBuckets = [
  'du_software_per_site',    // DU Software (per site)
  'ru_software_per_site',    // RU Software (per site)
] as const;

// RAN Software - DC buckets (per-DC scoped)
export const RanSoftwareDcBuckets = [
  'cu_software_per_cu',      // CU Software (per DC)
  '3pp_licenses_per_dc',     // 3PP Licenses (per DC)
  'other_ran_software',      // Other One-time Licenses
] as const;
```

| Bucket Array | Scope | Default Driver | Use Case |
|--------------|-------|----------------|----------|
| `RanSoftwareSiteBuckets` | Site Archetype | `per_site` | DU/RU software entered per-site |
| `RanSoftwareDcBuckets` | DC Type | `per_dc` | CU software, 3PP licenses entered per-DC |

#### Cloud/CaaS Licenses

```typescript
export const CloudLicenseBuckets = [
  'cloud_per_du_at_site',    // Cloud License (per DU at Site)
  'cloud_per_cu_server',     // Cloud License (per CU Server)
  'cloud_per_oss_server',    // Cloud License (per OSS Server)
  'storage_licenses',        // Storage Licenses
  'cloud_platform_base',     // Cloud Platform Base License
] as const;
```

#### OSS/SMO/RIC Software

```typescript
export const OssSoftwareBuckets = [
  'site_manager',            // Site Manager
  'netpulse',                // NetPulse
  'inventory_manager',       // Inventory Manager
  'fault_monitoring',        // Fault Monitoring
  'performance_monitoring',  // Performance Monitoring
  'configuration_manager',   // Configuration Manager
  'service_desk',            // Service Desk
  'network_navigator',       // Network Navigator
  'smo_orchestrator',        // SMO Orchestrator
  'non_rt_ric',              // Non-RT RIC + rApps
  'near_rt_ric',             // Near-RT RIC + xApps
  'rapps_license',           // rApps Licenses
  'xapps_license',           // xApps Licenses
  'ai_platform_license',     // AI Platform License
  'other_oss_software',      // Other OSS Software
] as const;
```

#### Services (Day0/Day1)

```typescript
export const ServicesBuckets = [
  // Day0 Planning & Engineering
  'rf_planning',
  'ip_sync_planning',
  'cloud_planning',
  'oss_smo_planning',
  'security_planning',
  'acceptance_criteria_dev',
  // Day1 Installation
  'site_installation',
  'dc_installation',
  'ru_du_cu_commissioning',
  'transport_fiber_integration',
  'automation_ztp_enablement',
  'site_acceptance_testing',
  'cluster_acceptance_testing',
  'network_acceptance_testing',
  'drive_tests',
  'security_validation',
  // Day1 Cloud
  'cluster_bringup',
  'cicd_pipeline_setup',
  'observability_setup',
  // Day1 OSS
  'oss_installation',
  'oss_integration',
  'oss_automation_ztp',
] as const;
```

#### Site OPEX (Day2)

```typescript
export const SiteOpexBuckets = [
  'lease_per_site',     // Lease (per site per year)
  'power_per_site',     // Power (per site per year)
  'backhaul_per_site',  // Backhaul (per site per year)
] as const;
```

#### Lifecycle (Day2)

```typescript
export const LifecycleBuckets = [
  'patching',
  'upgrades',
  'vulnerability_management',
  'capacity_expansion',
  'new_apps_introduction',
] as const;
```

#### Staffing Roles (Day2)

```typescript
export const StaffingRoles = [
  'noc',
  'soc',
  'ran_ops',
  'cloud_ops',
  'oss_automation_ops',
] as const;
```

### Axis 5: Scope Type

```typescript
export const ScopeTypes = ['site_archetype', 'dc_type', 'network_global'] as const;
```

| Value | Description |
|-------|-------------|
| `site_archetype` | Cost varies by site type (Urban Macro, Rural, etc.) |
| `dc_type` | Cost varies by DC type (Edge, Regional, Central) |
| `network_global` | Single value for entire network |

### Axis 6: Scaling Drivers

```typescript
export const ScalingDrivers = [
  'per_site',
  'per_cu',
  'per_dc',
  'per_server',
  'per_cluster',
  'per_license_unit',
  'per_rapp',
  'per_xapp',
  'per_integration',
  'fixed',
  'per_year',
] as const;
```

## Utility Functions

### getBucketLabel(bucket)

Returns the human-readable label for any bucket key.

```typescript
import { getBucketLabel } from '@/lib/model/taxonomy';

getBucketLabel('du_server'); 
// Returns: "DU Server (Compute, accelerators, NICs, Ancillaries)"
```

### getConfigsForDayAndDomain(day, domain)

Returns the valid input configurations for a specific day and domain.

```typescript
import { getConfigsForDayAndDomain } from '@/lib/model/taxonomy';

const configs = getConfigsForDayAndDomain('day0', 'ran');
// Returns array of InputConfig objects with buckets, defaultDriver, defaultScope
```

## Adding New Buckets

To add a new bucket:

1. Add the key to the appropriate bucket array in `taxonomy.ts`
2. Add a label to the corresponding Labels record
3. Add any new InputConfigurations if needed
4. The InputTable component will automatically pick it up

Example:

```typescript
// In RanSiteBomBuckets array
export const RanSiteBomBuckets = [
  // ... existing buckets
  'new_equipment',  // Add new bucket key
] as const;

// In RanSiteBomLabels record
export const RanSiteBomLabels: Record<RanSiteBomBucket, string> = {
  // ... existing labels
  new_equipment: 'New Equipment Description',
};
```

