'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db, Plan, PlanItem, Character } from '@/lib/supabase';

const EMOJI_MAP: Record<string, string> = {'企鵝':'🐧','小雞':'🐥','小鴨':'🦆','柴犬':'🐕','貓咪':'🐱','兔子':'🐰','熊':'🐻','倉鼠':'🐹','水獺':'🦦','海豹':'🦭','恐龍':'🦕','狐狸':'🦊'};
const COUNTS = [8, 16, 24, 32, 40];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editing, setEditing] = useState<(Partial<Plan> & { items?: Partial<PlanItem>[] }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([db.plans.list(), db.characters.list()]);
      setPlans(p); setCharacters(c);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing({ theme: '', character_id: null, target_count: 40, notes: '', items: [] });
    setIsNew(true);
  };

  const startEdit = (p: Plan) => {
    setEditing({ ...p, items: (p.plan_items || []).sort((a, b) => a.sort_order - b.sort_order) });
    setIsNew(false);
  };

  const aiBatch = async () => {
    if (!editing?.theme) return;
    setAiLoading(true);
    try {
      const char = characters.find(c => c.id === editing.character_id);
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_plan',
          data: { theme: editing.theme, character: char, target_count: editing.target_count, notes: editing.notes },
        }),
      });
      const data = await res.json();
      if (data.result) {
        const cleaned = data.result.replace(/```json\n?|```/g, '').trim();
        const items = JSON.parse(cleaned);
        setEditing(prev => ({
          ...prev!,
          items: items.map((item: any, i: number) => ({
            emotion: item.emotion || '',
            scenario: item.scenario || '',
            text: item.text || '',
            description: item.description || '',
            sort_order: i,
            is_confirmed: false,
          })),
        }));
        toast.success(`已生成 ${items.length} 張規劃！`);
      }
    } catch (e: any) { toast.error('生成失敗: ' + e.message); }
    setAiLoading(false);
  };

  const save = async () => {
    if (!editing?.theme?.trim()) return;
    try {
      if (isNew) {
        const plan = await db.plans.create({
          theme: editing.theme,
          character_id: editing.character_id || null,
          target_count: editing.target_count,
          notes: editing.notes,
        });
        if (editing.items?.length) {
          await db.planItems.bulkCreate(
            editing.items.map((item, i) => ({ ...item, plan_id: plan.id, sort_order: i }))
          );
        }
        toast.success('規劃已建立！');
      } else {
        await db.plans.update(editing.id!, {
          theme: editing.theme,
          character_id: editing.character_id || null,
          target_count: editing.target_count,
          notes: editing.notes,
        });
        // Replace all items
        await db.planItems.deleteByPlan(editing.id!);
        if (editing.items?.length) {
          await db.planItems.bulkCreate(
            editing.items.map((item, i) => ({ ...item, plan_id: editing.id!, sort_order: i, id: undefined }))
          );
        }
        toast.success('規劃已更新！');
      }
      setEditing(null);
      load();
    } catch (e: any) { toast.error('儲存失敗: ' + e.message); }
  };

  const del = async (id: string) => {
    if (!confirm('確定刪除此規劃？')) return;
    try { await db.plans.delete(id); toast.success('已刪除'); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const toggleItem = (idx: number) => {
    setEditing(prev => {
      if (!prev?.items) return prev;
      const items = [...prev.items];
      items[idx] = { ...items[idx], is_confirmed: !items[idx].is_confirmed };
      return { ...prev, items };
    });
  };

  const removeItem = (idx: number) => {
    setEditing(prev => {
      if (!prev?.items) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== idx) };
    });
  };

  const confirmAll = () => {
    setEditing(prev => {
      if (!prev?.items) return prev;
      return { ...prev, items: prev.items.map(item => ({ ...item, is_confirmed: true })) };
    });
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold">📋 貼圖內容規劃</h2>
          <p className="text-xs text-gray-400 mt-1">規劃每張貼圖的情境和文字，AI 可一次生成整組</p>
        </div>
        <button onClick={startNew} className="bg-gradient-to-r from-coral-500 to-peach-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-coral-200">
          + 新規劃
        </button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-white rounded-2xl p-5 mb-5 border border-coral-100 shadow-sm animate-fadeIn">
          <h3 className="text-base font-extrabold mb-4">{isNew ? '✨ 新規劃' : '✏️ 編輯規劃'}</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-bold text-peach-500 uppercase tracking-wide">主題 *</label>
              <input value={editing.theme || ''} onChange={e => setEditing({ ...editing, theme: e.target.value })}
                placeholder="上班族崩潰日常" className="w-full border-2 border-coral-100 rounded-lg px-3 py-2 text-sm bg-coral-50/20 focus:border-coral-400 outline-none mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-peach-500 uppercase tracking-wide">角色</label>
              <select value={editing.character_id || ''} onChange={e => setEditing({ ...editing, character_id: e.target.value || null })}
                className="w-full border-2 border-coral-100 rounded-lg px-3 py-2 text-sm bg-coral-50/20 focus:border-coral-400 outline-none mt-1">
                <option value="">-- 選擇 --</option>
                {characters.map(c => <option key={c.id} value={c.id}>{EMOJI_MAP[c.type]||'🐾'} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-peach-500 uppercase tracking-wide">數量</label>
              <select value={editing.target_count || 40} onChange={e => setEditing({ ...editing, target_count: +e.target.value })}
                className="w-full border-2 border-coral-100 rounded-lg px-3 py-2 text-sm bg-coral-50/20 focus:border-coral-400 outline-none mt-1">
                {COUNTS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-peach-500 uppercase tracking-wide">備註</label>
              <input value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })}
                placeholder="特殊需求" className="w-full border-2 border-coral-100 rounded-lg px-3 py-2 text-sm bg-coral-50/20 focus:border-coral-400 outline-none mt-1" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={aiBatch} disabled={aiLoading || !editing.theme}
              className="border-2 border-coral-500 text-coral-500 px-4 py-2 rounded-lg text-xs font-bold hover:bg-coral-50 disabled:opacity-40">
              {aiLoading ? '⏳ AI 規劃中...' : `🤖 AI 生成 ${editing.target_count} 張`}
            </button>
            <button onClick={() => setEditing(prev => ({ ...prev!, items: [...(prev!.items || []), { emotion:'', scenario:'', text:'', description:'', sort_order: prev!.items?.length || 0, is_confirmed: false }] }))}
              className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-xs hover:bg-gray-50">+ 手動新增</button>
            {(editing.items?.length || 0) > 0 && (
              <button onClick={confirmAll} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-xs hover:bg-gray-50">全部確認 ✓</button>
            )}
          </div>

          {/* Stats */}
          {(editing.items?.length || 0) > 0 && (
            <div className="text-xs font-bold bg-coral-50/50 rounded-lg px-3 py-2 mb-3">
              共 {editing.items!.length} 張 · <span className="text-green-600">✓ {editing.items!.filter(s => s.is_confirmed).length} 已確認</span>
            </div>
          )}

          {/* Item list */}
          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
            {(editing.items || []).map((item, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 bg-coral-50/30 border-l-3 ${item.is_confirmed ? 'border-green-400' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-300 w-6">#{i+1}</span>
                  {item.emotion && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-semibold">{item.emotion}</span>}
                  {item.scenario && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">{item.scenario}</span>}
                  <div className="flex-1" />
                  <button onClick={() => toggleItem(i)}
                    className={`w-5 h-5 rounded-full border-2 text-[10px] flex items-center justify-center
                      ${item.is_confirmed ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                    {item.is_confirmed ? '✓' : ''}
                  </button>
                  <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400 text-sm">×</button>
                </div>
                {item.text && <div className="font-bold text-xs mt-1">「{item.text}」</div>}
                {item.description && <div className="text-[10px] text-gray-400 mt-0.5 italic">{item.description}</div>}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setEditing(null)} className="border border-gray-200 text-gray-400 px-4 py-2 rounded-xl text-sm">取消</button>
            <button onClick={save} disabled={!editing.theme?.trim()}
              className="bg-gradient-to-r from-coral-500 to-peach-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-coral-200 disabled:opacity-40">
              💾 儲存規劃
            </button>
          </div>
        </div>
      )}

      {/* Plan Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-300">載入中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(p => {
            const char = p.character;
            const items = p.plan_items || [];
            const confirmed = items.filter(i => i.is_confirmed).length;
            return (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-coral-100 card-hover">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-extrabold text-base">{p.theme}</div>
                  {char && <span className="text-[10px] bg-coral-50 px-2 py-0.5 rounded-full">{EMOJI_MAP[char.type]||'🐾'} {char.name}</span>}
                </div>
                <div className="text-[11px] text-gray-400 mb-2">{items.length} 張 · {confirmed} 已確認 · 目標 {p.target_count}</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {items.slice(0, 8).map(s => (
                    <span key={s.id} className="text-[10px] bg-peach-50 text-peach-700 px-1.5 py-0.5 rounded">{s.text || s.emotion}</span>
                  ))}
                  {items.length > 8 && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">+{items.length - 8}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(p)} className="bg-coral-50 text-coral-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-coral-100">✏️ 編輯</button>
                  <button onClick={() => del(p.id)} className="bg-red-50 text-red-400 px-2 py-1.5 rounded-lg text-xs hover:bg-red-100 ml-auto">🗑️</button>
                </div>
              </div>
            );
          })}
          {!plans.length && (
            <div className="col-span-full text-center py-16">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-400">先建立角色，再來規劃貼圖內容</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
