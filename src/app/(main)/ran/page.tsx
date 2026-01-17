'use client';

import React, { useState } from 'react';
import { Radio, Settings, Wrench, Activity, DollarSign } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { InputTable } from '@/components/inputs/InputTable';
import { RanDollarSummary } from '@/components/ran/RanDollarSummary';
import {
  RanSiteBomBuckets,
  RanCuDcBomBuckets,
  RanSoftwareBuckets,
  RanSoftwareSiteBuckets,
  RanSoftwareDcBuckets,
  SiteOpexBuckets,
  LifecycleBuckets,
} from '@/lib/model/taxonomy';

// Day1 service buckets for RAN - Site installation items (scaled per_site)
const ranSiteInstallationBuckets = [
  'site_installation',
  'transport_fiber_integration',
  'automation_ztp_enablement',
] as const;

// Day1 service buckets for RAN - CU installation items (scaled per_cu)
const ranCuInstallationBuckets = [
  'dc_installation',
  'ru_du_cu_commissioning',
] as const;

const ranTestingBuckets = [
  'site_acceptance_testing',
  'cluster_acceptance_testing',
  'network_acceptance_testing',
  'drive_tests',
  'security_validation',
] as const;

const dayTabs = [
  { id: 'day0', label: 'Day 0', icon: <Settings className="w-4 h-4" />, description: 'Design + Procurement' },
  { id: 'day1', label: 'Day 1', icon: <Wrench className="w-4 h-4" />, description: 'Build + Integrate' },
  { id: 'day2', label: 'Day 2', icon: <Activity className="w-4 h-4" />, description: 'Operations' },
  { id: 'ran_summary', label: 'RAN $ Summary', icon: <DollarSign className="w-4 h-4" />, description: 'Cost Summary' },
];

export default function RanPage() {
  const [activeDay, setActiveDay] = useState('day0');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500">
          <Radio className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">RAN</h1>
          <p className="text-gray-400">Radio Access Network hardware, software, and operational costs</p>
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
            <span>Hardware procurement, software licensing, and planning costs</span>
          </div>

          <Card>
            <CardHeader
              title="RAN Site Hardware BoM"
              description="Per-site hardware costs by archetype"
            />
            <CardContent>
              <InputTable
                day="day0"
                domain="ran"
                layer="hardware_bom"
                buckets={RanSiteBomBuckets}
                defaultDriver="per_site"
                defaultScope="site_archetype"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="RAN CU-in-DC Hardware BoM"
              description="Per-CU hardware costs at data centers"
            />
            <CardContent>
              <InputTable
                day="day0"
                domain="ran"
                layer="hardware_bom"
                buckets={RanCuDcBomBuckets}
                defaultDriver="per_cu"
                defaultScope="site_archetype"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="RAN - SW /Site"
              description="Per-site software licenses (DU, RU)"
            />
            <CardContent>
              <InputTable
                day="day0"
                domain="ran"
                layer="software"
                buckets={RanSoftwareSiteBuckets}
                defaultDriver="per_site"
                defaultScope="site_archetype"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="RAN SW/ DC"
              description="CU software, 3PP licenses, and other one-time licenses (per site archetype)"
            />
            <CardContent>
              <InputTable
                day="day0"
                domain="ran"
                layer="software"
                buckets={RanSoftwareDcBuckets}
                defaultDriver="per_cu"
                defaultScope="site_archetype"
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
            <span>Installation, commissioning, integration, and testing costs</span>
          </div>

          <Card>
            <CardHeader
              title="Physical Installation"
              description="Site and CU installation costs by archetype"
            />
            <CardContent>
              <div className="space-y-6">
                {/* Site Installation Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                    <span className="text-sm font-medium text-gray-300">Site Installation</span>
                    <span className="text-xs text-gray-500">(per site)</span>
                  </div>
                  <InputTable
                    day="day1"
                    domain="ran"
                    layer="services"
                    buckets={ranSiteInstallationBuckets}
                    defaultDriver="per_site"
                    defaultScope="site_archetype"
                  />
                </div>

                {/* CU Installation Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                    <span className="text-sm font-medium text-gray-300">CU Installation</span>
                    <span className="text-xs text-gray-500">(per CU)</span>
                  </div>
                  <InputTable
                    day="day1"
                    domain="ran"
                    layer="services"
                    buckets={ranCuInstallationBuckets}
                    defaultDriver="per_cu"
                    defaultScope="site_archetype"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Testing & Acceptance"
              description="Site, cluster, network, and security testing"
            />
            <CardContent>
              <InputTable
                day="day1"
                domain="ran"
                layer="services"
                buckets={ranTestingBuckets}
                defaultDriver="per_site"
                defaultScope="site_archetype"
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
            <span>Recurring operational costs and lifecycle management</span>
          </div>

          <Card>
            <CardHeader
              title="Site Recurring Costs"
              description="Annual lease, power, and backhaul costs per site"
            />
            <CardContent>
              <InputTable
                day="day2"
                domain="ran"
                layer="site_opex"
                buckets={SiteOpexBuckets}
                defaultDriver="per_site"
                defaultScope="site_archetype"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="RAN Software Support"
              description="Annual software maintenance and support costs"
            />
            <CardContent>
              <InputTable
                day="day2"
                domain="ran"
                layer="software"
                buckets={RanSoftwareBuckets}
                defaultDriver="per_site"
                defaultScope="site_archetype"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Lifecycle Management"
              description="Patching, upgrades, vulnerability management, and expansion"
            />
            <CardContent>
              <InputTable
                day="day2"
                domain="ran"
                layer="lifecycle"
                buckets={LifecycleBuckets}
                defaultDriver="per_year"
                defaultScope="network_global"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* RAN $ Summary */}
      {activeDay === 'ran_summary' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Network-scaled cost summary across all RAN Day 0/1/2 inputs</span>
          </div>
          <RanDollarSummary />
        </div>
      )}
    </div>
  );
}
