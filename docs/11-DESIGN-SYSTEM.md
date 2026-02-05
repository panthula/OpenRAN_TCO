# Design System

## Overview

The OpenRAN TCO Modeler uses a custom design system called **"Obsidian Finance"** - a premium dark-mode aesthetic inspired by high-end financial terminals and luxury watch dashboards. Built on Tailwind CSS with carefully curated typography and a warm amber/copper accent system.

## Design Philosophy

- **Deep obsidian backgrounds** with subtle noise texture for depth
- **Warm amber/copper accents** replacing harsh reds for a more refined feel
- **Soft inner glows** on data cards suggesting illuminated displays
- **Micro-borders and beveled edges** for tactile depth
- **Restrained motion** with purposeful reveals

## Color Palette

### Primary Colors

| Role | Color Name | Hex Code | Usage |
|------|------------|----------|-------|
| **Primary Accent** | Amber | `#f59e0b` | Primary buttons, focus states, chart totals, highlights |
| **Secondary Accent** | Copper/Orange | `#ea580c` | Gradient endpoints, secondary accents |
| **Success** | Green | `#22c55e` | Positive changes, savings, success states |
| **Danger** | Red | `#ef4444` | Errors, cost increases, destructive actions |
| **Warning** | Amber | `#f59e0b` | Warnings, alerts |
| **Info** | Blue | `#3b82f6` | Informational elements |

### Chart Colors

| Role | Color Name | Hex Code | Usage |
|------|------------|----------|-------|
| **Primary Data** | Amber | `#f59e0b` | CAPEX, Day 0, primary metrics |
| **Secondary Data** | Violet | `#8b5cf6` | OPEX, Day 1, secondary metrics |
| **Tertiary Data** | Cyan | `#06b6d4` | Day 2, tertiary metrics |
| **Quaternary Data** | Pink | `#ec4899` | Additional data series |
| **Positive/Savings** | Green | `#22c55e` | Cost decreases, savings |
| **Negative/Increases** | Red | `#ef4444` | Cost increases |

### Obsidian Background Scale

| Level | Name | Hex Code | Usage |
|-------|------|----------|-------|
| 950 | Deepest | `#08090c` | Page background |
| 900 | Base | `#0d0f14` | Main surface |
| 850 | Elevated | `#12151c` | Card backgrounds |
| 800 | Overlay | `#181c25` | Modal backgrounds, dropdowns |
| 700 | Interactive | `#232933` | Hover states, active items |
| 600 | Border Strong | `#2e3542` | Strong borders |
| 500 | Mid | `#3d4556` | Disabled states |
| 400 | Light | `#5a6478` | Placeholder text |

### Text Colors

| Role | Hex Code | Usage |
|------|----------|-------|
| Primary | `#f1f5f9` | Main text, headings |
| Secondary | `#94a3b8` | Descriptions, labels |
| Muted | `#64748b` | Placeholder, disabled text |
| Accent | `#fbbf24` | Highlighted text (amber-400) |

### CSS Variables

Defined in `src/app/globals.css`:

```css
:root {
  /* Obsidian Background Scale */
  --obsidian-950: #08090c;
  --obsidian-900: #0d0f14;
  --obsidian-850: #12151c;
  --obsidian-800: #181c25;
  --obsidian-700: #232933;
  --obsidian-600: #2e3542;

  /* Warm Accent - Amber/Copper */
  --amber-500: #f59e0b;
  --amber-400: #fbbf24;
  --copper-500: #ea580c;

  /* Semantic Colors */
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;

  /* Chart Colors */
  --chart-primary: #f59e0b;
  --chart-secondary: #8b5cf6;
  --chart-tertiary: #06b6d4;
  --chart-positive: #22c55e;
  --chart-negative: #ef4444;

  /* Border Colors */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.15);

  /* Text Colors */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
}
```

## Typography

The application uses a refined typography system with three font families:

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **Display** | Instrument Serif | 400, italic | Page titles, card headers |
| **Body** | DM Sans | 400, 500, 600, 700 | Body text, buttons, labels |
| **Mono** | JetBrains Mono | 400, 500, 600 | Financial data, code, metrics |

```css
:root {
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

### Typography Classes

```tsx
// Serif display headings
<h1 className="text-2xl font-serif text-slate-100 tracking-tight">Dashboard</h1>

// Monospace metrics
<span className="font-mono font-bold text-amber-400">$1,234,567</span>

// Body text
<p className="text-sm text-slate-400">Description text</p>
```

## Chart Colors

Dashboard charts use a consistent color system defined in each component:

### Domain Impact Chart (Stacked Bar)

| Data Series | Color | Hex |
|-------------|-------|-----|
| Day 0 (CAPEX) | Amber | `#f59e0b` |
| Day 1 (CAPEX) | Violet | `#8b5cf6` |
| Day 2 (OPEX) | Cyan | `#06b6d4` |

### Waterfall Charts

| Element | Color | Hex |
|---------|-------|-----|
| Totals | Amber | `#f59e0b` |
| Increases | Red | `#ef4444` |
| Decreases | Green | `#22c55e` |

### Scenario Comparison

| Data Series | Color | Hex |
|-------------|-------|-----|
| CAPEX | Amber | `#f59e0b` |
| OPEX | Violet | `#8b5cf6` |

### Tooltip Styling

All chart tooltips use consistent styling:

```tsx
contentStyle={{
  backgroundColor: '#181c25',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
}}
labelStyle={{ color: '#f1f5f9' }}
itemStyle={{ color: '#94a3b8' }}
```

## Component Styling

### Buttons

Four button variants with gradient and glow effects:

