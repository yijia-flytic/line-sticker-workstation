'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db, Sticker, Pack } from '@/lib/supabase';

const STATUS_CFG: Record<string, { label: string; color: string; icon: string }> = {
  generating: { label: '生成中', color: 'bg-gray-400', icon: '⏳' },
  generated: { label: '已生成', color: 'bg-blue-500', icon: '🖼️' },
  approved: { label: '已確認', color: 'bg-green-500', icon: '✅' },
  rejected: { label: '不採用', color: 'bg-red-500', icon: '❌' },
  published: { label: '已上架', color: 'bg-purple-500', icon: '🎉' },
};

const PACK_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-400' },
  submitted: { label: '已送審', color: 'bg-blue-500' },
  approved: { label: '審核通過', color: 'bg-green-500' },
  published: { label: '已上架', color: 'bg-purple-500' },
};

const VALID_COUNTS = [8, 16, 24, 32, 40];

export default function ReviewPage() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [packStickers, setPackStickers] = useState<Record<string, Sticker[]>>({});
  const [filter, setFilter] = useState('all');
  const [newPackName, setNewPackName] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([db.stickers.list(), db.packs.list()]);
      setStickers(s);
      setPacks(p);
      // Load pack stickers
      const psMap: Record<string, Sticker[]> = {};
      for (const pack of p) {
        const ps = await db.packs.getStickers(pack.id);
        psMap[pack.id] = (ps || []).map((x: any) => x.sticker).filter(Boolean);
      }
      setPackStickers(psMap);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: Sticker['status']) => {
    try {
      await db.stickers.updateStatus(id, status);
      setStickers(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toast.success(`狀態已更新`);
    } catch (e: any) { toast.error(e.message); }
  };

  const createPack = async () => {
    if (!newPackName.trim()) return;
    try {
      await db.packs.create({ name: newPackName });
      setNewPackName('');
      load();
      toast.success('貼圖包已建立！');
    } catch (e: any) { toast.error(e.message); }
  };

  const addToPack = async (packId: string, stickerId: string) => {
    try {
      const existing = packStickers[packId] || [];
      await db.packs.addSticker(packId, stickerId, existing.length);
      load();
      toast.success('已加入貼圖包');
    } catch (e: any) {
      if (e.message?.includes('duplicate')) toast.info('已在貼圖包中');
      else toast.error(e.message);
    }
  };

  const removeFromPack = async (packId: string, stickerId: string) => {
    try {
      await db.packs.removeSticker(packId, stickerId);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const updatePackStatus = async (packId: string, status: Pack['status']) => {
    try {
      await db.packs.update(packId, { status });
      setPacks(prev => prev.map(p => p.id === packId ? { ...p, status } : p));
    } catch (e: any) { toast.error(e.message); }
  };

  const downloadPack = async (packId: string) => {
    setDownloading(packId);
    try {
      const res = await fetch('/api/packs/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      if (!res.ok) throw new Error('下載失敗');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sticker-pack-${packId.slice(0, 8)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ZIP 已下載！');
    } catch (e: any) { toast.error(e.message); }
    setDownloading('');
  };

  const deletePack = async (packId: string) => {
    if (!confirm('確定刪除此貼圖包？')) return;
    try { await db.packs.delete(packId); load(); toast.success('已刪除'); }
    catch (e: any) { toast.error(e.message); }
  };

  const deleteSticker = async (id: string) => {
    if (!confirm('確定刪除？')) return;
    try { await db.stickers.delete(id); setStickers(prev => prev.filter(s => s.id !== id)); }
    catch (e: any) { toast.error(e.message); }
  };

  const filtered = stickers.filter(s => filter === 'all' || s.status === filter);
  // Group by plan theme (use plan_id as key, show stickers together)
  const grouped: Record<string, Sticker[]> = {};
  filtered.forEach(s => {
    const key = s.plan_id || 'no-plan';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold">✅ 檢查與上架管理</h2>
        <p className="text-xs text-gray-400 mt-1">管理貼圖狀態、建立貼圖包、打包下載 ZIP 上架 LINE</p>
      </div>

      {/* Pack Management */}
      <div className="bg-white rounded-2xl p-5 mb-5 border border-coral-100 shadow-sm">
        <h3 className="text-base font-extrabold mb-3">📦 貼圖包管理</h3>
        <div className="flex gap-2 mb-4">
          <input value={newPackName} onChange={e => setNewPackName(e.target.value)}
            placeholder="新貼圖包名稱..." onKeyDown={e => e.key === 'Enter' && createPack()}
            className="flex-1 border-2 border-coral-100 rounded-lg px-3 py-2 text-sm bg-coral-50/20 focus:border-coral-400 outline-none" />
          <button onClick={createPack} disabled={!newPackName.trim()}
            className="bg-gradient-to-r from-coral-500 to-peach-500 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-40">建立</button>
        </div>

        {packs.map(pack => {
          const ps = packStickers[pack.id] || [];
          const countOk = VALID_COUNTS.includes(ps.length);
          return (
            <div key={pack.id} className="bg-coral-50/30 rounded-xl p-4 mb-3 border border-coral-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{pack.name}</span>
                  <span className={`text-[9px] text-white px-2 py-0.5 rounded-full font-bold ${PACK_STATUS[pack.status]?.color}`}>
                    {PACK_STATUS[pack.status]?.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-400">{ps.length} 張</span>
              </div>

              {ps.length > 0 && (
                <div className={`text-[11px] rounded-lg px-2 py-1 mb-2 font-semibold
                  ${countOk ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {countOk ? '✅ 數量符合 LINE 規範' : `⚠️ 需 ${VALID_COUNTS.join('/')} 張，目前 ${ps.length} 張`}
                </div>
              )}

              {/* Sticker thumbnails */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {ps.slice(0, 12).map(s => (
                  <div key={s.id} className="relative group">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.text} className="w-10 h-10 object-contain rounded-lg border border-coral-100 checkerboard" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs">📝</div>
                    )}
                    <button onClick={() => removeFromPack(pack.id, s.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white text-[8px] hidden group-hover:flex items-center justify-center">×</button>
                  </div>
                ))}
                {ps.length > 12 && <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] text-gray-400">+{ps.length-12}</div>}
              </div>

              {/* Pack actions */}
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(PACK_STATUS).map(([k, v]) => (
                  <button key={k} onClick={() => updatePackStatus(pack.id, k as Pack['status'])}
                    className={`text-[10px] px-2 py-1 rounded font-bold transition-all
                      ${pack.status === k ? `${v.color} text-white` : 'bg-white text-gray-500 border border-gray-200'}`}>
                    {v.label}
                  </button>
                ))}
                <button onClick={() => downloadPack(pack.id)} disabled={downloading === pack.id}
                  className="text-[10px] px-2 py-1 rounded font-bold bg-blue-50 text-blue-600 hover:bg-blue-100">
                  {downloading === pack.id ? '⏳' : '📥'} ZIP
                </button>
                <button onClick={() => deletePack(pack.id)}
                  className="text-[10px] px-2 py-1 rounded font-bold text-red-400 hover:bg-red-50 ml-auto">刪除</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticker List */}
      <div className="bg-white rounded-2xl p-5 border border-coral-100 shadow-sm">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h3 className="text-base font-extrabold">所有貼圖 ({stickers.length})</h3>
          <div className="flex gap-1 flex-wrap">
            {[['all', '全部'], ...Object.entries(STATUS_CFG).map(([k, v]) => [k, v.label])].map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all
                  ${filter === k ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {label} ({k === 'all' ? stickers.length : stickers.filter(s => s.status === k).length})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-300">載入中...</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filtered.map(s => (
              <div key={s.id} className="rounded-xl overflow-hidden border border-coral-100 card-hover bg-white">
                <div className="aspect-square checkerboard relative">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.text || s.emotion} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-coral-50">{STATUS_CFG[s.status]?.icon || '📝'}</div>
                  )}
                  <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${STATUS_CFG[s.status]?.color}`} />
                </div>
                <div className="p-2">
                  <div className="text-[10px] font-bold truncate">{s.text || s.emotion || '—'}</div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {Object.entries(STATUS_CFG).filter(([k]) => k !== 'generating').map(([k, v]) => (
                      <button key={k} onClick={() => updateStatus(s.id, k as Sticker['status'])}
                        className={`text-[8px] px-1.5 py-0.5 rounded font-bold
                          ${s.status === k ? `${v.color} text-white` : 'bg-gray-50 text-gray-400'}`}>
                        {v.icon}
                      </button>
                    ))}
                  </div>
                  {packs.length > 0 && (
                    <select onChange={e => { if (e.target.value) { addToPack(e.target.value, s.id); e.target.value = ''; } }}
                      className="w-full mt-1.5 text-[9px] border border-gray-200 rounded px-1 py-0.5 bg-white">
                      <option value="">+ 加入貼圖包</option>
                      {packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  <button onClick={() => deleteSticker(s.id)}
                    className="w-full mt-1 text-[9px] text-red-300 hover:text-red-500 py-0.5">🗑️ 刪除</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!stickers.length && !loading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🎨</div>
            <p className="text-gray-400">先到「生成貼圖」產生圖片</p>
          </div>
        )}
      </div>
    </div>
  );
}
