import { NextRequest, NextResponse } from 'next/server';

// We use the Anthropic API via the built-in artifact capability
// But for the deployed app, we call Claude API directly remove

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();

    // Use Claude API for AI tasks
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: getSystemPrompt(action),
        messages: [{ role: 'user', content: getUserPrompt(action, data) }],
      }),
    });

    const result = await response.json();

    // Debug: log the full response
    console.log('Claude API status:', response.status);
    console.log('Claude API response:', JSON.stringify(result).slice(0, 500));

    if (result.error) {
      return NextResponse.json({ error: result.error.message || 'Claude API error', detail: result.error }, { status: 500 });
    }

    const text = result.content?.[0]?.text || '';
    if (!text) {
      return NextResponse.json({ error: 'Empty response from Claude', debug: result }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: text });
  } catch (error: any) {
    console.error('AI error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getSystemPrompt(action: string): string {
  switch (action) {
    case 'generate_character_prompt':
      return `你是專業LINE貼圖角色設計師。根據角色資訊生成一段詳盡的英文 prompt，用於AI圖片生成工具（如 GPT Image, Midjourney）確保角色在不同圖片間保持一致性。

要求：
1. 精確描述身體比例（頭身比、圓潤度）
2. 精確顏色（盡量用 hex 色號）
3. 五官特徵（眼睛大小、形狀、距離；嘴巴樣式）
4. 風格關鍵字：kawaii, chibi, LINE sticker style, simple clean design
5. 特殊標記和配件
6. 整體構圖指引（centered, white/transparent background）
7. 要加上 "no text in image" 避免生成文字

只回覆英文 prompt 本身，不加任何說明。`;

    case 'generate_plan':
      return `你是LINE貼圖內容規劃專家。根據主題和角色生成貼圖規劃。

回覆純 JSON array（不要 markdown code block）：
[{"emotion":"開心","scenario":"打招呼","text":"嗨~","description":"A cute penguin waving hello with sparkly eyes, happy expression"}]

要求：
- text 用繁體中文，要有趣、接地氣、實用
- description 用英文，描述具體的動作和表情
- 涵蓋日常對話最常用的場景：問候、感謝、道歉、同意、拒絕、各種情緒、節日、工作、生活
- emotion 和 scenario 要多樣化，避免重複
- 每個 description 都要足夠具體，讓圖片生成能產出正確的結果`;

    default:
      return '你是一個有幫助的助手。';
  }
}

function getUserPrompt(action: string, data: any): string {
  switch (action) {
    case 'generate_character_prompt':
      return `角色資訊：
名稱: ${data.name}
動物類型: ${data.type}
角色定位: ${data.role}
畫風: ${data.style}
身體形狀: ${data.body_shape || '圓球形'}
主要顏色: ${data.body_color || '待定'}
點綴顏色: ${data.accent_color || '待定'}
眼睛風格: ${data.eye_style || '小圓點'}
嘴巴風格: ${data.mouth_style || '簡單弧線'}
特殊特徵: ${data.special_feature || '無'}
個性: ${data.personality || '活潑可愛'}
口頭禪: ${data.catchphrase || '無'}`;

    case 'generate_plan':
      return `主題: ${data.theme}
角色: ${data.character ? `${data.character.name}（${data.character.type}，${data.character.style}風格）` : '未指定'}
數量: ${data.target_count}
備註: ${data.notes || '無'}`;

    default:
      return JSON.stringify(data);
  }
}
