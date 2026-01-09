'use client';

import React, { useState } from 'react';
import { Server, Settings, Wrench, Activity, Users, DollarSign } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { InputTable } from '@/components/inputs/InputTable';
import { DomainDollarSummary } from '@/components/summary/DomainDollarSummary';
import {
  OssBomBuckets,
  OssSoftwareBuckets,
  StaffingRoles,
} from '@/lib/model/taxonomy';

// Day1 OSS service buckets
const ossServicesBuckets = [
  'oss_installation',
  'oss_integration',
  'oss_automation_ztp',
] as const;

const dayTabs = [
  { id: 'day0', label: 'Day 0', icon: <Settings className="w-4 h-4" />, description: 'Design + Procurement' },
  { id: 'day1', label: 'Day 1', icon: <Wrench className="w-4 h-4" />, description: 'Build + Integrate' },
  { id: 'day2', label: 'Day 2', icon: <Activity className="w-4 h-4" />, description: 'Operations' },
  { id: 'oss_summary', label: 'OSS $ Summary', icon: <DollarSign className="w-4 h-4" />, description: 'Cost Summary' },
];

export default function OssPage() {
  const [activeDay, setActiveDay] = useState('day0');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
          <Server className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">OSS / SMO / RIC</h1>
          <p className="text-gray-400">Operations support systems, orchestration, and intelligent controller costs</p>
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
            <span>Hardware procurement and software licensing</span>
          </div>

          <Card>
            <CardHeader
              title="OSS Hardware BoM"
              description="Server costs by category"
            />
            <CardContent>
              <InputTable
                day="day0"
                domain="oss"
                layer="hardware_bom"
                buckets={OssBomBuckets}
                defaultDriver="per_server"
                defaultScope="dc_type"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="OSS/SMO/RIC Software Procurement"
              description="Site management, intelligent ops, SMO platform, and AI licenses"
            />
            <CardContent>
              <InputTable
                day="day0"
                domain="oss"
                layer="software"
                buckets={OssSoftwareBuckets}
                defaultDriver="per_license_unit"
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
            <span>OSS platform deployment and integration</span>
          </div>

          <Card>
            <CardHeader
              title="OSS Installation & Integration"
              description="OSS platform deployment and integration costs"
            />
            <CardContent>
              <InputTable
                day="day1"
                domain="oss"
                layer="services"
                buckets={ossServicesBuckets}
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
            <span>Ongoing software support and operations staffing</span>
          </div>

          <Card>
            <CardHeader
              title="OSS Software Support"
              description="Annual OSS/SMO/RIC software subscriptions and support"
            />
            <CardContent>
              <InputTable
                day="day2"
                domain="oss"
                layer="software"
                buckets={OssSoftwareBuckets}
                defaultDriver="per_license_unit"
                defaultScope="network_global"
              />
            </CardContent>
          </Card>

          {/* Staffing Section */}
          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-gray-200">Operations Staffing</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Annual staffing costs across all operational roles (NOC, SOC, RAN Ops, Cloud Ops, OSS/Automation).
            </p>
          </div>

          <Card>
            <CardHeader
              title="Operations Staffing"
              description="Annual staffing costs by role (NOC, SOC, RAN Ops, Cloud Ops, OSS/Automation)"
            />
            <CardContent>
              <InputTable
                day="day2"
                domain="oss"
                layer="staffing"
                buckets={StaffingRoles}
                defaultDriver="per_year"
                defaultScope="network_global"
              />
            </CardContent>
          </Card>

          <Card variant="gradient">
            <CardHeader
              title="Staffing Drivers (Coming Soon)"
              description="Configure automation levels and workload parameters"
            />
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 mb-1">Coverage Factor</p>
                  <p className="text-xl font-semibold text-cyan-400">4.2x</p>
                  <p className="text-xs text-gray-500">24x7 multiplier</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 mb-1">Auto-Remediation</p>
                  <p className="text-xl font-semibold text-green-400">60%</p>
                  <p className="text-xs text-gray-500">Events auto-resolved</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 mb-1">Auto-Containment</p>
                  <p className="text-xl font-semibold text-purple-400">40%</p>
                  <p className="text-xs text-gray-500">Threats contained</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* OSS $ Summary */}
      {activeDay === 'oss_summary' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Network-scaled cost summary across all OSS Day 0/1/2 inputs</span>
          </div>
          <DomainDollarSummary domain="oss" />
        </div>
      )}
    </div>
  );
}
