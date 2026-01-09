# OpenRAN TCO Modeler

A comprehensive Total Cost of Ownership (TCO) modeling application for OpenRAN-based mobile networks.

## Overview

This application provides a complete framework for modeling TCO across:
- **RAN** (Radio Access Network)
- **Cloud/CaaS** (Container Platform)
- **OSS/SMO/RIC** (Operations Support Systems)

Organized around the network lifecycle:
- **Day 0**: Design, Procurement, Platform bring-up
- **Day 1**: Build, Install, Integrate
- **Day 2**: Operations

## Features

- **Domain-First Navigation**: Inputs organized by product team (RAN, Cloud, OSS) with Day 0/1/2 tabs
- **Bucketed Input Taxonomy**: Every cost is categorized by Day/Domain/Layer/Bucket for granular querying
- **Scenario Management**: Create baselines, clone for what-if analysis, version history
- **Parameter Sweeps**: Run sensitivity analysis across multiple parameter combinations
- **AI Agent**: Ask questions, get insights, propose and apply optimizations
- **Dashboard**: Visualize TCO results with charts and summaries

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Navigation Structure

```
Sidebar:
├── Setup         → Global settings (assumptions, site archetypes, DC types)
├── RAN           → RAN inputs with Day 0 / Day 1 / Day 2 tabs
├── Cloud         → Cloud inputs with Day 0 / Day 1 / Day 2 tabs
├── OSS           → OSS inputs with Day 0 / Day 1 / Day 2 tabs (+ Staffing)
├── Dashboard     → TCO results and visualizations
└── Agent         → AI-powered analysis and recommendations
```

## Project Structure

```
tco-app/
├── docs/                      # Comprehensive documentation
│   ├── 00-ARCHITECTURE.md     # System architecture overview
│   ├── 01-TAXONOMY.md         # Bucket and domain definitions
│   ├── 02-RAN.md              # RAN domain (Day 0/1/2)
│   ├── 03-CLOUD.md            # Cloud domain (Day 0/1/2)
│   ├── 04-OSS.md              # OSS domain (Day 0/1/2 + Staffing)
│   ├── 05-COMPUTE-ENGINE.md   # TCO calculation logic
│   ├── 06-AGENT-INTEGRATION.md
│   ├── 07-DATABASE-SCHEMA.md
│   └── 08-GETTING-STARTED.md
├── prisma/                    # Database schema and migrations
├── src/
│   ├── app/                   # Next.js pages and API routes
│   │   ├── (main)/           # Main app pages
│   │   │   ├── setup/        # Global settings
│   │   │   ├── ran/          # RAN domain (Day 0/1/2 tabs)
│   │   │   ├── cloud/        # Cloud domain (Day 0/1/2 tabs)
│   │   │   ├── oss/          # OSS domain (Day 0/1/2 tabs + Staffing)
│   │   │   ├── dashboard/    # TCO results
│   │   │   └── agent/        # AI assistant
│   │   └── api/              # API routes
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── layout/          # Layout components
│   │   └── inputs/          # Input-specific components
│   └── lib/
│       ├── model/           # Taxonomy and validation
│       ├── compute/         # Calculation engine
│       ├── store/           # State management
│       └── db/              # Database client
└── package.json
```

## Documentation

See the [docs/](./docs/) folder for comprehensive documentation:

- **[Architecture](./docs/00-ARCHITECTURE.md)** - System overview and data flow
- **[Taxonomy](./docs/01-TAXONOMY.md)** - Bucket definitions and standardization
- **[RAN](./docs/02-RAN.md)** - RAN domain (Day 0/1/2)
- **[Cloud](./docs/03-CLOUD.md)** - Cloud domain (Day 0/1/2)
- **[OSS](./docs/04-OSS.md)** - OSS domain (Day 0/1/2 + Staffing)
- **[Compute Engine](./docs/05-COMPUTE-ENGINE.md)** - TCO calculation details
- **[Agent](./docs/06-AGENT-INTEGRATION.md)** - AI integration guide
- **[Database](./docs/07-DATABASE-SCHEMA.md)** - Schema documentation
- **[Getting Started](./docs/08-GETTING-STARTED.md)** - Setup and usage guide

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **State**: Zustand
- **Database**: SQLite via Prisma ORM
- **Charts**: Recharts
- **Icons**: Lucide React

## Key Concepts

### Domain-First Organization

The UI is organized by domain (product/business team perspective):
- **RAN**: Radio Access Network hardware, software, and operations
- **Cloud**: Cloud/CaaS platform licensing and operations
- **OSS**: Operations support systems, SMO, RIC, and staffing

Each domain page contains tabs for Day 0 (procurement), Day 1 (deployment), and Day 2 (operations).

### Bucketed Inputs

Every cost input is stored with dimensional keys:
- **Day**: day0, day1, day2
- **Domain**: ran, cloud, oss
- **Layer**: hardware_bom, software, services, staffing, site_opex, lifecycle
- **Bucket**: Standardized cost category (e.g., `du_server`, `radios`)
- **Scope**: site_archetype, dc_type, or network_global
- **Driver**: Scaling factor (per_site, per_cu, per_dc, fixed)

### TCO Calculation

1. Load all InputFacts for a scenario version
2. Apply scaling multipliers based on site/CU/DC counts
3. Phase costs: Day0/Day1 = CAPEX, Day2 = OPEX
4. Calculate NPV using configured discount rate
5. Store results in ComputedFact table

### Scenarios and Versions

- **Scenario**: A named TCO model
- **Version**: Immutable snapshot of inputs
- Clone scenarios for what-if analysis
- Compare versions to track changes

## License

Internal use only.
