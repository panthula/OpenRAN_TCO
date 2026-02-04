# Database Schema Documentation

## Overview

The database uses SQLite via Prisma ORM. The schema is designed for:
- **Versioned scenarios**: Each change creates a new immutable version
- **Granular querying**: Every input queryable by day/domain/layer/bucket
- **Efficient computation**: Computed results stored for fast dashboard queries

**Location**: `prisma/schema.prisma`

## Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Scenario   │────<│ ScenarioVersion  │────<│    InputFact     │
└─────────────┘     └──────────────────┘     └──────────────────┘
      │                     │                        │
      │                     ├──────────────────────>│
      │                     │                        │
      │                     │     ┌──────────────────┐     ┌──────────────────┐
      │                     ├────<│  SiteArchetype   │────<│  DeploymentYear  │
      │                     │     └──────────────────┘     └──────────────────┘
      │                     │
      │                     │     ┌──────────────────┐
      │                     ├────<│  ComputedFact    │
      │                     │     └──────────────────┘
      │                     │
      │                     │     ┌──────────────────┐
      │                     ├────<│    ChangeSet     │
      │                     │     └──────────────────┘
      │                     │
      │                     │     ┌──────────────────┐     ┌──────────────────┐
      │                     └────<│  AdjustmentSet   │────<│  AdjustmentRule  │
      │                           └──────────────────┘     └──────────────────┘
      │
      │     ┌──────────────────┐     ┌──────────────────┐
      └────<│ SweepDefinition  │────<│    SweepRun      │
            └──────────────────┘     └──────────────────┘
