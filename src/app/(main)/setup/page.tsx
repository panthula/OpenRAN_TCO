'use client';

import React from 'react';
import { Cog, Network, Building2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { SiteArchetypeEditor } from '@/components/inputs/SiteArchetypeEditor';
import { DcTypeEditor } from '@/components/inputs/DcTypeEditor';
import { AssumptionsEditor } from '@/components/inputs/AssumptionsEditor';

export default function SetupPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-zinc-600">
          <Cog className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Setup</h1>
          <p className="text-gray-400">Configure global model assumptions and network topology</p>
        </div>
      </div>

      {/* Model Assumptions */}
      <AssumptionsEditor />

      {/* Network Topology Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-gray-200">Network Topology</h2>
        </div>
        <p className="text-sm text-gray-400">
          Define site archetypes and data center types that will be used across all domain inputs.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SiteArchetypeEditor />
          <DcTypeEditor />
        </div>
      </div>

      {/* Info Card */}
      <Card variant="gradient">
        <CardHeader
          title="Getting Started"
          description="Complete these settings before entering domain-specific inputs"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">1</div>
                <p className="text-gray-300 font-medium">Model Assumptions</p>
              </div>
              <p className="text-xs text-gray-500">Set TCO duration, discount rate, and currency for NPV calculations.</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">2</div>
                <p className="text-gray-300 font-medium">Site Archetypes</p>
              </div>
              <p className="text-xs text-gray-500">Define site types (Urban, Rural, etc.) with site counts and CU allocations.</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">3</div>
                <p className="text-gray-300 font-medium">DC Types</p>
              </div>
              <p className="text-xs text-gray-500">Configure Edge, Regional, and Central data center quantities.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
