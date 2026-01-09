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
  const baseStyles = 'flex items-center gap-1';
  
  const variants = {
    default: 'bg-gray-800/50 p-1 rounded-lg',
    pills: 'gap-2',
    underline: 'border-b border-gray-700 gap-4',
  };

  const tabStyles = {
    default: (isActive: boolean) => `
      px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
      ${isActive 
        ? 'bg-gray-700 text-cyan-400 shadow-md' 
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
      }
    `,
    pills: (isActive: boolean) => `
      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
      ${isActive 
        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
        : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
      }
    `,
    underline: (isActive: boolean) => `
      px-1 py-3 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2 -mb-px
      ${isActive 
        ? 'border-cyan-500 text-cyan-400' 
        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
      }
    `,
  };

  return (
    <div className={`${baseStyles} ${variants[variant]}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={tabStyles[variant](activeTab === tab.id)}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

