-- Convert OSS Hardware BoM from site_archetype to network_global
-- Aggregates values if same bucket exists across multiple archetypes

-- Step 1: Create temp table with aggregated values
CREATE TEMP TABLE OssHardwareBomAggregated AS
SELECT
  scenarioVersionId,
  'day0' AS day,
  'oss' AS domain,
  'hardware_bom' AS layer,
  bucket,
  'network_global' AS scopeType,
  NULL AS scopeId,
  'per_server' AS driver,
  SUM(valueNumber) AS valueNumber,
  MAX(unit) AS unit,
  MAX(currency) AS currency,
  MAX(notes) AS notes,
  MAX(licenseModel) AS licenseModel,
  MAX(spreadYears) AS spreadYears
FROM InputFact
WHERE day = 'day0'
  AND domain = 'oss'
  AND layer = 'hardware_bom'
  AND scopeType = 'site_archetype'
GROUP BY scenarioVersionId, bucket;

-- Step 2: Delete old archetype-scoped records
DELETE FROM InputFact
WHERE day = 'day0'
  AND domain = 'oss'
  AND layer = 'hardware_bom'
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
FROM OssHardwareBomAggregated;

-- Step 4: Clean up
DROP TABLE OssHardwareBomAggregated;
