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
  Loader2,
} from 'lucide-react';
import { useScenarioStore } from '@/lib/store/scenario-store';

const navItems = [
  {
    id: 'setup',
    label: 'Setup',
    description: 'Global Settings',
    icon: Cog,
    href: '/setup',
    gradient: 'from-slate-500 to-slate-600',
    activeColor: 'slate',
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    description: 'Manage Scenarios',
    icon: FolderOpen,
    href: '/scenarios',
    gradient: 'from-amber-500 to-orange-500',
    activeColor: 'amber',
  },
  {
    id: 'ran',
    label: 'RAN',
    description: 'Radio Access Network',
    icon: Radio,
    href: '/ran',
    gradient: 'from-rose-500 to-pink-500',
    activeColor: 'rose',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    description: 'Cloud / CaaS',
    icon: Cloud,
    href: '/cloud',
    gradient: 'from-sky-500 to-blue-500',
    activeColor: 'sky',
  },
  {
    id: 'oss',
    label: 'OSS',
    description: 'OSS / SMO / RIC',
    icon: Server,
    href: '/oss',
    gradient: 'from-emerald-500 to-teal-500',
    activeColor: 'emerald',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'TCO Results',
    icon: BarChart3,
    href: '/dashboard',
    gradient: 'from-amber-500 to-yellow-500',
    activeColor: 'amber',
  },
  {
    id: 'compare',
    label: 'Compare',
    description: 'Scenario Comparison',
    icon: GitCompare,
    href: '/dashboard/comparison',
    gradient: 'from-violet-500 to-purple-500',
    activeColor: 'violet',
  },
  {
    id: 'agent',
    label: 'Agent',
    description: 'AI Analysis',
    icon: Bot,
    href: '/agent',
    gradient: 'from-fuchsia-500 to-pink-500',
    activeColor: 'fuchsia',
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
    <aside className="fixed left-0 top-[73px] bottom-0 w-64 bg-[#0d0f14]/50 border-r border-white/[0.06] overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                animate-fade-in
                ${isActive
                  ? 'bg-white/[0.06] border border-white/10'
                  : 'hover:bg-white/[0.04] border border-transparent'
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`
                relative p-2 rounded-lg bg-gradient-to-br ${item.gradient}
                ${isActive ? 'shadow-lg opacity-100' : 'opacity-60'}
                transition-all duration-200
              `}>
                <Icon className="w-4 h-4 text-white" />
                {isActive && (
                  <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${item.gradient} blur-md opacity-50`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-white/[0.06] mt-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-4">
          {/* Decorative glow */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-200">Quick Compute</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Calculate TCO with current inputs
            </p>
            <button
              onClick={handleQuickCompute}
              disabled={!currentVersion || isComputing}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-[#08090c] bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {isComputing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Computing...
                </>
              ) : (
                'Compute TCO'
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
