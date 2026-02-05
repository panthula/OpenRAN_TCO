/**
 * Model assumptions and default cost rates
 */

import type { Currency } from './drivers';

// ============================================================================
// Global Model Assumptions
// ============================================================================
export interface ModelAssumptions {
  tco_years: number; // default 5
  discount_rate: number; // default 0.08
  currency: Currency;
  inflation_rate?: number;
  escalation_rate?: number;
  perpetual_spread_years?: number; // optional spreading
}

export const DefaultModelAssumptions: ModelAssumptions = {
  tco_years: 5,
  discount_rate: 0.08,
  currency: 'USD',
};

// ============================================================================
// Default Cost Rates
// ============================================================================
export const DefaultCostRates = {
  /** Annual maintenance rate for perpetual software licenses (15%) */
  SOFTWARE_PERPETUAL_MAINTENANCE_RATE: 0.15,
} as const;
