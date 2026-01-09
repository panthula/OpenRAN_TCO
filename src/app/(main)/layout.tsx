'use client';

import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useScenarioStore } from '@/lib/store/scenario-store';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchScenarios } = useScenarioStore();

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <Sidebar />
      <main className="ml-64 pt-4 px-8 pb-8">
        {children}
      </main>
    </div>
  );
}