```

## Tables

### Scenario

Represents a named TCO model.

```prisma
model Scenario {
  id          String   @id @default(cuid())
  name        String
  description String?
  isBaseline  Boolean  @default(false)
  parentId    String?  // For cloned scenarios
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent   Scenario?  @relation("ScenarioClones")
  clones   Scenario[] @relation("ScenarioClones")
  versions ScenarioVersion[]
  sweeps   SweepDefinition[]
}
```

### ScenarioVersion

Immutable snapshot of inputs. Each edit creates a new version.

```prisma
model ScenarioVersion {
  id          String   @id @default(cuid())
  scenarioId  String
  versionNum  Int
  description String?
  createdAt   DateTime @default(now())
  isActive    Boolean  @default(true)

  scenario       Scenario        @relation(...)
  inputFacts     InputFact[]
  computedFacts  ComputedFact[]
  siteArchetypes SiteArchetype[]
  changeSets     ChangeSet[]
  sweepRuns      SweepRun[]

  @@unique([scenarioId, versionNum])
  @@index([scenarioId])
}
```

### SiteArchetype

Defines a type of cell site with quantity, CUs, DCs, and optional deployment schedule.

```prisma
model SiteArchetype {
  id                 String   @id @default(cuid())
  scenarioVersionId  String
  name               String
  numSites           Int      // Total sites (derived from schedule if present)
  numCus             Int      // Total CUs (derived from schedule if present)
  numDcs             Int      @default(1)  // Total DCs (derived from schedule if present)
  description        String?
  deploymentYears    Int      @default(1)  // Number of years to deploy (1-10)

  scenarioVersion    ScenarioVersion @relation(...)
  deploymentSchedule DeploymentYear[]
  inputFacts         InputFact[]

  @@index([scenarioVersionId])
}
```

### DeploymentYear

Stores per-year deployment counts for phased rollouts.

```prisma
model DeploymentYear {
  id            String @id @default(cuid())
  archetypeId   String
  yearIndex     Int    // 0-based: 0 = Year 1, 1 = Year 2, etc.
  sitesDeployed Int    @default(0)
  cusDeployed   Int    @default(0)
  dcsDeployed   Int    @default(0)

  archetype     SiteArchetype @relation(...)

  @@unique([archetypeId, yearIndex])
  @@index([archetypeId])
}
```

**Usage Notes**:
- `numSites/numCus/numDcs` are derived from `SUM(deploymentSchedule.sitesDeployed)` etc.
- If no schedule exists, all deployments happen in Year 0 (backward compatible)
- Day 0/1 CAPEX uses per-year counts; Day 2 OPEX uses cumulative counts

### InputFact

Core table storing all input values with dimensional keys.

```prisma
model InputFact {
  id                 String   @id @default(cuid())
  scenarioVersionId  String
  
  // Dimensional keys
  day                String   // day0, day1, day2
  domain             String   // ran, cloud, oss
  layer              String   // hardware_bom, software, services, etc.
  bucket             String   // standardized bucket key
  scopeType          String   // site_archetype, network_global
  scopeId            String?  // FK to SiteArchetype (if scopeType is site_archetype)
  driver             String   // scaling driver
  
  // Value
  valueNumber        Float
  valueJson          String?  // JSON for structured inputs
  
  // Metadata
  unit               String   @default("USD")
  currency           String   @default("USD")
  notes              String?
  source             String?
  assumptionFlag     Boolean  @default(false)
  licenseModel       String?  // perpetual or subscription
  spreadYears        Int?     // for perpetual CAPEX spreading
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  scenarioVersion    ScenarioVersion @relation(...)
  siteArchetype      SiteArchetype?  @relation(...)

  // Indexes for efficient querying
  @@index([scenarioVersionId])
  @@index([day])
  @@index([domain])
  @@index([layer])
  @@index([bucket])
  @@index([scopeType, scopeId])
  @@index([scenarioVersionId, day, domain])
  @@index([scenarioVersionId, day, domain, layer])
}
```

### ComputedFact

Stores calculated TCO results for fast dashboard queries.

```prisma
model ComputedFact {
  id                String @id @default(cuid())
  scenarioVersionId String
  
  // Dimensional keys
  metric            String // total, by_day_domain, breakdown
  day               String?
  domain            String?
  layer             String?
  bucket            String?
  year              Int
  
  // Values
  capex             Float  @default(0)
  opex              Float  @default(0)
  tco               Float  @default(0)
  npv               Float?
  
  createdAt         DateTime @default(now())

  scenarioVersion   ScenarioVersion @relation(...)

  @@index([scenarioVersionId])
  @@index([scenarioVersionId, year])
  @@index([scenarioVersionId, metric])
  @@index([scenarioVersionId, day, domain])
}
```

### SweepDefinition

Defines a parameter sweep for sensitivity analysis.

```prisma
model SweepDefinition {
  id          String   @id @default(cuid())
  scenarioId  String
  name        String
  description String?
  
  // Parameters to vary (JSON array)
  parameters  String   // JSON
  
  createdAt   DateTime @default(now())

  scenario    Scenario   @relation(...)
  runs        SweepRun[]

  @@index([scenarioId])
}
```

### SweepRun

Individual run within a sweep.

```prisma
model SweepRun {
  id                  String   @id @default(cuid())
  sweepDefinitionId   String
  scenarioVersionId   String
  runIndex            Int
  
  parameterValues     String   // JSON
  results             String?  // JSON with key metrics
  
  createdAt           DateTime @default(now())

  sweepDefinition     SweepDefinition @relation(...)
  scenarioVersion     ScenarioVersion @relation(...)

  @@index([sweepDefinitionId])
  @@index([scenarioVersionId])
}
```

### ChangeSet

Proposed changes from AI agent.

```prisma
model ChangeSet {
  id                String   @id @default(cuid())
  scenarioVersionId String

  changes           String   // JSON array of operations
  rationale         String?
  prompt            String?

  status            String   @default("proposed")

  createdAt         DateTime @default(now())
  appliedAt         DateTime?
  resultVersionId   String?

  scenarioVersion   ScenarioVersion @relation(...)

  @@index([scenarioVersionId])
  @@index([status])
}
```

### AdjustmentSet

Named collection of adjustment rules for what-if analysis. See [Adjustments](./09-ADJUSTMENTS.md) for full documentation.

```prisma
model AdjustmentSet {
  id                String   @id @default(cuid())
  scenarioVersionId String
  name              String
  description       String?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  scenarioVersion   ScenarioVersion @relation(...)
  rules             AdjustmentRule[]

  @@index([scenarioVersionId])
  @@index([scenarioVersionId, isActive])
}
```

**Usage Notes**:
- `isActive` controls whether rules are applied during TCO computation
- Rules are applied in `priority` order (lower numbers first)
- Multiple sets can be active simultaneously

### AdjustmentRule

Individual rule that modifies matching InputFacts during computation.

```prisma
model AdjustmentRule {
  id              String   @id @default(cuid())
  adjustmentSetId String

  // Target dimensions (null = match all)
  targetDay       String?  // day0, day1, day2, or null for all
  targetDomain    String?  // ran, cloud, oss, or null for all
  targetLayer     String?  // hardware_bom, software, etc., or null for all
  targetBucket    String?  // specific bucket or null for all
  targetScopeType String?  // site_archetype, dc_type, network_global, or null
  targetScopeId   String?  // specific scope ID or null for all within scopeType

  // Adjustment type and value
  adjustmentType  String   // percentage, fixed, replace
  adjustmentValue Float    // e.g., 10 for +10%, -50 for -$50, or absolute for replace

  // Ordering and metadata
  priority        Int      @default(0)  // Higher priority applied last
  notes           String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  adjustmentSet   AdjustmentSet @relation(...)

  @@index([adjustmentSetId])
  @@index([adjustmentSetId, priority])
}
```

**Adjustment Types**:
- `percentage`: Multiplies value by `(1 + adjustmentValue/100)`. Use -10 for 10% decrease.
- `fixed`: Adds adjustmentValue to the original value. Use -1000 to subtract $1000.
- `replace`: Replaces the original value entirely with adjustmentValue.

## Query Examples

### Get All Inputs for a Version

```typescript
const inputs = await prisma.inputFact.findMany({
  where: { scenarioVersionId: versionId },
  orderBy: [
    { day: 'asc' },
    { domain: 'asc' },
    { layer: 'asc' },
    { bucket: 'asc' },
  ],
});
```

### Query by Day and Domain

```typescript
const day0RanInputs = await prisma.inputFact.findMany({
  where: {
    scenarioVersionId: versionId,
    day: 'day0',
    domain: 'ran',
  },
});
```

### Query by Bucket

```typescript
const duServerCosts = await prisma.inputFact.findMany({
  where: {
    scenarioVersionId: versionId,
    bucket: 'du_server',
  },
});
```

### Get Computed Results by Year

```typescript
const yearlyResults = await prisma.computedFact.findMany({
  where: {
    scenarioVersionId: versionId,
    metric: 'total',
  },
  orderBy: { year: 'asc' },
});
```

## Migrations

### Running Migrations

```bash
# Create migration
npx prisma migrate dev --name description

# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### Resetting Database

```bash
# Reset and reseed
npx prisma migrate reset
```

## Best Practices

1. **Use indexes**: Key query patterns have indexes defined
2. **Immutable versions**: Never modify existing versions
3. **JSON for flexibility**: Complex/nested data stored as JSON strings
4. **Soft delete**: Consider adding `deletedAt` for audit trails
5. **Batch operations**: Use `createMany` for bulk inserts

