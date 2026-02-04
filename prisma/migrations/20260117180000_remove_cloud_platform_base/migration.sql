-- Remove obsolete cloud_platform_base bucket records
-- This bucket was renamed to cloud_native_platform but orphaned data remains in the database.
-- These orphan records cause a $200M discrepancy in the Cloud summary display.
DELETE FROM InputFact WHERE bucket = 'cloud_platform_base';
