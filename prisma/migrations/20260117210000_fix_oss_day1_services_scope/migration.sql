-- Convert Day 1 OSS Installation & Integration from site_archetype to network_global
-- Aggregates values if same bucket exists across multiple archetypes

-- Step 1: Create temp table with aggregated values
CREATE TEMP TABLE OssDay1ServicesAggregated AS
SELECT
  scenarioVersionId,
  'day1' AS day,
  'oss' AS domain,
  'services' AS layer,
  bucket,
  'network_global' AS scopeType,
  NULL AS scopeId,
  'fixed' AS driver,
  SUM(valueNumber) AS valueNumber,
  MAX(unit) AS unit,
  MAX(currency) AS currency,
  MAX(notes) AS notes,
  MAX(licenseModel) AS licenseModel,
  MAX(spreadYears) AS spreadYears
FROM InputFact
WHERE day = 'day1'
  AND domain = 'oss'
  AND layer = 'services'
  AND bucket IN ('oss_installation', 'oss_integration', 'oss_automation_ztp')
  AND scopeType = 'site_archetype'
GROUP BY scenarioVersionId, bucket;

-- Step 2: Delete old archetype-scoped records
DELETE FROM InputFact
WHERE day = 'day1'
  AND domain = 'oss'
  AND layer = 'services'
  AND bucket IN ('oss_installation', 'oss_integration', 'oss_automation_ztp')
  AND scopeType = 'site_archetype';

-- Step 3: Insert aggregated network_global records
INSERT INTO InputFact (
  id, scenarioVersionId, day, domain, layer, bucket,
  scopeType, scopeId, driver, valueNumber,
  unit, currency, notes, licenseModel, spreadYears,
  createdAt, updatedAt
)
SELECT
  lower(hex(randomblob(16))),
  scenarioVersionId, day, domain, layer, bucket,
  scopeType, scopeId, driver, valueNumber,
  unit, currency, notes, licenseModel, spreadYears,
  datetime('now'), datetime('now')
FROM OssDay1ServicesAggregated;

-- Step 4: Clean up
DROP TABLE OssDay1ServicesAggregated;
