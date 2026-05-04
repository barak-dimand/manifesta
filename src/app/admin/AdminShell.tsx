'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { GenerationLab } from './GenerationLab';
import { GenerationHistory } from './GenerationHistory';
import { DbExplorer } from './DbExplorer';
import { ModelConfig } from './ModelConfig';
import { AppLogs } from './AppLogs';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'lab', label: 'Generation Lab' },
  { id: 'history', label: 'Generation History' },
  { id: 'models', label: 'Model Config' },
  { id: 'logs', label: 'App Logs' },
  { id: 'database', label: 'Database' },
] as const;

type Tab = (typeof TABS)[number]['id'];

export function AdminShell() {
  const [activeTab, setActiveTab] = useState<Tab>('lab');
  const [historyKey, setHistoryKey] = useState(0);

  const refreshHistory = useCallback(() => setHistoryKey((k) => k + 1), []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Manifesta Admin</h1>
          <p className="text-xs text-gray-500 mt-0.5">Internal tools — restricted access</p>
        </div>
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          ← Back to app
        </Link>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-white border-indigo-500'
                  : 'text-gray-400 border-transparent hover:text-gray-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'lab' && <GenerationLab onGenerated={refreshHistory} />}
        {activeTab === 'history' && <GenerationHistory key={historyKey} />}
        {activeTab === 'models' && <ModelConfig />}
        {activeTab === 'logs' && <AppLogs />}
        {activeTab === 'database' && <DbExplorer />}
      </main>
    </div>
  );
}
