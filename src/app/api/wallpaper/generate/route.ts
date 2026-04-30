import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { z } from 'zod';
import type { AestheticStyle } from '@/lib/validations/wizard';

function getReplicate() {
  return new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
}

const SDXL_MODEL =
  'stability-ai/sdxl:39ed52f2319f9c0b9fde63d94caa46de69408e86e27a1b52caa1ad33e99db7fb' as const;

const stylePromptMap: Record<AestheticStyle, string> = {
  minimal: 'minimalist, clean, soft light, neutral tones, serene, white space, simple composition',
  vibrant: 'vibrant colors, energetic, bold, colorful, dynamic, saturated, lively',
  ethereal:
    'ethereal, dreamy, soft bokeh, pastel, magical light, gentle haze, otherworldly, luminous',
  luxe: 'luxurious, golden hour, rich textures, elegant, sophisticated, opulent, warm glow',
};

const GenerateWallpaperSchema = z.object({
  dreams: z.string().min(1).max(1000),
  style: z.enum(['minimal', 'vibrant', 'ethereal', 'luxe']),
  areas: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = GenerateWallpaperSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { dreams, style, areas } = parsed.data;
    const styleModifiers = stylePromptMap[style];
    const areasText = areas.join(', ');

    // Build the image generation prompt
    const prompt = [
      `A beautiful vision board wallpaper representing someone's dream life focused on ${areasText}.`,
      `Themes: ${dreams.slice(0, 200)}.`,
      `Visual style: ${styleModifiers}.`,
      'High quality digital art, 9:16 portrait orientation, aspirational lifestyle photography aesthetic,',
      'warm and inviting atmosphere, no text, no words, no letters.',
    ].join(' ');

    const negativePrompt =
      'text, words, letters, watermark, signature, blurry, distorted, ugly, low quality, nsfw, dark, gloomy';

    const output = await getReplicate().run(SDXL_MODEL, {
      input: {
        prompt,
        negative_prompt: negativePrompt,
        width: 768,
        height: 1344,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        num_outputs: 1,
      },
    });

    // Replicate returns an array of URLs (or ReadableStream objects in newer versions)
    const outputArray = output as string[];
    const imageUrl = outputArray[0];

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error('wallpaper generate error:', err);
    return NextResponse.json({ error: 'Failed to generate wallpaper' }, { status: 500 });
  }
}
