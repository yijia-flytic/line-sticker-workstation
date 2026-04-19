'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { db, Plan, Character, PlanItem } from '@/lib/supabase';

const EMOJI_MAP: Record<string, string> = {'企鵝':'🐧','小雞':'🐥','小鴨':'🦆','柴犬':'🐕','貓咪':'🐱','兔子':'🐰','熊':'🐻','倉鼠':'🐹','水獺':'🦦','海豹':'🦭','恐龍':'🦕','狐狸':'🦊'};

export default function GeneratePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selPlanId, setSelPlanId] = useState('');
  const [selCharId, setSelCharId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [results, setResults] = useState<{ item: PlanItem; imageUrl: string; stickerId: string }[]>([]);
  const abortRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([db.plans.list(), db.characters.list()]);
      setPlans(p); setCharacters(c);
    })();
  }, []);

  const plan = plans.find(p => p.id === selPlanId);
  const char = characters.find(c => c.id === (selCharId || plan?.character_id));
  const confirmedItems = (plan?.plan_items || []).filter(i => i.is_confirmed).sort((a, b) => a.sort_order - b.sort_order);

  const generateAll = async () => {
    if (!plan || !char) return;
    setGenerating(true);
    setResults([]);
    abortRef.current = false;

    const total = confirmedItems.length;
    setProgress({ current: 0, total, status: '開始生成...' });

    for (let i = 0; i < total; i++) {
      if (abortRef.current) break;
      const item = confirmedItems[i];
      setProgress({ current: i + 1, total, status: `生成 #${i + 1}: ${item.text || item.emotion}` });

      const prompt = buildPrompt(char, item);

      try {
        // Create sticker record first
        const sticker = await db.stickers.create({
          character_id: char.id,
          plan_id: plan.id,
          plan_item_id: item.id,
          prompt,
          emotion: item.emotion,
          text: item.text,
          status: 'generating',
        });

        // Call generate API
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            stickerId: sticker.id,
            characterName: char.name,
            emotion: item.emotion,
            text: item.text,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setResults(prev => [...prev, { item, imageUrl: data.image_url, stickerId: sticker.id }]);
      } catch (e: any) {
        toast.error(`#${i + 1} 失敗: ${e.message}`);
      }

      // Rate limiting
      if (i < total - 1) await new Promise(r => setTimeout(r, 1500));
    }

    setGenerating(false);
    setProgress(prev => ({ ...prev, status: '完成！' }));
    toast.success(`生成完成！共 ${results.length + 1} 張`);
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold">🎨 貼圖生成站</h2>
        <p className="text-xs text-gray-400 mt-1">選擇角色 + 規劃，一鍵生成所有貼圖圖片並存入資料庫</p>
      </div>

      <div className="bg-white rounded-2xl p-5 mb-5 border border-coral-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-bold text-peach-500 uppercase tracking-wide">選擇規劃</label>
            <select value={selPlanId} onChange={e => { setSelPlanId(e.target.value); setResults([]); }}
              className="w-full border-2 border-coral-100 rounded-lg px-3 py-2 text-sm bg-coral-50/20 focus:border-coral-400 outline-none mt-1">
              <option value="">-- 選擇貼圖規劃 --</option>
              {plans.map(p => {
                const confirmed = (p.plan_items || []).filter(i => i.is_confirmed).length;
                return <option key={p.id} value={p.id}>{p.theme} ({confirmed} 張已確認)</option>;
              })}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-peach-500 uppercase tracking-wide">覆寫角色（可選）</label>
            <select value={selCharId} onChange={e => setSelCharId(e.target.value)}
              className="w-full border-2 border-coral-100 rounded-lg px-3 py-2 text-sm bg-coral-50/20 focus:border-coral-400 outline-none mt-1">
              <option value="">-- 使用規劃預設角色 --</option>
              {characters.map(c => <option key={c.id} value={c.id}>{EMOJI_MAP[c.type]||'🐾'} {c.name}</option>)}
            </select>
          </div>
        </div>

        {plan && (
          <div className="bg-coral-50/50 rounded-xl p-3 mb-4 text-sm">
            <div>📌 主題: <strong>{plan.theme}</strong></div>
            <div>🐧 角色: <strong>{char?.name || '未指定'}</strong></div>
            <div>📊 已確認: <strong>{confirmedItems.length}</strong> 張</div>
            <div className="text-[10px] text-gray-400 mt-1">
              預估費用: ~${(confirmedItems.length * 0.04).toFixed(2)} USD（GPT Image medium）· 預估時間: ~{Math.ceil(confirmedItems.length * 15 / 60)} 分鐘
            </div>
          </div>
        )}

        {/* Progress */}
        {generating && (
          <div className="mb-4">
            <div className="w-full h-2.5 bg-coral-100 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-coral-500 to-peach-500 rounded-full transition-all duration-300 progress-shine"
                style={{ width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs font-bold text-coral-500">{progress.status} ({progress.current}/{progress.total})</span>
              <button onClick={() => { abortRef.current = true; }}
                className="border border-gray-200 text-gray-400 px-3 py-1 rounded-lg text-xs">⏹ 停止</button>
            </div>
          </div>
        )}

        <button onClick={generateAll}
          disabled={generating || !plan || !char || !confirmedItems.length}
          className="w-full bg-gradient-to-r from-coral-500 to-peach-500 text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-coral-200 disabled:opacity-40 transition-all">
          {generating ? `⏳ 生成中 ${progress.current}/${progress.total}...` : `🎨 開始生成 ${confirmedItems.length} 張貼圖`}
        </button>
      </div>

      {/* Results Preview */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-coral-100 shadow-sm animate-fadeIn">
          <h3 className="text-base font-extrabold mb-4">生成結果 ({results.length} 張)</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {results.map((r, i) => (
              <div key={r.stickerId} className="rounded-xl overflow-hidden border border-coral-100 card-hover">
                <div className="aspect-square checkerboard">
                  <img src={r.imageUrl} alt={r.item.text || r.item.emotion}
                    className="w-full h-full object-contain" />
                </div>
                <div className="p-1.5 text-center">
                  <div className="text-[10px] font-bold truncate">{r.item.text || r.item.emotion}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildPrompt(char: Character, item: PlanItem): string {
  const basePrompt = char.full_prompt || `A cute kawaii ${char.type} character in ${char.style} style, chibi proportions, simple clean design`;

  return `${basePrompt}

Scene: ${item.description || item.scenario || item.emotion}
Expression: ${item.emotion}
${item.text ? `The character is associated with the mood "${item.text}" (do NOT render any text in the image)` : ''}

Style: LINE sticker style, kawaii, chibi proportions, simple clean design, bold outlines, centered composition, transparent background, no text rendered in image, exaggerated cute expression, sticker-ready illustration, single character, high contrast, vibrant colors`;
}
