'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db, Character } from '@/lib/supabase';

const ANIMAL_TYPES = ['企鵝','小雞','小鴨','柴犬','貓咪','兔子','熊','倉鼠','水獺','海豹','恐龍','狐狸'];
const STYLE_PRESETS = ['圓潤可愛','伸縮變形','極簡線條','軟萌Q版','塗鴉手繪','黏土風格'];
const EMOJI_MAP: Record<string, string> = {'企鵝':'🐧','小雞':'🐥','小鴨':'🦆','柴犬':'🐕','貓咪':'🐱','兔子':'🐰','熊':'🐻','倉鼠':'🐹','水獺':'🦦','海豹':'🦭','恐龍':'🦕','狐狸':'🦊'};

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editing, setEditing] = useState<Partial<Character> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setCharacters(await db.characters.list()); }
    catch (e: any) { toast.error('載入失敗: ' + e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing({ name:'', type:'企鵝', role:'主角', style:'圓潤可愛', body_shape:'', body_color:'', accent_color:'', eye_style:'', mouth_style:'', special_feature:'', personality:'', catchphrase:'', full_prompt:'', notes:'' });
    setIsNew(true);
  };

  const startEdit = (c: Character) => { setEditing({...c}); setIsNew(false); };

  const generatePrompt = async () => {
    if (!editing?.name) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_character_prompt', data: editing }),
      });
      const data = await res.json();
      if (data.result) {
        setEditing(prev => ({ ...prev!, full_prompt: data.result }));
        toast.success('Prompt 已生成！');
      }
    } catch (e: any) { toast.error('生成失敗: ' + e.message); }
    setAiLoading(false);
  };

  const save = async () => {
    if (!editing?.name?.trim()) return;
    try {
      if (isNew) {
        await db.characters.create(editing);
        toast.success('角色已建立！');
      } else {
        await db.characters.update(editing.id!, editing);
        toast.success('角色已更新！');
      }
      setEditing(null);
      load();
    } catch (e: any) { toast.error('儲存失敗: ' + e.message); }
  };

  const del = async (id: string) => {
    if (!confirm('確定刪除此角色？相關的貼圖不會被刪除。')) return;
    try { await db.characters.delete(id); toast.success('已刪除'); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold">🐧 角色設計工坊</h2>
          <p className="text-xs text-gray-400 mt-1">設計角色設定，AI 生成可重複使用的 Prompt 確保一致性</p>
        </div>
        <button onClick={startNew} className="bg-gradient-to-r from-coral-500 to-peach-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-coral-200 hover:shadow-xl transition-all">
          + 新角色
        </button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-white rounded-2xl p-5 mb-5 border border-coral-100 shadow-sm animate-fadeIn">
          <h3 className="text-base font-extrabold mb-4">{isNew ? '✨ 建立新角色' : '✏️ 編輯角色'}</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Field label="角色名稱 *" value={editing.name||''} onChange={v => setEditing({...editing, name:v})} placeholder="小圓企" />
            <Select label="動物類型" value={editing.type||'企鵝'} options={ANIMAL_TYPES} onChange={v => setEditing({...editing, type:v})} />
            <Select label="角色定位" value={editing.role||'主角'} options={['主角','配角','路人']} onChange={v => setEditing({...editing, role:v})} />
            <Select label="畫風" value={editing.style||'圓潤可愛'} options={STYLE_PRESETS} onChange={v => setEditing({...editing, style:v})} />
          </div>

          <div className="h-px bg-coral-100 my-4" />
          <h4 className="text-xs font-bold text-coral-500 mb-2 uppercase tracking-wide">外觀設定</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Field label="身體形狀" value={editing.body_shape||''} onChange={v => setEditing({...editing, body_shape:v})} placeholder="圓球形" />
            <Field label="主色" value={editing.body_color||''} onChange={v => setEditing({...editing, body_color:v})} placeholder="#FFE4C4" />
            <Field label="點綴色" value={editing.accent_color||''} onChange={v => setEditing({...editing, accent_color:v})} placeholder="#FF6B6B" />
            <Field label="眼睛" value={editing.eye_style||''} onChange={v => setEditing({...editing, eye_style:v})} placeholder="小黑圓點" />
            <Field label="嘴巴" value={editing.mouth_style||''} onChange={v => setEditing({...editing, mouth_style:v})} placeholder="ω形" />
            <Field label="特殊特徵" value={editing.special_feature||''} onChange={v => setEditing({...editing, special_feature:v})} placeholder="頭上呆毛" />
          </div>

          <div className="h-px bg-coral-100 my-4" />
          <h4 className="text-xs font-bold text-coral-500 mb-2 uppercase tracking-wide">個性</h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="個性描述" value={editing.personality||''} onChange={v => setEditing({...editing, personality:v})} placeholder="愛吃、懶懶的" />
            <Field label="口頭禪" value={editing.catchphrase||''} onChange={v => setEditing({...editing, catchphrase:v})} placeholder="哇嗚~" />
          </div>

          <div className="h-px bg-coral-100 my-4" />
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-coral-500 uppercase tracking-wide">生成用 Prompt</h4>
            <button onClick={generatePrompt} disabled={aiLoading || !editing.name}
              className="border-2 border-coral-500 text-coral-500 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-coral-50 disabled:opacity-40 transition-all">
              {aiLoading ? '⏳ 生成中...' : '🤖 AI 生成 Prompt'}
            </button>
          </div>
          <textarea value={editing.full_prompt||''} onChange={e => setEditing({...editing, full_prompt: e.target.value})}
            className="w-full border-2 border-coral-100 rounded-xl p-3 text-xs font-mono bg-coral-50/30 resize-y focus:border-coral-400 outline-none"
            rows={5} placeholder="用於圖片生成的完整英文角色描述..." />

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setEditing(null)} className="border border-gray-200 text-gray-400 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">取消</button>
            <button onClick={save} disabled={!editing.name?.trim()}
              className="bg-gradient-to-r from-coral-500 to-peach-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-coral-200 disabled:opacity-40">
              💾 儲存角色
            </button>
          </div>
        </div>
      )}

      {/* Character Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-300">載入中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-4 border border-coral-100 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{EMOJI_MAP[c.type] || '🐾'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-base truncate">{c.name}</div>
                  <div className="text-[11px] text-gray-400">{c.type} · {c.style}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${c.role === '主角' ? 'bg-yellow-300 text-yellow-800' : c.role === '配角' ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                  {c.role}
                </span>
              </div>

              {c.personality && <div className="text-xs text-gray-500 mb-1">💫 {c.personality}</div>}
              {c.special_feature && <div className="text-xs text-gray-500 mb-1">✦ {c.special_feature}</div>}
              {(c.plan_count || c.sticker_count) ? (
                <div className="text-[10px] text-gray-400 mb-2">{c.plan_count || 0} 個規劃 · {c.sticker_count || 0} 張貼圖</div>
              ) : null}
              {c.full_prompt && (
                <div className="text-[10px] text-gray-400 bg-coral-50/50 rounded-lg p-2 font-mono leading-tight mt-2">
                  {c.full_prompt.slice(0, 100)}...
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={() => startEdit(c)} className="bg-coral-50 text-coral-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-coral-100 transition-all">✏️ 編輯</button>
                <button onClick={() => { navigator.clipboard.writeText(c.full_prompt || ''); toast.success('已複製 Prompt！'); }}
                  className="bg-coral-50 text-coral-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-coral-100 transition-all">📋 Prompt</button>
                <button onClick={() => del(c.id)} className="bg-red-50 text-red-400 px-2 py-1.5 rounded-lg text-xs hover:bg-red-100 ml-auto">🗑️</button>
              </div>
            </div>
          ))}

          {!characters.length && (
            <div className="col-span-full text-center py-16">
              <div className="text-5xl mb-3">🐧</div>
              <p className="text-gray-400">點擊「+ 新角色」開始設計你的貼圖主角</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-peach-500 uppercase tracking-wide">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border-2 border-coral-100 rounded-lg px-3 py-2 text-sm bg-coral-50/20 focus:border-coral-400 outline-none mt-1" />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-peach-500 uppercase tracking-wide">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border-2 border-coral-100 rounded-lg px-3 py-2 text-sm bg-coral-50/20 focus:border-coral-400 outline-none mt-1">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
