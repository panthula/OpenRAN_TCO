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

### Deployment Schedules

Archetypes support phased deployment over multiple years (1-10):
- **DeploymentYear** records store per-year sites/CUs/DCs
- Totals (numSites, numCus, numDcs) are derived from schedule
- Day 0/1 CAPEX uses **this year's** deployments
- Day 2 OPEX uses **cumulative** deployments (all deployed assets)

### Compute Engine

Located at `src/lib/compute/engine.ts`:
1. Loads model assumptions (tco_years, discount_rate)
2. Loads scaling counts per year (deploymentsThisYear, cumulativeToYear)
3. For each InputFact per year: applies phased multipliers
4. Day 0/1 CAPEX → uses deploymentsThisYear; Day 2 OPEX → uses cumulativeToYear
5. Calculates NPV: `NPV_y = TCO_y / (1 + discount_rate)^y`
6. Uses `safeJsonParse()` helper to handle malformed JSON gracefully

### Error Handling

- **Dashboard**: Reads `error` state from store and displays errors in a red card
- **Compute Engine**: Uses `safeJsonParse()` to prevent crashes from malformed `valueJson` data
- **Store**: `computeTco` action catches errors and sets `error` state for UI display

### Scenario/Version Pattern

- **Scenario**: A named TCO model (e.g., "Baseline 2024")
- **ScenarioVersion**: Immutable snapshot of inputs; each change creates new version
- Enables what-if analysis and comparison

### AI Agent Integration

The Agent tab provides AI-powered TCO analysis with optional real AI integration:

**Configuration** (via environment variables):
```bash
AI_PROVIDER=claude|openai|mock  # Default: mock
AI_API_KEY=sk-...               # API key for provider
AI_MODEL=claude-sonnet-4-20250514       # Model to use
```

**Capabilities**:
- Cost driver analysis with scenario context
- Optimization recommendations with one-click apply
- Convert proposals to persistent AdjustmentSet rules
- Quick insight buttons for common analysis types

**Key Files**:
- `src/lib/ai/config.ts` - AI provider configuration
- `src/lib/ai/analysis.ts` - AI analysis service
- `src/lib/ai/insights.ts` - Pre-built insight prompts
- `src/app/api/agent/propose/route.ts` - Proposal generation
- `src/app/api/agent/apply/route.ts` - Apply changes
- `src/app/api/agent/create-rule/route.ts` - Create adjustment rules

## Directory Structure

```
src/
├── app/
│   ├── (main)/           # Main app pages (Setup, Scenarios, RAN, Cloud, OSS, Dashboard, Agent)
│   └── api/              # API routes (scenarios, versions, input-facts, compute, etc.)
├── components/
│   ├── ui/               # Reusable UI (Button, Card, Input, Modal, Select, Tabs, Toggle)
│   ├── layout/           # Header, Sidebar
│   └── inputs/           # InputTable, SiteArchetypeEditor, OssSoftwareLicenseToggle
└── lib/
    ├── model/            # taxonomy.ts (bucket definitions), validation.ts (Zod schemas)
    ├── compute/          # engine.ts (TCO calculation)
    ├── store/            # scenario-store.ts (Zustand)
    ├── ai/               # AI integration (config, analysis, insights)
    └── db/               # Prisma client
```

## Critical Files

| File | Purpose |
|------|---------|
| `src/lib/model/taxonomy.ts` | All bucket keys, domains, layers, drivers, and labels |
| `src/lib/model/validation.ts` | Zod schemas (includes DeploymentYearSchema, AdjustmentSetSchema) |
| `src/lib/compute/engine.ts` | TCO calculation with deployment schedule phasing, adjustments, and safe JSON parsing |
| `src/lib/store/scenario-store.ts` | Global state (scenarios, inputFacts, adjustmentSets, comparison state) |
| `src/app/(main)/dashboard/page.tsx` | Dashboard with TCO results, charts, and error display |
| `src/app/(main)/dashboard/comparison/page.tsx` | Scenario comparison page with delta visualizations |
| `src/components/inputs/SiteArchetypeEditor.tsx` | Archetype UI with deployment schedule grid |
| `src/components/inputs/AdjustmentPanel.tsx` | What-if adjustment sets UI (on Setup page) |
| `src/app/api/adjustments/route.ts` | CRUD API for adjustment sets and rules |
| `src/app/api/compare/route.ts` | Multi-scenario comparison API |
| `src/components/dashboard/DomainImpact.tsx` | TCO by domain visualization |
| `src/components/dashboard/DeltaWaterfall.tsx` | Delta waterfall chart for scenario comparison |
| `src/components/dashboard/ComparisonTornado.tsx` | Tornado chart for impact ranking |
| `prisma/schema.prisma` | Database schema (AdjustmentSet, AdjustmentRule, etc.) |
| `src/lib/ai/config.ts` | AI provider configuration (Claude/OpenAI/mock) |
| `src/lib/ai/analysis.ts` | AI analysis service with scenario context |
| `src/lib/ai/insights.ts` | Pre-built insight prompts for common analysis |
| `src/app/(main)/agent/page.tsx` | AI Agent chat interface with apply/rule creation |
| `src/app/api/agent/propose/route.ts` | Generate AI-powered proposals |
| `src/app/api/agent/apply/route.ts` | Apply approved changes with version creation |
| `src/app/api/agent/create-rule/route.ts` | Convert proposals to adjustment rules |

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

