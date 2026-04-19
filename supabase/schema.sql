-- ╔══════════════════════════════════════════════════════════════╗
-- ║  LINE 貼圖工作站 - Supabase Schema                          ║
-- ║  在 Supabase SQL Editor 裡執行這個檔案                        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════
-- 1. Characters (角色表)
-- ═══════════════════════════════════════
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '企鵝',       -- 動物類型
  role TEXT NOT NULL DEFAULT '主角',        -- 主角/配角/路人
  style TEXT NOT NULL DEFAULT '圓潤可愛',   -- 畫風
  body_shape TEXT DEFAULT '',
  body_color TEXT DEFAULT '',               -- 主色 (hex or 描述)
  accent_color TEXT DEFAULT '',             -- 點綴色
  eye_style TEXT DEFAULT '',
  mouth_style TEXT DEFAULT '',
  special_feature TEXT DEFAULT '',           -- 特殊特徵
  personality TEXT DEFAULT '',
  catchphrase TEXT DEFAULT '',               -- 口頭禪
  full_prompt TEXT DEFAULT '',               -- AI 生成的完整英文 prompt
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- 2. Plans (貼圖規劃表)
-- ═══════════════════════════════════════
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme TEXT NOT NULL,                       -- 主題名稱
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  target_count INT NOT NULL DEFAULT 40,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- 3. Plan Items (規劃項目表 - 每張貼圖的規劃)
-- ═══════════════════════════════════════
CREATE TABLE plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  emotion TEXT DEFAULT '',                   -- 表情
  scenario TEXT DEFAULT '',                  -- 場景
  text TEXT DEFAULT '',                      -- 貼圖文字 (繁體中文)
  description TEXT DEFAULT '',               -- 英文描述 (用於圖片生成)
  is_confirmed BOOLEAN DEFAULT FALSE,        -- 是否已確認
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- 4. Stickers (貼圖表)
-- ═══════════════════════════════════════
CREATE TABLE stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  prompt TEXT DEFAULT '',                    -- 用於生成的完整 prompt
  image_path TEXT DEFAULT '',                -- Supabase Storage 路徑
  image_url TEXT DEFAULT '',                 -- 公開 URL (方便前端直接取用)
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generating', 'generated', 'approved', 'rejected', 'published')),
  emotion TEXT DEFAULT '',
  text TEXT DEFAULT '',                      -- 貼圖上的文字
  width INT DEFAULT 370,
  height INT DEFAULT 320,
  file_size INT DEFAULT 0,                   -- 檔案大小 (bytes)
  metadata JSONB DEFAULT '{}',               -- 額外資訊 (negative prompt, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- 5. Packs (貼圖包表)
-- ═══════════════════════════════════════
CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'published')),
  line_product_id TEXT DEFAULT '',            -- LINE 上架後的產品 ID
  price TEXT DEFAULT 'US$0.99',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- 6. Pack Stickers (貼圖包-貼圖 關聯表)
-- ═══════════════════════════════════════
CREATE TABLE pack_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  sticker_id UUID NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(pack_id, sticker_id)
);

-- ═══════════════════════════════════════
-- 7. Indexes (效能優化)
-- ═══════════════════════════════════════
CREATE INDEX idx_plan_items_plan_id ON plan_items(plan_id);
CREATE INDEX idx_plan_items_sort ON plan_items(plan_id, sort_order);
CREATE INDEX idx_stickers_character ON stickers(character_id);
CREATE INDEX idx_stickers_plan ON stickers(plan_id);
CREATE INDEX idx_stickers_status ON stickers(status);
CREATE INDEX idx_pack_stickers_pack ON pack_stickers(pack_id);
CREATE INDEX idx_pack_stickers_sticker ON pack_stickers(sticker_id);
CREATE INDEX idx_plans_character ON plans(character_id);

-- ═══════════════════════════════════════
-- 8. Updated_at trigger (自動更新時間)
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER stickers_updated_at
  BEFORE UPDATE ON stickers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER packs_updated_at
  BEFORE UPDATE ON packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════
-- 9. RLS Policies (安全政策 - 個人使用先全開)
-- ═══════════════════════════════════════
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_stickers ENABLE ROW LEVEL SECURITY;

-- 個人專案，全部允許 (如果之後要多人用可以加 user_id)
CREATE POLICY "Allow all on characters" ON characters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on plans" ON plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on plan_items" ON plan_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stickers" ON stickers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on packs" ON packs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pack_stickers" ON pack_stickers FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════
-- 10. Storage Bucket (圖片儲存)
-- ═══════════════════════════════════════
-- 需在 Supabase Dashboard > Storage 手動建立:
--   Bucket name: sticker-images
--   Public: YES
--
-- 或用以下 SQL (需要 service_role 權限):
INSERT INTO storage.buckets (id, name, public)
VALUES ('sticker-images', 'sticker-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Allow public read on sticker-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'sticker-images');

CREATE POLICY "Allow authenticated upload on sticker-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sticker-images');

CREATE POLICY "Allow authenticated update on sticker-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sticker-images');

CREATE POLICY "Allow authenticated delete on sticker-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'sticker-images');

-- ═══════════════════════════════════════
-- 11. Useful Views (方便查詢)
-- ═══════════════════════════════════════

-- 貼圖包完整資訊 (含貼圖數量和狀態統計)
CREATE OR REPLACE VIEW pack_overview AS
SELECT
  p.*,
  COUNT(ps.sticker_id) AS sticker_count,
  COUNT(CASE WHEN s.status = 'approved' THEN 1 END) AS approved_count,
  COUNT(CASE WHEN s.status = 'published' THEN 1 END) AS published_count
FROM packs p
LEFT JOIN pack_stickers ps ON p.id = ps.pack_id
LEFT JOIN stickers s ON ps.sticker_id = s.id
GROUP BY p.id;

-- 角色使用統計
CREATE OR REPLACE VIEW character_stats AS
SELECT
  c.*,
  COUNT(DISTINCT pl.id) AS plan_count,
  COUNT(DISTINCT st.id) AS sticker_count
FROM characters c
LEFT JOIN plans pl ON c.id = pl.character_id
LEFT JOIN stickers st ON c.id = st.character_id
GROUP BY c.id;
