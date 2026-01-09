'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/Input';
import { DefaultModelAssumptions } from '@/lib/model/taxonomy';

export function AssumptionsEditor() {
  const {
    currentVersion,
    inputFacts,
    saveInputFact,
  } = useScenarioStore();

  const [assumptions, setAssumptions] = useState({
    tco_years: DefaultModelAssumptions.tco_years,
    discount_rate: DefaultModelAssumptions.discount_rate,
    perpetual_spread_years: 1,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing assumptions
  useEffect(() => {
    const assumptionFacts = inputFacts.filter(f => f.layer === 'assumptions');
    const newAssumptions = { ...DefaultModelAssumptions, perpetual_spread_years: 1 };

    for (const fact of assumptionFacts) {
      if (fact.bucket === 'tco_years') {
        newAssumptions.tco_years = fact.valueNumber;
      } else if (fact.bucket === 'discount_rate') {
        newAssumptions.discount_rate = fact.valueNumber;
      } else if (fact.bucket === 'perpetual_spread_years') {
        newAssumptions.perpetual_spread_years = fact.valueNumber;
      }
    }

    setAssumptions(newAssumptions);
  }, [inputFacts]);

  const handleChange = (key: keyof typeof assumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentVersion) return;
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage(null);

    try {
      const assumptionFacts = inputFacts.filter(f => f.layer === 'assumptions');

      for (const [key, value] of Object.entries(assumptions)) {
        const existingFact = assumptionFacts.find(f => f.bucket === key);
        await saveInputFact({
          id: existingFact?.id,
          scenarioVersionId: currentVersion.id,
          day: 'day2',
          domain: 'ran',
          layer: 'assumptions',
          bucket: key,
          scopeType: 'network_global',
          scopeId: null,
          driver: 'fixed',
          valueNumber: Number(value) || 0,
          unit: key === 'discount_rate' ? 'rate' : 'years',
        });
      }

      setSaveStatus('success');
      setHasChanges(false);
      
      // Clear success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setErrorMessage((error as Error).message || 'Failed to save assumptions');
      
      // Clear error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentVersion) {
    return null;
  }

  return (
    <Card variant="gradient">
      <CardHeader
        title="Model Assumptions"
        description="Financial parameters and model settings"
        action={
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Saved</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-400" title={errorMessage || undefined}>
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Save failed</span>
              </div>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        }
      />
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Settings className="w-4 h-4" />
              <span>TCO Duration (Years)</span>
            </div>
            <NumberInput
              value={assumptions.tco_years}
              onChange={(v) => handleChange('tco_years', v)}
              min={1}
              max={30}
              helperText="Duration of TCO analysis (default: 5)"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Settings className="w-4 h-4" />
              <span>Discount Rate</span>
            </div>
            <NumberInput
              value={assumptions.discount_rate}
              onChange={(v) => handleChange('discount_rate', v)}
              min={0}
              max={1}
              step={0.01}
              helperText="Annual discount rate for NPV (default: 0.08)"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Settings className="w-4 h-4" />
              <span>Perpetual License Spread (Years)</span>
            </div>
            <NumberInput
              value={assumptions.perpetual_spread_years}
              onChange={(v) => handleChange('perpetual_spread_years', v)}
              min={1}
              max={10}
              helperText="Years to spread perpetual CAPEX (default: 1)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

