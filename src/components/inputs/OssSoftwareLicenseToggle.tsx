'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';
import { useScenarioStore } from '@/lib/store/scenario-store';

export function OssSoftwareLicenseToggle() {
  const { inputFacts, batchUpdateLicenseModel, currentVersion } = useScenarioStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get perpetual spread years from assumptions
  const spreadYears = useMemo(() => {
    const assumption = inputFacts.find(
      (f) => f.layer === 'assumptions' && f.bucket === 'perpetual_spread_years'
    );
    return assumption?.valueNumber ?? 1;
  }, [inputFacts]);

  // Derive toggle state: check if any OSS software fact has licenseModel='perpetual'
  const isSpreadEnabled = useMemo(() => {
    const ossSoftwareFacts = inputFacts.filter(
      (f) => f.day === 'day0' && f.domain === 'oss' && f.layer === 'software'
    );
    // Toggle is ON if any fact has perpetual license model
    return ossSoftwareFacts.some((f) => f.licenseModel === 'perpetual');
  }, [inputFacts]);

  // Count of OSS software facts (to show if there are costs to spread)
  const ossSoftwareFactCount = useMemo(() => {
    return inputFacts.filter(
      (f) => f.day === 'day0' && f.domain === 'oss' && f.layer === 'software'
    ).length;
  }, [inputFacts]);

  const handleToggleChange = async (checked: boolean) => {
    if (!currentVersion) return;

    setIsUpdating(true);
    setStatus('idle');

    try {
      await batchUpdateLicenseModel(
        { day: 'day0', domain: 'oss', layer: 'software' },
        checked ? 'perpetual' : null
      );
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentVersion) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-3 mb-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <div className="flex items-center gap-3">
        <Toggle
          checked={isSpreadEnabled}
          onChange={handleToggleChange}
          disabled={isUpdating}
          label="Spread CAPEX as Perpetual License"
        />
        {isUpdating && (
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        )}
        {status === 'error' && (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
      </div>

      {isSpreadEnabled && spreadYears > 1 && (
        <div className="flex items-center gap-1.5 text-sm text-cyan-400">
          <Calendar className="w-4 h-4" />
          <span>Over {spreadYears} years</span>
        </div>
      )}

      {isSpreadEnabled && spreadYears === 1 && (
        <div className="text-xs text-gray-500">
          Set &quot;Perpetual License Spread&quot; in Setup tab to spread costs
        </div>
      )}

      {!isSpreadEnabled && ossSoftwareFactCount === 0 && (
        <div className="text-xs text-gray-500">
          Add costs below to enable spreading
        </div>
      )}
    </div>
  );
}
