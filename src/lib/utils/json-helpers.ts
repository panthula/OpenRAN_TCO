/**
 * JSON parsing and manipulation helpers
 */

/**
 * Safely parse JSON with fallback for malformed data
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Sum year values from a valueJson object
 * Used for per_year_deployment buckets that store year-specific values
 * @param valueJson - JSON string containing year values like { "year_0": 100, "year_1": 200 }
 * @param years - Number of years to sum (defaults to 5 for TCO period)
 * @returns Total sum of all year values
 */
export function sumYearValues(valueJson: string | null, years: number = 5): number {
  if (!valueJson) return 0;
  try {
    const yearValues = JSON.parse(valueJson) as Record<string, number>;
    let total = 0;
    for (let y = 0; y < years; y++) {
      total += yearValues[`year_${y}`] ?? 0;
    }
    return total;
  } catch {
    return 0;
  }
}
