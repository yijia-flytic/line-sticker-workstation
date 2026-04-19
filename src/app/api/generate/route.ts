import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/supabase';

export const maxDuration = 60; // Allow up to 60s for image generation

export async function POST(req: NextRequest) {
  try {
    const { prompt, stickerId, characterName, emotion, text } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    // Generate image with transparent background
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'medium',
      background: 'transparent',
      output_format: 'png',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const safeName = (characterName || 'sticker').replace(/[^a-zA-Z0-9]/g, '_');
    const imagePath = `stickers/${safeName}/${timestamp}_${stickerId?.slice(0, 8) || 'img'}.png`;

    const imageUrl = await db.storage.uploadImage(imagePath, b64);

    // Update sticker record if stickerId provided
    if (stickerId) {
      await db.stickers.update(stickerId, {
        image_path: imagePath,
        image_url: imageUrl,
        status: 'generated',
      });
    }

    return NextResponse.json({
      success: true,
      image_url: imageUrl,
      image_path: imagePath,
      b64_preview: b64.slice(0, 100) + '...', // Small preview for confirmation
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
