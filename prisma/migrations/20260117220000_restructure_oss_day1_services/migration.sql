-- Restructure OSS Day 1 Installation & Integration
-- Removes old buckets (oss_installation, oss_integration, oss_automation_ztp)
-- New structure uses:
-- - OSS Installation: oss_server_install, oss_server_sw_onboarding (fixed driver)
-- - OSS Integration: oss_ran_integration, oss_transport_integration, oss_mw_integration,
--                    oss_northbound_integration, oss_southbound_integration, oss_other_integration (per_integration driver)

-- Delete old OSS Day 1 service bucket data from InputFact
DELETE FROM InputFact
WHERE day = 'day1'
  AND domain = 'oss'
  AND layer = 'services'
  AND bucket IN ('oss_installation', 'oss_integration', 'oss_automation_ztp');

-- Delete related computed facts for old buckets
DELETE FROM ComputedFact
WHERE bucket IN ('oss_installation', 'oss_integration', 'oss_automation_ztp');
