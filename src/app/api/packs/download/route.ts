import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { db } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { packId } = await req.json();

    // Get pack info
    const packStickers = await db.packs.getStickers(packId);
    if (!packStickers?.length) {
      return NextResponse.json({ error: 'No stickers in pack' }, { status: 400 });
    }

    const zip = new JSZip();
    const pngFolder = zip.folder('png')!;

    // Download each sticker image and add to ZIP
    for (let i = 0; i < packStickers.length; i++) {
      const ps = packStickers[i] as any;
      const sticker = ps.sticker;
      if (!sticker?.image_url) continue;

      try {
        const imgRes = await fetch(sticker.image_url);
        const imgBuffer = await imgRes.arrayBuffer();
        const fileName = `${String(i + 1).padStart(2, '0')}.png`;
        pngFolder.file(fileName, imgBuffer);
      } catch (e) {
        console.error(`Failed to fetch sticker ${i}:`, e);
      }
    }

    // Add metadata
    zip.file('metadata.json', JSON.stringify({
      pack_id: packId,
      sticker_count: packStickers.length,
      exported_at: new Date().toISOString(),
      stickers: packStickers.map((ps: any, i: number) => ({
        index: i + 1,
        file: `png/${String(i + 1).padStart(2, '0')}.png`,
        emotion: ps.sticker?.emotion,
        text: ps.sticker?.text,
        status: ps.sticker?.status,
      })),
      line_specs: {
        max_size: '370x320px',
        format: 'PNG',
        background: 'transparent',
        dpi: 72,
        color_mode: 'RGB',
      },
    }, null, 2));

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="sticker-pack-${packId.slice(0, 8)}.zip"`,
      },
    });
  } catch (error: any) {
    console.error('ZIP error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