### Perpetual License Spreading

OSS software costs can be spread over multiple years using perpetual licensing:
- Toggle in OSS Day 0 → "OSS Modules SW Pricing" card enables/disables spreading
- When enabled, sets `licenseModel='perpetual'` on all OSS software InputFacts
- Spread duration controlled by "Perpetual License Spread (Years)" in Setup tab
- Both server-side compute engine and client-side yearly breakdown honor spreading

Key files:
- `src/components/inputs/OssSoftwareLicenseToggle.tsx` - Toggle UI for OSS page
- `src/lib/store/scenario-store.ts` - `batchUpdateLicenseModel()` action
- `src/lib/compute/engine.ts` - Server-side spreading logic
- `src/lib/utils/yearly-breakdown.ts` - Client-side spreading for summary views

### Add a New Adjustment Type

1. Add type to `AdjustmentTypes` array in `src/lib/model/taxonomy.ts`
2. Add label to `AdjustmentTypeLabels` record
3. Add case in `applyAdjustment()` function in `src/lib/compute/engine.ts`
4. Update UI in `src/components/inputs/AdjustmentPanel.tsx` if needed

Key files:
- `src/lib/model/taxonomy.ts` - Type definitions and labels
- `src/lib/compute/engine.ts` - Adjustment application logic
- `src/components/inputs/AdjustmentPanel.tsx` - UI for creating/editing rules
- `docs/09-ADJUSTMENTS.md` - Feature documentation

### Multi-Scenario Comparison

Compare scenarios using delta visualizations:
- Navigate to Dashboard → "Compare Scenarios" button (or Sidebar → Compare)
- Select baseline and comparison scenarios (both must have computed TCO)
- View Delta Waterfall chart (cost bridge from baseline to comparison)
- View Comparison Tornado chart (impact by category ranked by magnitude)

Key files:
- `src/app/api/compare/route.ts` - Comparison API endpoint
- `src/lib/store/scenario-store.ts` - Comparison state (`comparisonScenarios`, `loadComparisonData`)
- `src/components/dashboard/DeltaWaterfall.tsx` - Delta waterfall chart
- `src/components/dashboard/ComparisonTornado.tsx` - Tornado chart
- `src/components/dashboard/ScenarioSelector.tsx` - Scenario selection UI
- `src/app/(main)/dashboard/comparison/page.tsx` - Comparison page
- `docs/10-SCENARIO-COMPARISON.md` - Feature documentation

### AI Agent Usage

The Agent tab provides intelligent TCO analysis:

1. **Enable Real AI** (optional):
   ```bash
   # .env.local
   AI_PROVIDER=claude
   AI_API_KEY=sk-ant-...
   AI_MODEL=claude-sonnet-4-20250514
   ```

2. **Analysis Types** (use quick insight buttons):
   - Cost Drivers - Top contributors by domain/day
   - Find Optimizations - Actionable cost reduction suggestions
   - Staffing Analysis - Labor cost optimization
   - Deployment Analysis - Schedule impact on TCO

3. **Applying Changes**:
   - Review proposed changes in the chat
   - Click "Approve & Apply" to create a new version with changes
   - Or click "Save as Rule" to create an AdjustmentSet for reusable what-if analysis

Key files:
- `src/lib/ai/config.ts` - Provider configuration
- `src/lib/ai/analysis.ts` - Analysis service
- `src/lib/ai/insights.ts` - Insight type prompts
- `src/app/api/agent/` - API endpoints

## Documentation

Comprehensive docs in `/docs/`:
- `00-ARCHITECTURE.md` - System overview (includes deployment schedules)
- `01-TAXONOMY.md` - Bucket and dimension definitions
- `02-RAN.md`, `03-CLOUD.md`, `04-OSS.md` - Domain-specific guides
- `05-COMPUTE-ENGINE.md` - Calculation logic details (deployment phasing, adjustments)
- `06-AGENT-INTEGRATION.md` - AI agent workflow
- `07-DATABASE-SCHEMA.md` - Database schema (AdjustmentSet, AdjustmentRule, etc.)
- `08-GETTING-STARTED.md` - Setup and usage guide
- `09-ADJUSTMENTS.md` - What-if adjustment modifiers documentation
- `10-SCENARIO-COMPARISON.md` - Multi-scenario comparison feature
