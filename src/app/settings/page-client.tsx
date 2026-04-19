'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '@/lib/supabase';

export default function SettingsPage() {
  const [stats, setStats] = useState({ characters: 0, plans: 0, stickers: 0, packs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, p, s, pk] = await Promise.all([
          db.characters.list(), db.plans.list(), db.stickers.list(), db.packs.list(),
        ]);
        setStats({ characters: c.length, plans: p.length, stickers: s.length, packs: pk.length });
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-extrabold mb-5">⚙️ 設定</h2>

      {/* API Keys Info */}
      <div className="bg-white rounded-2xl p-5 mb-4 border border-coral-100 shadow-sm">
        <h3 className="text-base font-extrabold mb-3">🔑 API Keys</h3>
        <p className="text-xs text-gray-500 mb-3">
          API Keys 設定在伺服器端的 <code className="bg-coral-50 px-1.5 py-0.5 rounded text-coral-600">.env.local</code> 檔案中，不會暴露在前端。
        </p>
        <div className="space-y-3">
          <div className="bg-coral-50/50 rounded-xl p-3">
            <div className="text-xs font-bold text-coral-600 mb-1">OpenAI API Key</div>
            <p className="text-[11px] text-gray-500">
              用於 GPT Image 圖片生成。到{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" className="text-coral-500 underline">platform.openai.com</a>
              {' '}申請。建議設定每月用量上限。
            </p>
            <code className="text-[10px] text-gray-400 block mt-1">OPENAI_API_KEY=sk-...</code>
          </div>
          <div className="bg-coral-50/50 rounded-xl p-3">
            <div className="text-xs font-bold text-coral-600 mb-1">Supabase</div>
            <p className="text-[11px] text-gray-500">
              用於資料庫和圖片儲存。到{' '}
              <a href="https://supabase.com" target="_blank" className="text-coral-500 underline">supabase.com</a>
              {' '}建立免費專案。
            </p>
            <code className="text-[10px] text-gray-400 block mt-1">NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co</code>
            <code className="text-[10px] text-gray-400 block">NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...</code>
          </div>
          <div className="bg-coral-50/50 rounded-xl p-3">
            <div className="text-xs font-bold text-coral-600 mb-1">Anthropic (可選)</div>
            <p className="text-[11px] text-gray-500">
              用於 AI 角色 Prompt 生成和貼圖規劃。如不設定，這些功能會無法使用。
            </p>
            <code className="text-[10px] text-gray-400 block mt-1">ANTHROPIC_API_KEY=sk-ant-...</code>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl p-5 mb-4 border border-coral-100 shadow-sm">
        <h3 className="text-base font-extrabold mb-3">📊 統計</h3>
        {loading ? (
          <div className="text-center py-4 text-gray-300">載入中...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '🐧', label: '角色', value: stats.characters },
              { icon: '📋', label: '規劃', value: stats.plans },
              { icon: '🎨', label: '貼圖', value: stats.stickers },
              { icon: '📦', label: '貼圖包', value: stats.packs },
            ].map(s => (
              <div key={s.label} className="bg-coral-50/50 rounded-xl p-4 text-center border border-coral-100">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-[10px] text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LINE Specs */}
      <div className="bg-white rounded-2xl p-5 mb-4 border border-coral-100 shadow-sm">
        <h3 className="text-base font-extrabold mb-3">📐 LINE 貼圖規格</h3>
        <div className="text-xs text-gray-600 space-y-1.5">
          <div className="flex items-center gap-2"><span className="text-base">📐</span> 貼圖尺寸: 最大 370×320px（寬高偶數）</div>
          <div className="flex items-center gap-2"><span className="text-base">🖼️</span> 主圖: 240×240px</div>
          <div className="flex items-center gap-2"><span className="text-base">📱</span> Tab圖: 96×74px</div>
          <div className="flex items-center gap-2"><span className="text-base">📁</span> 格式: PNG，透明背景</div>
          <div className="flex items-center gap-2"><span className="text-base">🎨</span> 色彩: RGB，72dpi 以上</div>
          <div className="flex items-center gap-2"><span className="text-base">📏</span> 留白: 內容周圍約 10px margin</div>
          <div className="flex items-center gap-2"><span className="text-base">📊</span> 數量: 8 / 16 / 24 / 32 / 40 張</div>
          <div className="flex items-center gap-2"><span className="text-base">💰</span> 定價: US$0.99 起</div>
          <div className="flex items-center gap-2"><span className="text-base">💵</span> 分潤: 50%（扣除平台費 30% 後）</div>
        </div>
      </div>

      {/* Cost Estimate */}
      <div className="bg-white rounded-2xl p-5 border border-coral-100 shadow-sm">
        <h3 className="text-base font-extrabold mb-3">💰 費用估算</h3>
        <div className="text-xs text-gray-600 space-y-1.5">
          <div className="flex justify-between border-b border-gray-100 pb-1.5">
            <span>Supabase（資料庫 + 圖片儲存）</span>
            <span className="font-bold text-green-600">免費</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-1.5">
            <span>OpenAI GPT Image（每張）</span>
            <span className="font-bold">~$0.04 USD</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-1.5">
            <span>一組 40 張貼圖</span>
            <span className="font-bold">~$1.60 USD (~NT$50)</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-1.5">
            <span>Vercel 部署</span>
            <span className="font-bold text-green-600">免費</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="font-bold">每組貼圖總成本</span>
            <span className="font-extrabold text-coral-500">~NT$50</span>
          </div>
        </div>
      </div>
    </div>
  );
}
