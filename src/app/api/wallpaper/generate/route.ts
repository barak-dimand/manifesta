import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { buildPrompt, base64ToBlob } from '@/lib/promptBuilder';
import { engineerPrompt, isLLMAvailable } from '@/lib/promptEngineer';
import { getActiveSystemPrompt } from '@/lib/getActiveSystemPrompt';
import { logger, serializeError } from '@/lib/logger';
import { getDb } from '@/lib/db';
import { generatedWallpapers } from '@/lib/db/schema';
import { eq, gte, and, count } from 'drizzle-orm';
import type { AestheticStyle } from '@/lib/validations/wizard';

const ROUTE = '/api/wallpaper/generate';
const DAILY_LIMIT = 15;

function getReplicate() {
  return new Replicate({ auth: process.env.REPLICATE_API_TOKEN!, useFileOutput: false });
}

const FLUX_DEV = 'black-forest-labs/flux-dev';
const FLUX_PRO_ULTRA = 'black-forest-labs/flux-1.1-pro-ultra';

const GenerateWallpaperSchema = z.object({
  dreams: z.string().min(1).max(2000),
  style: z.enum(['minimal', 'vibrant', 'ethereal', 'luxe']),
  areas: z.array(z.string()).min(1),
  manifesto: z.string().optional(),
  boardId: z.string().uuid().optional(),
  referenceImageBase64: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Auth required — the UI gates generation behind sign-in, but enforce server-side too
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to generate wallpapers.' }, { status: 401 });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    await logger.warn('REPLICATE_API_TOKEN not configured', { route: ROUTE, userId });
    return NextResponse.json(
      { error: 'billing_required', detail: 'REPLICATE_API_TOKEN is not configured.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = GenerateWallpaperSchema.safeParse(body);
  if (!parsed.success) {
    await logger.warn('Wallpaper generate: invalid request', {
      route: ROUTE,
      userId,
      details: { errors: parsed.error.flatten() },
    });
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dreams, style, areas, manifesto, boardId, referenceImageBase64 } = parsed.data;

  // Rate limit: max DAILY_LIMIT images per user per 24 hours
  const since = new Date(Date.now() - 86_400_000);
  const [{ value: usedToday }] = await getDb()
    .select({ value: count() })
    .from(generatedWallpapers)
    .where(and(
      eq(generatedWallpapers.userId, userId),
      gte(generatedWallpapers.createdAt, since),
    ));

  if (usedToday >= DAILY_LIMIT) {
    await logger.info('Wallpaper daily limit reached', { route: ROUTE, userId, details: { usedToday } });
    return NextResponse.json(
      { error: 'daily_limit_reached', usedToday, remaining: 0, limit: DAILY_LIMIT },
      { status: 429 },
    );
  }

  const hasRef = !!referenceImageBase64;
  const { mode, hydrated: templatePrompt } = buildPrompt(areas, style as AestheticStyle, dreams, hasRef);

  // Use LLM to engineer a richer prompt when available
  let prompt = templatePrompt;
  let llmProvider: string | undefined;
  if (isLLMAvailable()) {
    try {
      const { text: activeSystemPrompt } = await getActiveSystemPrompt();
      const engineered = await engineerPrompt(
        { areas, style: style as AestheticStyle, dreams, manifesto: manifesto ?? undefined, mode },
        activeSystemPrompt,
      );
      prompt = engineered.prompt;
      llmProvider = engineered.provider;
    } catch (err) {
      await logger.warn('LLM prompt engineering failed, falling back to template', {
        route: ROUTE,
        userId,
        details: serializeError(err),
      });
    }
  }

  await logger.info('Wallpaper generation started', {
    route: ROUTE,
    userId,
    details: { mode, style, areas, hasRef, usedToday, remaining: DAILY_LIMIT - usedToday, llmProvider: llmProvider ?? 'template' },
  });

  try {
    let output: unknown;

    const replicate = getReplicate();

    if (mode === 'image-to-image' && referenceImageBase64) {
      const imageBlob = base64ToBlob(referenceImageBase64);
      // Use predictions.create with `model` (not `version`) — correct API for serverless Flux models
      const prediction = await replicate.predictions.create({
        model: FLUX_PRO_ULTRA,
        input: {
          prompt,
          image_prompt: imageBlob,
          image_prompt_strength: 0.35,
          aspect_ratio: '9:16',
          output_format: 'jpg',
          output_quality: 90,
          safety_tolerance: 2,
        },
      });
      const completed = await replicate.wait(prediction);
      output = completed.output;
    } else {
      const prediction = await replicate.predictions.create({
        model: FLUX_DEV,
        input: {
          prompt,
          aspect_ratio: '9:16',
          num_outputs: 1,
          output_format: 'jpg',
          num_inference_steps: 28,
          guidance: 3.5,
          go_fast: true,
        },
      });
      const completed = await replicate.wait(prediction);
      output = completed.output;
    }

    const outputArray = Array.isArray(output) ? (output as string[]) : [String(output)];
    const imageUrl = outputArray[0] ? String(outputArray[0]) : null;

    if (!imageUrl) {
      await logger.error('Wallpaper generate: no output URL returned', {
        route: ROUTE,
        userId,
        details: { mode, style, areas },
      });
      return NextResponse.json({ error: 'no_output', detail: 'Replicate returned no image.' }, { status: 500 });
    }

    // Save the generated wallpaper with full context
    const [saved] = await getDb()
      .insert(generatedWallpapers)
      .values({
        userId,
        boardId: boardId ?? null,
        imageUrl,
        manifesto: manifesto ?? null,
        dreams,
        style,
        areas,
        mode,
      })
      .returning();

    const newUsedToday = usedToday + 1;
    const remaining = DAILY_LIMIT - newUsedToday;

    await logger.info('Wallpaper generation succeeded', {
      route: ROUTE,
      userId,
      details: { savedId: saved.id, mode, style, remaining },
    });

    return NextResponse.json({ imageUrl, mode, savedId: saved.id, usedToday: newUsedToday, remaining });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('402') || message.includes('Insufficient credit') || message.includes('Payment Required')) {
      await logger.warn('Wallpaper generate: Replicate billing required', {
        route: ROUTE,
        userId,
        details: { message },
      });
      return NextResponse.json(
        { error: 'billing_required', detail: 'Replicate account has insufficient credits.' },
        { status: 402 },
      );
    }

    await logger.error('Wallpaper generation failed', {
      route: ROUTE,
      userId,
      details: { ...serializeError(err), mode, style, areas },
    });
    return NextResponse.json({ error: 'generation_failed', detail: message }, { status: 500 });
  }
}
