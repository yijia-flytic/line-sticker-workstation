'use client';

import { useState } from 'react';
import CharactersPage from './characters/page-client';
import PlansPage from './plans/page-client';
import GeneratePage from './generate/page-client';
import ReviewPage from './review/page-client';
import SettingsPage from './settings/page-client';

const TABS = [
  { id: 'characters', label: '角色設計', icon: '🐧', layer: 'L1' },
  { id: 'plans', label: '貼圖規劃', icon: '📋', layer: 'L2' },
  { id: 'generate', label: '生成貼圖', icon: '🎨', layer: 'L3' },
  { id: 'review', label: '檢查上架', icon: '✅', layer: 'L4' },
  { id: 'settings', label: '設定', icon: '⚙️', layer: '' },
];

export default function Home() {
  const [tab, setTab] = useState('characters');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-coral-500 via-peach-500 to-peach-400 px-4 py-4 text-white">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="text-3xl drop-shadow">🎨</span>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">LINE 貼圖工作站</h1>
            <p className="text-xs opacity-80">設計 · 規劃 · 生成 · 上架</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b-2 border-coral-100 sticky top-0 z-20 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 min-w-[72px] border-b-3 transition-all text-sm font-bold
                ${tab === t.id
                  ? 'border-coral-500 bg-coral-50 text-coral-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-[11px]">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        <div className="animate-fadeIn">
          {tab === 'characters' && <CharactersPage />}
          {tab === 'plans' && <PlansPage />}
          {tab === 'generate' && <GeneratePage />}
          {tab === 'review' && <ReviewPage />}
          {tab === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
