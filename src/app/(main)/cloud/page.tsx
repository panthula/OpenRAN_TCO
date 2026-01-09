'use client';

import React, { useState } from 'react';
import { Cloud, Settings, Wrench, Activity, DollarSign } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { InputTable } from '@/components/inputs/InputTable';
import { DomainDollarSummary } from '@/components/summary/DomainDollarSummary';
import {
  CloudLicenseBuckets,
  PlatformOpsBuckets,
} from '@/lib/model/taxonomy';

// Day1 cloud service buckets
const cloudServicesBuckets = [
  'cluster_bringup',
  'cicd_pipeline_setup',
  'observability_setup',
] as const;

const dayTabs = [
  { id: 'day0', label: 'Day 0', icon: <Settings className="w-4 h-4" />, description: 'Design + Procurement' },
  { id: 'day1', label: 'Day 1', icon: <Wrench className="w-4 h-4" />, description: 'Build + Integrate' },
  { id: 'day2', label: 'Day 2', icon: <Activity className="w-4 h-4" />, description: 'Operations' },
  { id: 'cloud_summary', label: 'Cloud $ Summary', icon: <DollarSign className="w-4 h-4" />, description: 'Cost Summary' },
];

export default function CloudPage() {
  const [activeDay, setActiveDay] = useState('day0');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500">
          <Cloud className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Cloud / CaaS</h1>
          <p className="text-gray-400">Cloud platform licensing, deployment, and operational costs</p>
        </div>
      </div>

      {/* Day Tabs */}
      <Tabs
        tabs={dayTabs}
        activeTab={activeDay}
        onChange={setActiveDay}
        variant="pills"
      />

      {/* Day 0 Inputs */}
      {activeDay === 'day0' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>Cloud platform licenses and initial procurement</span>
          </div>

          <Card>
            <CardHeader
              title="Cloud/CaaS Licensing"
              description="Cloud platform licenses per DU, CU, and OSS server"
            />
            <CardContent>
              <InputTable
                day="day0"
                domain="cloud"
                layer="software"
                buckets={CloudLicenseBuckets}
                defaultDriver="per_site"
                defaultScope="network_global"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Day 1 Inputs */}
      {activeDay === 'day1' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Wrench className="w-4 h-4 text-purple-400" />
            <span>Cluster deployment, CI/CD setup, and observability configuration</span>
          </div>

          <Card>
            <CardHeader
              title="Cluster Bring-up & Integration"
              description="Cloud platform setup and integration costs"
            />
            <CardContent>
              <InputTable
                day="day1"
                domain="cloud"
                layer="services"
                buckets={cloudServicesBuckets}
                defaultDriver="per_dc"
                defaultScope="dc_type"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Day 2 Inputs */}
      {activeDay === 'day2' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity className="w-4 h-4 text-green-400" />
            <span>Platform operations and ongoing license support</span>
          </div>

          <Card>
            <CardHeader
              title="Platform Operations"
              description="Observability, CI/CD, security, and backup operations"
            />
            <CardContent>
              <InputTable
                day="day2"
                domain="cloud"
                layer="services"
                buckets={PlatformOpsBuckets}
                defaultDriver="per_year"
                defaultScope="network_global"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Cloud License Support"
              description="Annual cloud platform license support (subscription or perpetual support)"
            />
            <CardContent>
              <InputTable
                day="day2"
                domain="cloud"
                layer="software"
                buckets={CloudLicenseBuckets}
                defaultDriver="per_site"
                defaultScope="network_global"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cloud $ Summary */}
      {activeDay === 'cloud_summary' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Network-scaled cost summary across all Cloud Day 0/1/2 inputs</span>
          </div>
          <DomainDollarSummary domain="cloud" />
        </div>
      )}
    </div>
  );
}
