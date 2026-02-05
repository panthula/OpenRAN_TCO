'use client';

import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

export function Tabs({ tabs, activeTab, onChange, variant = 'default' }: TabsProps) {
  const containerStyles = {
    default: 'bg-[#12151c] p-1 rounded-lg border border-white/[0.06]',
    pills: 'gap-2',
    underline: 'border-b border-white/[0.06] gap-6',
  };

  const tabStyles = {
    default: (isActive: boolean) => `
      px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
      ${isActive
        ? 'bg-[#232933] text-amber-400 shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }
    `,
    pills: (isActive: boolean) => `
      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
      ${isActive
        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-[#08090c] shadow-lg shadow-amber-500/20'
        : 'bg-[#181c25] text-slate-400 hover:text-slate-200 hover:bg-[#232933]'
      }
    `,
    underline: (isActive: boolean) => `
      px-1 py-3 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2 -mb-px
      ${isActive
        ? 'border-amber-500 text-amber-400'
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
      }
    `,
  };

  return (
    <div className={`flex items-center gap-1 ${containerStyles[variant]}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={tabStyles[variant](activeTab === tab.id)}
        >
          {tab.icon && <span className="mr-2 inline-flex">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
