# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server at localhost:3000
npm run build            # Production build
npm run lint             # Run ESLint
```

### Database (Prisma + SQLite)

```bash
npx prisma migrate dev   # Run migrations
npx prisma generate      # Generate Prisma client
npx prisma migrate reset # Reset database (destructive)
npx prisma studio        # Open database GUI
```

## Architecture Overview

This is a **Total Cost of Ownership (TCO) modeler** for OpenRAN mobile networks built with:
- **Next.js 14+ (App Router)** with TypeScript
- **SQLite** via Prisma ORM (can migrate to PostgreSQL)
- **Zustand** for client state management
- **Tailwind CSS** for styling
- **Recharts** for visualizations

### Domain Structure

The app models costs across three domains, each with Day 0/1/2 lifecycle phases:

| Domain | Description |
|--------|-------------|
| **RAN** | Radio Access Network (DU, CU, radios, antennas) |
| **Cloud** | Cloud/CaaS platform (Kubernetes, container runtime) |
| **OSS** | Operations support systems, SMO, RIC |

| Day | Phase |
|-----|-------|
| Day 0 | Design + Procurement (CAPEX) |
| Day 1 | Build, Install, Integrate (CAPEX) |
| Day 2 | Operations (OPEX, recurring annually) |

### Key Data Model: InputFact

Every cost input is stored with 6 dimensional keys:
- **day**: day0, day1, day2
- **domain**: ran, cloud, oss
- **layer**: hardware_bom, software, services, staffing, site_opex, lifecycle
- **bucket**: Specific cost category (e.g., `du_server`, `radios`)
- **scopeType**: site_archetype, dc_type, network_global
- **driver**: Scaling factor (per_site, per_cu, per_dc, fixed, per_year)

### Compute Engine

Located at `src/lib/compute/engine.ts`:
1. Loads model assumptions (tco_years, discount_rate)
2. Loads scaling counts (sites, CUs, DCs by type)
3. For each InputFact: `totalValue = valueNumber × multiplier(driver, scope)`
4. Day 0/1 → Year 0 CAPEX; Day 2 → OPEX every year
5. Calculates NPV: `NPV_y = TCO_y / (1 + discount_rate)^y`

### Scenario/Version Pattern

- **Scenario**: A named TCO model (e.g., "Baseline 2024")
- **ScenarioVersion**: Immutable snapshot of inputs; each change creates new version
- Enables what-if analysis and comparison

## Directory Structure

```
src/
├── app/
│   ├── (main)/           # Main app pages (Setup, RAN, Cloud, OSS, Dashboard, Agent)
│   └── api/              # API routes (scenarios, versions, input-facts, compute, etc.)
├── components/
│   ├── ui/               # Reusable UI (Button, Card, Input, Modal, Select, Tabs)
│   ├── layout/           # Header, Sidebar
│   └── inputs/           # InputTable, SiteArchetypeEditor, DcTypeEditor
└── lib/
    ├── model/            # taxonomy.ts (bucket definitions), validation.ts (Zod schemas)
    ├── compute/          # engine.ts (TCO calculation)
    ├── store/            # scenario-store.ts (Zustand)
    └── db/               # Prisma client
```

## Critical Files

| File | Purpose |
|------|---------|
| `src/lib/model/taxonomy.ts` | All bucket keys, domains, layers, drivers, and labels |
| `src/lib/compute/engine.ts` | TCO calculation and scaling logic |
| `src/lib/store/scenario-store.ts` | Global state (scenarios, inputFacts, computedSummary) |
| `prisma/schema.prisma` | Database schema (Scenario, ScenarioVersion, InputFact, ComputedFact, etc.) |

## Common Tasks

### Add a New Cost Bucket

1. Edit `src/lib/model/taxonomy.ts`
2. Add bucket key to appropriate array (e.g., `RanSiteBomBuckets`)
3. Add label to corresponding Labels record
4. InputTable will automatically pick it up

### Modify Calculation Logic

Edit `src/lib/compute/engine.ts`:
- `computeTco()` - Main calculation
- `getMultiplier()` - Scaling rules based on driver

### Add a New API Endpoint

Create `src/app/api/[endpoint]/route.ts` and export GET/POST/PUT/DELETE handlers.

## Documentation

Comprehensive docs in `/docs/`:
- `00-ARCHITECTURE.md` - System overview
- `01-TAXONOMY.md` - Bucket and dimension definitions
- `02-RAN.md`, `03-CLOUD.md`, `04-OSS.md` - Domain-specific guides
- `05-COMPUTE-ENGINE.md` - Calculation logic details
- `06-AGENT-INTEGRATION.md` - AI agent workflow