```tsx
// Primary - Amber gradient with glow
'bg-gradient-to-r from-amber-500 to-orange-500 text-[#08090c] font-semibold
shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30'

// Secondary - Subtle with amber border on hover
'bg-[#232933] text-slate-100 border border-white/10
hover:bg-[#2e3542] hover:border-amber-500/50'

// Ghost - Transparent
'text-slate-400 bg-transparent hover:text-slate-100 hover:bg-[#181c25]'

// Danger - Red gradient with glow
'bg-gradient-to-r from-red-500 to-red-600 text-white
shadow-lg shadow-red-500/20'
```

### Cards

Cards support multiple variants with optional glow effects:

```tsx
// Default card
<Card>...</Card>

// Elevated card with shadow
<Card variant="elevated">...</Card>

// Gradient card
<Card variant="gradient">...</Card>

// Glow card with color
<Card variant="glow" glowColor="amber">...</Card>  // amber, success, danger, info
```

Card glow effects:
```css
.card-glow-amber {
  box-shadow:
    var(--shadow-lg),
    0 0 20px rgba(245, 158, 11, 0.15),
    0 0 40px rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.2);
}
```

### Header Logo

The logo uses an amber-to-orange gradient with glow:

```tsx
<div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
  <Radio className="w-5 h-5 text-white" />
  {/* Glow effect */}
  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 blur-lg opacity-40" />
</div>
```

### Sidebar Navigation

Navigation items with gradient icons:

```tsx
const navItems = [
  { gradient: 'from-amber-500 to-orange-500', activeColor: 'amber' },  // Scenarios
  { gradient: 'from-rose-500 to-pink-500', activeColor: 'rose' },      // RAN
  { gradient: 'from-sky-500 to-blue-500', activeColor: 'sky' },        // Cloud
  { gradient: 'from-emerald-500 to-teal-500', activeColor: 'emerald' },// OSS
  // ...
];
```

Active indicator dot with glow:
```tsx
<div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
```

### Badges

```tsx
// Primary badge
<span className="px-2 py-0.5 text-xs bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/30">
  Baseline
</span>

// Success badge
<span className="px-2 py-0.5 text-xs bg-green-500/15 text-green-400 rounded-full border border-green-500/30">
  Savings
</span>
```

### Input Focus States

```css
input:focus {
  border-color: var(--amber-500);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}
```

### Toggle Switch

Active state with amber gradient and glow:
```tsx
className={checked
  ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
  : 'bg-[#232933]'
}
```

## Effects & Animations

### Glow Effects

```css
--glow-amber: 0 0 20px rgba(245, 158, 11, 0.15), 0 0 40px rgba(245, 158, 11, 0.05);
--glow-success: 0 0 20px rgba(34, 197, 94, 0.15), 0 0 40px rgba(34, 197, 94, 0.05);
--glow-danger: 0 0 20px rgba(239, 68, 68, 0.15), 0 0 40px rgba(239, 68, 68, 0.05);
```

### Animations

```css
/* Fade in with slight upward motion */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scale in for modals */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Amber pulse glow */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
  50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.4); }
}
```

### Stagger Children

For animated lists:
```tsx
<div className="stagger-children">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>
```

Each child animates with 50ms delay.

## Glass Effects

```css
.glass {
  background: rgba(13, 15, 20, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-subtle);
}
```

## Noise Texture

Subtle noise overlay for premium feel:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* Fractal noise */
  opacity: 0.02;
  pointer-events: none;
  z-index: 9999;
}
```

## Files to Modify for Color Changes

When updating the color palette, modify these files:

1. **CSS Variables**: `src/app/globals.css`
2. **UI Components**:
   - `src/components/ui/Button.tsx`
   - `src/components/ui/Card.tsx`
   - `src/components/ui/Input.tsx`
   - `src/components/ui/Modal.tsx`
   - `src/components/ui/Select.tsx`
   - `src/components/ui/Tabs.tsx`
   - `src/components/ui/Toggle.tsx`
3. **Layout**:
   - `src/components/layout/Header.tsx`
   - `src/components/layout/Sidebar.tsx`
4. **Dashboard Charts** (CHART_COLORS constant):
   - `src/components/dashboard/DomainImpact.tsx`
   - `src/components/dashboard/WaterfallChart.tsx`
   - `src/components/dashboard/DeltaWaterfall.tsx`
   - `src/components/dashboard/SensitivityTornado.tsx`
   - `src/components/dashboard/ScenarioComparison.tsx`
   - `src/components/dashboard/ComparisonTornado.tsx`
5. **Dashboard Page**: `src/app/(main)/dashboard/page.tsx`

## Accessibility

The color palette maintains WCAG 2.1 AA contrast ratios:

- Amber text (`#f59e0b`) on dark backgrounds (`#12151c`): ~7:1 ratio
- Dark text (`#08090c`) on amber buttons: ~10:1 ratio
- Secondary text (`#94a3b8`) on dark backgrounds: ~5:1 ratio
- Success green (`#22c55e`) on dark backgrounds: ~6:1 ratio
- Danger red (`#ef4444`) on dark backgrounds: ~5:1 ratio

## Design Tokens Quick Reference

```css
/* Backgrounds */
--obsidian-950: #08090c;  /* Page */
--obsidian-850: #12151c;  /* Cards */
--obsidian-800: #181c25;  /* Modals */
--obsidian-700: #232933;  /* Interactive */

/* Accents */
--amber-500: #f59e0b;     /* Primary */
--amber-400: #fbbf24;     /* Highlights */

/* Semantic */
--color-success: #22c55e;
--color-danger: #ef4444;

/* Chart */
--chart-primary: #f59e0b;   /* Amber */
--chart-secondary: #8b5cf6; /* Violet */
--chart-tertiary: #06b6d4;  /* Cyan */
```
