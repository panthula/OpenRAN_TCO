# OpenRAN TCO Architecture Overview

## System Architecture

This document provides a comprehensive overview of the OpenRAN TCO Modeler application architecture.

### Technology Stack

- **Frontend**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand
- **Database**: SQLite via Prisma ORM (can be migrated to PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React

### Directory Structure

```
tco-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (main)/            # Main app layout group
│   │   │   ├── setup/         # Global settings page (assumptions, topology)
│   │   │   ├── ran/           # RAN domain page (Day 0/1/2 tabs)
│   │   │   ├── cloud/         # Cloud domain page (Day 0/1/2 tabs)
│   │   │   ├── oss/           # OSS domain page (Day 0/1/2 tabs + Staffing)
│   │   │   ├── dashboard/     # TCO results dashboard
│   │   │   └── agent/         # AI agent interface
│   │   ├── api/               # API route handlers
│   │   │   ├── scenarios/     # Scenario CRUD
│   │   │   ├── versions/      # Version management
│   │   │   ├── input-facts/   # Input data CRUD
│   │   │   ├── site-archetypes/
│   │   │   ├── dc-types/
│   │   │   ├── compute/       # TCO computation
│   │   │   └── computed-facts/
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Tabs.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── inputs/            # Input-specific components
│   │   │   ├── InputTable.tsx      # Table with totals display
│   │   │   ├── SiteArchetypeEditor.tsx
│   │   │   ├── DcTypeEditor.tsx
│   │   │   └── AssumptionsEditor.tsx
│   │   └── ran/               # RAN domain components
│   │       └── RanDollarSummary.tsx  # RAN cost summary view
│   └── lib/
│       ├── model/             # Data model definitions
│       │   ├── taxonomy.ts    # Bucket keys, domains, etc.
│       │   └── validation.ts  # Zod schemas
│       ├── compute/           # Computation engine
│       │   └── engine.ts
│       ├── store/             # State management
│       │   └── scenario-store.ts
│       └── db/                # Database client
│           └── client.ts
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── docs/                      # Documentation
└── package.json
```

## Navigation Structure

The UI is organized by **domain** (product/business team perspective), with each domain containing Day 0, Day 1, and Day 2 inputs:

```
Sidebar Navigation:
├── Setup              → Global settings (assumptions, site archetypes, DC types)
├── RAN                → Radio Access Network inputs
│   ├── Day 0 Tab      → Hardware BoM, SW /Site, SW/ DC
│   ├── Day 1 Tab      → Installation, Testing & Acceptance
│   ├── Day 2 Tab      → Site OPEX, Software Support, Lifecycle
│   └── RAN $ Summary  → Network-scaled cost rollups (Day 0+1+2)
├── Cloud              → Cloud/CaaS Platform inputs
│   ├── Day 0 Tab      → Cloud Licensing
│   ├── Day 1 Tab      → Cluster Bring-up & Integration
│   └── Day 2 Tab      → Platform Operations, License Support
├── OSS                → OSS/SMO/RIC inputs
│   ├── Day 0 Tab      → Hardware BoM, Software Procurement
│   ├── Day 1 Tab      → OSS Installation & Integration
│   └── Day 2 Tab      → Software Support, Operations Staffing
├── Dashboard          → TCO Results visualization
└── Agent              → AI-powered analysis and recommendations
```

### InputTable Features

The `InputTable` component provides:
- **Table Total**: Displays sum of all values in header area
- **Scope Group Subtotals**: Shows subtotals per archetype/DC type in group headers
- **Clean Numeric Inputs**: Number fields without spinner controls

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         User Interface                            │
│  ┌───────┐  ┌─────┐  ┌───────┐  ┌─────┐  ┌───────────┐  ┌──────┐ │
│  │ Setup │  │ RAN │  │ Cloud │  │ OSS │  │ Dashboard │  │Agent │ │
│  └───┬───┘  └──┬──┘  └───┬───┘  └──┬──┘  └─────┬─────┘  └──┬───┘ │
└──────┼─────────┼────────┼─────────┼───────────┼────────────┼─────┘
       │         │        │         │           │            │
       └─────────┴────────┴─────────┴───────────┼────────────┘
                                                │
                           ┌────────────────────▼────────────────────┐
                           │           Zustand Store                  │
                           │  (scenario-store.ts)                     │
                           │  - scenarios, currentVersion             │
                           │  - inputFacts, computedSummary           │
                           └────────────────────┬────────────────────┘
                                                │
                           ┌────────────────────▼────────────────────┐
                           │           Next.js API Routes            │
                           │  /api/scenarios, /api/input-facts, etc. │
                           └────────────────────┬────────────────────┘
                                                │
                           ┌────────────────────▼────────────────────┐
                           │           Prisma ORM                     │
                           │  (prisma/schema.prisma)                  │
                           └────────────────────┬────────────────────┘
                                                │
                           ┌────────────────────▼────────────────────┐
                           │           SQLite Database                │
                           │  (prisma/dev.db)                         │
                           └─────────────────────────────────────────┘
```

## Core Concepts

### 1. Scenarios and Versions

- **Scenario**: A named TCO model (e.g., "Baseline 2024")
- **ScenarioVersion**: An immutable snapshot of inputs; each change creates a new version
- Enables what-if analysis and comparison

### 2. The Bucketed Input Taxonomy

Every input is stored with 6 dimensional keys:
- **Day**: day0, day1, day2
- **Domain**: ran, cloud, oss
- **Layer**: hardware_bom, software, services, staffing, site_opex, lifecycle, assumptions
- **Bucket**: Standardized cost category (e.g., `du_server`, `radios`)
- **ScopeType**: site_archetype, dc_type, network_global
- **Driver**: Scaling factor (per_site, per_cu, per_dc, fixed, etc.)

### 3. Domain-First Organization

The UI is organized by domain to match how product/business teams think about inputs:

| Domain | Description | Primary Teams |
|--------|-------------|---------------|
| **RAN** | Radio Access Network hardware, software, and operations | RAN Engineering, RF Planning |
| **Cloud** | Cloud/CaaS platform licensing and operations | Platform/Cloud Engineering |
| **OSS** | Operations support systems, SMO, RIC, and staffing | OSS Engineering, NOC, SOC |

Each domain page contains tabs for Day 0 (procurement), Day 1 (deployment), and Day 2 (operations).

### 4. Compute Engine

Located in `src/lib/compute/engine.ts`:
- Reads all InputFacts for a version
- Applies scaling rules based on site/CU/DC counts
- Phases costs into CAPEX (Day0/1) and OPEX (Day2)
- Calculates NPV using discount rate
- Stores results in ComputedFact table

### 5. Agent Workflow

- User asks questions or requests optimizations
- Agent analyzes current scenario data
- Proposes ChangeSet (add/update/delete InputFacts)
- User reviews and approves/rejects
- On approval: new ScenarioVersion created, TCO recomputed

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scenarios` | GET | List all scenarios |
| `/api/scenarios` | POST | Create new scenario |
| `/api/scenarios/[id]` | GET | Get scenario details |
| `/api/scenarios/[id]` | POST | Clone scenario |
| `/api/scenarios/[id]` | DELETE | Delete scenario |
| `/api/versions/[id]` | GET | Get version with all data |
| `/api/input-facts` | GET | Query input facts (with filters) |
| `/api/input-facts` | POST | Create/update input facts |
| `/api/site-archetypes` | GET/POST/DELETE | Manage site archetypes |
| `/api/dc-types` | GET/POST | Manage DC types |
| `/api/compute` | POST | Compute TCO for a version |
| `/api/computed-facts` | GET | Query computed results |

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/(main)/setup/page.tsx` | Global settings (assumptions, topology) |
| `src/app/(main)/ran/page.tsx` | RAN domain inputs (Day 0/1/2 + Summary) |
| `src/app/(main)/cloud/page.tsx` | Cloud domain inputs (Day 0/1/2) |
| `src/app/(main)/oss/page.tsx` | OSS domain inputs (Day 0/1/2 + Staffing) |
| `src/components/ran/RanDollarSummary.tsx` | RAN cost summary with network scaling |
| `src/components/inputs/InputTable.tsx` | Reusable input table with totals |
| `src/lib/model/taxonomy.ts` | All bucket keys, domains, layers, drivers |
| `src/lib/model/validation.ts` | Zod schemas for input validation |
| `src/lib/compute/engine.ts` | TCO calculation logic |
| `src/lib/store/scenario-store.ts` | Global state management |
| `src/app/globals.css` | Global styles (including no-spinner inputs) |
| `prisma/schema.prisma` | Database schema definition |
