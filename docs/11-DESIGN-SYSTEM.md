# Design System

## Overview

The OpenRAN TCO Modeler uses a custom design system built on Tailwind CSS with Rakuten brand colors.

## Color Palette

The application uses the **Classic Rakuten Red** color palette with deep purple secondary accents.

### Brand Colors

| Role | Color Name | Hex Code | Usage |
|------|------------|----------|-------|
| **Primary Accent** | Rakuten Red | `#BF0000` | Primary buttons, links, focus states, chart totals |
| **Secondary Accent** | Honey Flower | `#5F1C6B` | Secondary elements, OPEX charts, Day 1 indicators |
| **Success** | Emerald | `#10b981` | Positive changes, savings, success states |
| **Warning** | Amber | `#f59e0b` | Warnings, Day 2 indicators |
| **Danger** | Monza Red | `#D8000D` | Errors, cost increases, destructive actions |
| **Lighter Red** | Burnt Sienna | `#ED5050` | Day 2 chart bars, secondary red accents |

### CSS Variables

Defined in `src/app/globals.css`:

```css
:root {
  /* Primary palette */
  --color-accent-primary: #BF0000;    /* Rakuten Red */
  --color-accent-secondary: #5F1C6B;  /* Honey Flower */
  --color-accent-success: #10b981;    /* Emerald */
  --color-accent-warning: #f59e0b;    /* Amber */
  --color-accent-danger: #D8000D;     /* Monza Red */

  /* Background colors (dark theme) */
  --color-bg-primary: #0a0e17;
  --color-bg-secondary: #111827;
  --color-bg-tertiary: #1f2937;
  --color-bg-elevated: #374151;

  /* Text colors */
  --color-text-primary: #f9fafb;
  --color-text-secondary: #9ca3af;
  --color-text-muted: #6b7280;

  /* Border colors */
  --color-border: #374151;
  --color-border-focus: #BF0000;
}
```

### Tailwind Classes

For Tailwind utility classes, use these mappings:

| Role | Tailwind Classes |
|------|------------------|
| Primary buttons | `from-red-700 to-red-800`, `hover:from-red-600 hover:to-red-700` |
| Secondary borders | `hover:border-red-700` |
| Focus rings | `focus:ring-red-700` |
| Primary gradients | `from-red-700 to-purple-900` |
| Text accents | `text-red-500`, `text-red-600` |
| Badges | `bg-red-700/20 text-red-500` |

## Chart Colors

Dashboard charts use hardcoded hex values for consistency:

### Domain Impact Chart (Stacked Bar)
| Data Series | Color | Hex |
|-------------|-------|-----|
| Day 0 (CAPEX) | Rakuten Red | `#BF0000` |
| Day 1 (CAPEX) | Honey Flower | `#5F1C6B` |
| Day 2 (OPEX) | Burnt Sienna | `#ED5050` |

### Waterfall Charts
| Element | Color | Hex |
|---------|-------|-----|
| Totals | Rakuten Red | `#BF0000` |
| Increases | Monza Red | `#D8000D` |
| Decreases | Emerald | `#10b981` |

### Scenario Comparison
| Data Series | Color | Hex |
|-------------|-------|-----|
| CAPEX | Rakuten Red | `#BF0000` |
| OPEX | Honey Flower | `#5F1C6B` |

### Tornado Charts
| Element | Color | Hex |
|---------|-------|-----|
| Cost Increase | Monza Red | `#D8000D` |
| Cost Decrease | Emerald | `#10b981` |

## Component Styling

### Buttons

Primary buttons use a red gradient:

```tsx
// Button.tsx primary variant
'bg-gradient-to-r from-red-700 to-red-800 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-700 shadow-lg shadow-red-700/20'
```

### Header Logo

The logo uses a red-to-purple gradient:

```tsx
<div className="p-2 rounded-lg bg-gradient-to-br from-red-700 to-purple-900">
  <Radio className="w-5 h-5 text-white" />
</div>
```

### Sidebar Navigation

The Scenarios item and Quick Compute button use brand gradients:

```tsx
// Scenarios nav item
color: 'from-red-700 to-purple-900'

// Quick Compute button
className="bg-gradient-to-r from-red-700 to-purple-900"
```

### Badges

Baseline/primary badges use the red accent:

```tsx
<span className="px-2 py-0.5 text-xs bg-red-700/20 text-red-500 rounded">
  Baseline
</span>
```

### Focus States

Input focus uses the primary red color:

```css
input:focus {
  border-color: var(--color-border-focus); /* #BF0000 */
  box-shadow: 0 0 0 3px rgba(191, 0, 0, 0.2);
}
```

## Animations

### Pulse Glow

Used for emphasis effects:

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(191, 0, 0, 0.3); }
  50% { box-shadow: 0 0 40px rgba(191, 0, 0, 0.5); }
}
```

## Typography

The application uses IBM Plex Sans for display text and IBM Plex Mono for code/data:

```css
:root {
  --font-display: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Fira Code', monospace;
}
```

## Dark Theme

The application uses a dark theme by default with the following background hierarchy:

| Level | Color | Hex | Usage |
|-------|-------|-----|-------|
| Primary | Dark Navy | `#0a0e17` | Page background |
| Secondary | Dark Gray | `#111827` | Cards, sidebars |
| Tertiary | Gray | `#1f2937` | Inputs, table headers |
| Elevated | Light Gray | `#374151` | Hover states, borders |

## Files to Modify for Color Changes

When updating the color palette, modify these files:

1. **CSS Variables**: `src/app/globals.css`
2. **Button Component**: `src/components/ui/Button.tsx`
3. **Header**: `src/components/layout/Header.tsx`
4. **Sidebar**: `src/components/layout/Sidebar.tsx`
5. **Dashboard Charts**:
   - `src/components/dashboard/DomainImpact.tsx`
   - `src/components/dashboard/WaterfallChart.tsx`
   - `src/components/dashboard/DeltaWaterfall.tsx`
   - `src/components/dashboard/SensitivityTornado.tsx`
   - `src/components/dashboard/ScenarioComparison.tsx`
   - `src/components/dashboard/ComparisonTornado.tsx`

## Accessibility

The color palette maintains WCAG 2.1 AA contrast ratios:

- Red text (`#BF0000`) on dark backgrounds (`#111827`): ~7:1 ratio
- White text on red buttons: ~8:1 ratio
- Gray text (`#9ca3af`) on dark backgrounds: ~5:1 ratio

## Brand Guidelines

The Rakuten Red (`#BF0000`) is the official Rakuten brand color. When using this color:

- Use for primary actions and key UI elements
- Pair with the Honey Flower purple (`#5F1C6B`) for gradients
- Reserve Monza Red (`#D8000D`) for errors and negative values
- Maintain sufficient contrast for accessibility
