# Getting Started Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Installation

### 1. Clone/Navigate to Project

```bash
cd C:\Users\sandeep.panthula\Desktop\OpenRAN_TCO\tco-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### Create Your First Scenario

1. Click **"New Scenario"** in the header
2. Enter a name (e.g., "Baseline 2024")
3. Click **"Create Scenario"**

### Configure Global Settings

1. Go to **Setup** in the sidebar
2. Configure **Model Assumptions**:
   - Set TCO duration (default: 5 years)
   - Set discount rate for NPV (default: 8%)
3. Add **Site Archetypes**:
   - Click "Add Archetype"
   - Enter name (e.g., "Urban Macro")
   - Enter number of sites and CUs
4. Configure **Data Centers**:
   - Set counts for Edge, Regional, and Central DCs

### Enter Domain Inputs

The application is organized by domain (RAN, Cloud, OSS), with each domain containing Day 0, Day 1, and Day 2 tabs:

#### RAN Domain
1. Go to **RAN** in the sidebar
2. **Day 0 tab**: Enter hardware BoM and software procurement costs
3. **Day 1 tab**: Enter installation and testing costs
4. **Day 2 tab**: Enter site OPEX, software support, and lifecycle costs
5. Click **"Save Changes"** after entering values

#### Cloud Domain
1. Go to **Cloud** in the sidebar
2. **Day 0 tab**: Enter cloud licensing costs
3. **Day 1 tab**: Enter cluster bring-up and integration costs
4. **Day 2 tab**: Enter platform operations and license support costs

#### OSS Domain
1. Go to **OSS** in the sidebar
2. **Day 0 tab**: Enter OSS hardware BoM and software procurement
3. **Day 1 tab**: Enter OSS installation and integration costs
4. **Day 2 tab**: Enter software support costs and staffing

### Compute TCO

1. Go to **Dashboard** in the sidebar
2. Click **"Compute TCO"**
3. View results in charts and summary cards

### Try the AI Agent

1. Go to **Agent** in the sidebar
2. Ask a question like "What are the main cost drivers?"
3. For optimization suggestions, ask "How can I reduce OPEX?"
4. Review and approve any proposed changes

## Navigation Structure

```
Sidebar:
├── Setup         → Global settings (assumptions, site archetypes, DC types)
├── RAN           → RAN inputs organized by Day 0 / Day 1 / Day 2
├── Cloud         → Cloud inputs organized by Day 0 / Day 1 / Day 2
├── OSS           → OSS inputs organized by Day 0 / Day 1 / Day 2 (+ Staffing)
├── Dashboard     → TCO results and visualizations
└── Agent         → AI-powered analysis and recommendations
```

## Project Structure

```
tco-app/
├── docs/                      # Documentation (you are here)
├── prisma/                    # Database schema and migrations
├── src/
│   ├── app/                   # Next.js pages and API routes
│   │   ├── (main)/
│   │   │   ├── setup/         # Global settings page
│   │   │   ├── ran/           # RAN domain page
│   │   │   ├── cloud/         # Cloud domain page
│   │   │   ├── oss/           # OSS domain page
│   │   │   ├── dashboard/     # Results dashboard
│   │   │   └── agent/         # AI agent interface
│   │   └── api/               # API route handlers
│   ├── components/            # React components
│   └── lib/                   # Core logic and utilities
└── package.json
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/(main)/setup/page.tsx` | Global settings (assumptions, topology) |
| `src/app/(main)/ran/page.tsx` | RAN domain inputs |
| `src/app/(main)/cloud/page.tsx` | Cloud domain inputs |
| `src/app/(main)/oss/page.tsx` | OSS domain inputs + Staffing |
| `src/lib/model/taxonomy.ts` | Bucket definitions and labels |
| `src/lib/compute/engine.ts` | TCO calculation logic |
| `src/lib/store/scenario-store.ts` | Global state management |
| `prisma/schema.prisma` | Database schema |

## Common Tasks

### Add a New Cost Bucket

1. Edit `src/lib/model/taxonomy.ts`
2. Add bucket key to appropriate array
3. Add label to labels object
4. Restart dev server

### Modify Calculation Logic

Edit `src/lib/compute/engine.ts`:
- `computeTco()` - Main calculation
- `getMultiplier()` - Scaling rules

### Add a New API Endpoint

1. Create file in `src/app/api/[endpoint]/route.ts`
2. Export GET/POST/PUT/DELETE handlers

### Customize Styling

- Global styles: `src/app/globals.css`
- Component styles: Tailwind classes in components

## Environment Variables

Create `.env` file in project root:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# AI API Keys (optional)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-..."
```

## Troubleshooting

### Database Issues

```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeScript Errors

```bash
# Check types
npm run type-check

# Or run build to see all errors
npm run build
```

## Next Steps

1. Review the [Architecture](./00-ARCHITECTURE.md) documentation
2. Understand the [Taxonomy](./01-TAXONOMY.md) system
3. Explore domain implementation guides:
   - [RAN](./02-RAN.md) - RAN domain (Day 0/1/2)
   - [Cloud](./03-CLOUD.md) - Cloud domain (Day 0/1/2)
   - [OSS](./04-OSS.md) - OSS domain (Day 0/1/2 + Staffing)
4. Set up AI integration for full agent functionality
