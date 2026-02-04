'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Cog,
  Radio,
  Cloud,
  Server,
  Bot,
  BarChart3,
  Calculator,
  GitCompare,
  FolderOpen,
} from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';

const navItems = [
  {
    id: 'setup',
    label: 'Setup',
    description: 'Global Settings',
    icon: Cog,
    href: '/setup',
    color: 'from-slate-500 to-zinc-600',
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    description: 'Manage Scenarios',
    icon: FolderOpen,
    href: '/scenarios',
    color: 'from-red-700 to-purple-900',
  },
  {
    id: 'ran',
    label: 'RAN',
    description: 'Radio Access Network',
    icon: Radio,
    href: '/ran',
    color: 'from-rose-500 to-orange-500',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    description: 'Cloud / CaaS',
    icon: Cloud,
    href: '/cloud',
    color: 'from-sky-500 to-indigo-500',
  },
  {
    id: 'oss',
    label: 'OSS',
    description: 'OSS / SMO / RIC',
    icon: Server,
    href: '/oss',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'TCO Results',
    icon: BarChart3,
    href: '/dashboard',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    id: 'compare',
    label: 'Compare',
    description: 'Scenario Comparison',
    icon: GitCompare,
    href: '/dashboard/comparison',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'agent',
    label: 'Agent',
    description: 'AI Analysis',
    icon: Bot,
    href: '/agent',
    color: 'from-fuchsia-500 to-pink-500',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { computeTco, currentVersion } = useScenarioStore();
  const [isComputing, setIsComputing] = useState(false);

  const handleQuickCompute = async () => {
    if (!currentVersion) {
      console.warn('No scenario version selected');
      return;
    }

    setIsComputing(true);
    try {
      await computeTco();
    } catch (error) {
      console.error('Compute failed:', error);
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <aside className="fixed left-0 top-[73px] bottom-0 w-64 bg-gray-900/50 border-r border-gray-800 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-gray-800 border border-gray-700'
                  : 'hover:bg-gray-800/50'
                }
              `}
            >
              <div className={`
                p-2 rounded-lg bg-gradient-to-br ${item.color}
                ${isActive ? 'shadow-lg' : 'opacity-70'}
              `}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className={`text-sm font-medium ${isActive ? 'text-gray-100' : 'text-gray-300'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-800 mt-4">
        <div className="bg-gradient-to-br from-red-700/10 to-purple-900/10 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-200">Quick Compute</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Calculate TCO with current inputs
          </p>
          <button
            onClick={handleQuickCompute}
            disabled={!currentVersion || isComputing}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-700 to-purple-900 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isComputing ? 'Computing...' : 'Compute TCO'}
          </button>
        </div>
      </div>
    </aside>
  );
}
