/**
 * OpenRAN TCO Taxonomy
 * Re-exports from the modular taxonomy structure for backward compatibility.
 *
 * For new code, consider importing from specific modules:
 * - @/lib/model/taxonomy/core - Days, Domains, Layers
 * - @/lib/model/taxonomy/ran-buckets - RAN-specific buckets
 * - @/lib/model/taxonomy/cloud-buckets - Cloud-specific buckets
 * - @/lib/model/taxonomy/oss-buckets - OSS-specific buckets
 * - @/lib/model/taxonomy/services - Services buckets
 * - @/lib/model/taxonomy/drivers - Scaling drivers and configuration
 * - @/lib/model/taxonomy/assumptions - Model assumptions
 * - @/lib/model/taxonomy/bucket-groups - UI bucket groupings
 */

export * from './taxonomy/index';
