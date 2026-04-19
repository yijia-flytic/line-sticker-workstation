# LINE 貼圖工作站 🎨

一站式 LINE 貼圖設計、生成、管理工具。

## 功能

- **L1 角色設計** — 設計角色設定，AI 生成可重複使用的 Prompt
- **L2 貼圖規劃** — AI 批次生成 40 張貼圖的情境/文字規劃
- **L3 圖片生成** — 串接 OpenAI GPT Image API 一鍵生成所有貼圖
- **L4 檢查上架** — 管理狀態、建立貼圖包、打包下載 ZIP 上架

## 技術棧

- **前端**: Next.js 14 + React + Tailwind CSS
- **後端**: Next.js API Routes
- **資料庫**: Supabase (PostgreSQL)
- **圖片儲存**: Supabase Storage
- **圖片生成**: OpenAI GPT Image API
- **部署**: Vercel

## 快速開始

### 1. 建立 Supabase 專案

1. 到 [supabase.com](https://supabase.com) 建立免費帳號和專案
2. 進入專案後，到 **SQL Editor** 頁面
3. 複製 `supabase/schema.sql` 的內容，貼上執行
4. 到 **Storage** 頁面，建立一個 bucket 叫 `sticker-images`，設定為 **Public**
5. 到 **Settings > API** 頁面，複製 Project URL 和 anon key

### 2. 取得 OpenAI API Key

1. 到 [platform.openai.com/api-keys](https://platform.openai.com/api-keys) 申請
2. 確保帳號已驗證（需要驗證才能使用 GPT Image 模型）
3. 建議設定用量上限（如每月 $10）

### 3. 安裝與啟動

```bash
# Clone 或下載專案
cd sticker-workstation

# 安裝依賴
npm install

# 複製環境變數
cp .env.local.example .env.local

# 編輯 .env.local，填入你的 keys
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
# OPENAI_API_KEY=sk-xxxx

# 啟動開發伺服器
npm run dev
```

打開 http://localhost:3000 就可以使用了！

### 4. 部署到 Vercel

```bash
# 在 Vercel 上 import 這個 repo
# 設定環境變數（同 .env.local）
# 自動部署完成
```

## 資料庫結構

```
characters (角色表)
├── id, name, type, role, style
├── body_shape, body_color, accent_color
├── eye_style, mouth_style, special_feature
├── personality, catchphrase
├── full_prompt (AI 生成的完整 prompt)
└── created_at, updated_at

plans (規劃表)
├── id, theme, character_id (FK → characters)
├── target_count, notes
└── created_at, updated_at

plan_items (規劃項目表)
├── id, plan_id (FK → plans)
├── sort_order
├── emotion, scenario, text, description
├── is_confirmed
└── created_at

stickers (貼圖表)
├── id, character_id, plan_id, plan_item_id
├── prompt, image_path (Storage 路徑)
├── status (generated/approved/rejected/published)
├── emotion, text
└── created_at, updated_at

packs (貼圖包表)
├── id, name
├── status (draft/submitted/approved/published)
└── created_at, updated_at

pack_stickers (貼圖包-貼圖關聯表)
├── pack_id (FK → packs)
├── sticker_id (FK → stickers)
└── sort_order
```

## LINE 貼圖規格

| 項目 | 規格 |
|------|------|
| 貼圖尺寸 | 最大 370×320px (寬高偶數) |
| 主圖 | 240×240px |
| Tab圖 | 96×74px |
| 格式 | PNG，透明背景 |
| 色彩 | RGB，72dpi+ |
| 數量 | 8/16/24/32/40 張 |

## 費用估算

| 項目 | 費用 |
|------|------|
| Supabase | 免費 (500MB DB + 1GB Storage) |
| OpenAI GPT Image | ~$0.04/張 (40張 ≈ $1.6) |
| Vercel | 免費 (個人專案) |
| **每組貼圖總成本** | **~$1.6 USD (~NT$50)** |
