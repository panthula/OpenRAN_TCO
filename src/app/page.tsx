'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScenarioStore } from '@/lib/store/scenario-store';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { Radio, ArrowRight, Database, Activity, Bot } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { scenarios, currentScenario, fetchScenarios, isLoading } = useScenarioStore();

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  useEffect(() => {
    // If there's a current scenario, redirect to Setup
    if (currentScenario) {
      router.push('/setup');
    }
  }, [currentScenario, router]);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <Sidebar />
      
      <main className="ml-64 pt-4 px-8 pb-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800 p-12 mb-8">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 shadow-lg shadow-cyan-500/30">
                <Radio className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-100">OpenRAN TCO Modeler</h1>
                <p className="text-gray-400">Total Cost of Ownership Analysis Platform</p>
              </div>
            </div>

            <p className="text-lg text-gray-300 max-w-2xl mb-8">
              Model and analyze the complete lifecycle costs of your OpenRAN deployment. 
              From Day 0 design and procurement through Day 2 operations, get comprehensive 
              insights into RAN, Cloud, and OSS investments.
            </p>

            {scenarios.length === 0 && !isLoading ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 max-w-md">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Get Started</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Create your first scenario to begin modeling TCO
                </p>
                <Button onClick={() => document.querySelector<HTMLButtonElement>('[data-new-scenario]')?.click()}>
                  Create Your First Scenario
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => router.push('/setup')} size="lg">
                Continue to Setup
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors">
            <div className="p-3 rounded-xl bg-cyan-500/20 w-fit mb-4">
              <Database className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Bucketed Inputs</h3>
            <p className="text-sm text-gray-400">
              Granular cost modeling by domain (RAN, Cloud, OSS), lifecycle phase, 
              and standardized buckets for maximum queryability.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
            <div className="p-3 rounded-xl bg-purple-500/20 w-fit mb-4">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Scenario Analysis</h3>
            <p className="text-sm text-gray-400">
              Clone baselines, run parameter sweeps, and compare what-if scenarios 
              with versioned inputs and computed outputs.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-500/50 transition-colors">
            <div className="p-3 rounded-xl bg-green-500/20 w-fit mb-4">
              <Bot className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">AI Agent</h3>
            <p className="text-sm text-gray-400">
              Ask questions, get insights, and let AI propose optimizations. 
              Review and approve changes before they&apos;re applied.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
