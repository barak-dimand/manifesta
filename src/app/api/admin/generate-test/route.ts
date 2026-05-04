import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { generationTests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  buildPrompt,
  base64ToBlob,
  TEXT_TO_IMAGE_TEMPLATE,
  IMAGE_TO_IMAGE_TEMPLATE,
  STYLE_DATA,
  AREA_SCENES,
} from '@/lib/promptBuilder';
import { IMAGE_MODELS, DEFAULT_T2I_MODEL, DEFAULT_I2I_MODEL } from '@/lib/imageModels';
import { engineerPrompt, isLLMAvailable } from '@/lib/promptEngineer';
import { getActiveSystemPrompt } from '@/lib/getActiveSystemPrompt';
import { logger, serializeError } from '@/lib/logger';
import type { AestheticStyle } from '@/lib/validations/wizard';

const ROUTE = '/api/admin/generate-test';

function getReplicate() {
  return new Replicate({ auth: process.env.REPLICATE_API_TOKEN!, useFileOutput: false });
}
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}
function getGoogleAI() {
  return new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
}

const GenerateTestSchema = z.object({
  areas: z.array(z.string()).min(1),
  style: z.enum(['minimal', 'vibrant', 'ethereal', 'luxe']),
  dreams: z.string().default(''),
  customPrompt: z.string().optional(),
  referenceImageBase64: z.string().optional(),
  notes: z.string().optional(),
  model: z.string().optional(),
  useLLM: z.boolean().default(false),
  // Replicate-specific tuning params
  steps: z.number().int().min(1).max(50).default(28),
  guidance: z.number().min(0).max(20).default(3.5),
  imagePromptStrength: z.number().min(0).max(1).default(0.35),
});

const UpdateTestSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

// ── Provider runners ──────────────────────────────────────────────────────────

async function runReplicate(
  modelId: string,
  prompt: string,
  mode: 'text-to-image' | 'image-to-image',
  params: { steps: number; guidance: number; imagePromptStrength: number },
  referenceImageBase64?: string,
): Promise<string> {
  const replicate = getReplicate();

  // image-to-image: only flux-1.1-pro-ultra supports image_prompt natively
  if (mode === 'image-to-image' && referenceImageBase64) {
    const imageBlob = base64ToBlob(referenceImageBase64);
    let output: unknown;

    if (modelId === 'black-forest-labs/flux-dev') {
      // flux-dev img2img via "image" + "prompt_strength"
      output = await replicate.run(modelId as `${string}/${string}`, {
        input: {
          prompt,
          image: imageBlob,
          prompt_strength: params.imagePromptStrength,
          aspect_ratio: '9:16',
          num_outputs: 1,
          output_format: 'webp',
          num_inference_steps: params.steps,
          guidance: params.guidance,
          go_fast: true,
        },
      });
    } else {
      // Default: flux-1.1-pro-ultra with image_prompt
      output = await replicate.run('black-forest-labs/flux-1.1-pro-ultra', {
        input: {
          prompt,
          image_prompt: imageBlob,
          image_prompt_strength: params.imagePromptStrength,
          aspect_ratio: '9:16',
          output_format: 'webp',
          output_quality: 90,
          safety_tolerance: 2,
        },
      });
    }

    const arr = Array.isArray(output) ? (output as string[]) : [String(output)];
    return arr[0] ?? '';
  }

  // text-to-image
  let output: unknown;

  switch (modelId) {
    case 'black-forest-labs/flux-schnell':
      output = await replicate.run('black-forest-labs/flux-schnell', {
        input: { prompt, aspect_ratio: '9:16', num_outputs: 1, output_format: 'webp', go_fast: true },
      });
      break;

    case 'black-forest-labs/flux-1.1-pro':
      output = await replicate.run('black-forest-labs/flux-1.1-pro', {
        input: { prompt, aspect_ratio: '9:16', output_format: 'webp', output_quality: 90 },
      });
      break;

    case 'black-forest-labs/flux-1.1-pro-ultra':
      output = await replicate.run('black-forest-labs/flux-1.1-pro-ultra', {
        input: { prompt, aspect_ratio: '9:16', output_format: 'webp', output_quality: 90, safety_tolerance: 2 },
      });
      break;

    case 'ideogram-ai/ideogram-v2':
      output = await replicate.run('ideogram-ai/ideogram-v2', {
        input: { prompt, aspect_ratio: 'ASPECT_9_16', magic_prompt_option: 'Off', style_type: 'REALISTIC' },
      });
      break;

    case 'recraft-ai/recraft-v3':
      output = await replicate.run('recraft-ai/recraft-v3', {
        input: { prompt, size: '1024x1820', style: 'realistic_image' },
      });
      break;

    case 'black-forest-labs/flux-dev':
    default:
      output = await replicate.run('black-forest-labs/flux-dev', {
        input: {
          prompt,
          aspect_ratio: '9:16',
          num_outputs: 1,
          output_format: 'webp',
          num_inference_steps: params.steps,
          guidance: params.guidance,
          go_fast: true,
        },
      });
      break;
  }

  // Normalize output — may be array, string, or object with url
  if (Array.isArray(output)) return String(output[0] ?? '');
  if (typeof output === 'object' && output !== null && 'url' in output) {
    const u = (output as { url: unknown }).url;
    return typeof u === 'function' ? await (u as () => Promise<string>)() : String(u);
  }
  return String(output ?? '');
}

async function runOpenAI(
  modelId: string,
  prompt: string,
  mode: 'text-to-image' | 'image-to-image',
  referenceImageBase64?: string,
): Promise<string> {
  const openai = getOpenAI();

  if (modelId === 'gpt-image-1' && mode === 'image-to-image' && referenceImageBase64) {
    // Extract mime + base64 data
    const [header, base64Data] = referenceImageBase64.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = (mimeMatch?.[1] ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const binaryData = Buffer.from(base64Data, 'base64');
    const imageFile = new File([binaryData], 'reference.jpg', { type: mimeType });

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt,
      size: '1024x1536',
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('gpt-image-1 edit returned no image');
    return `data:image/png;base64,${b64}`;
  }

  if (modelId === 'dall-e-3') {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1792',
      quality: 'hd',
      n: 1,
    });
    const url = response.data?.[0]?.url;
    if (!url) throw new Error('DALL-E 3 returned no image URL');
    return url;
  }

  // gpt-image-1 text-to-image
  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1536',
    quality: 'high',
  });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error('gpt-image-1 returned no image');
  return `data:image/png;base64,${b64}`;
}

async function runGoogle(modelId: string, prompt: string): Promise<string> {
  const ai = getGoogleAI();
  const response = await ai.models.generateImages({
    model: modelId,
    prompt,
    config: { numberOfImages: 1, aspectRatio: '9:16' },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) throw new Error('Google Imagen returned no image bytes');

  return `data:image/png;base64,${imageBytes}`;
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = GenerateTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    areas, style, dreams, customPrompt, referenceImageBase64,
    notes, steps, guidance, imagePromptStrength, model: requestedModel,
    useLLM,
  } = parsed.data;

  const hasRef = !!referenceImageBase64;
  const built = buildPrompt(areas, style as AestheticStyle, dreams, hasRef, customPrompt);

  // Optionally run LLM prompt engineering
  let llmPrompt: string | undefined;
  let llmProvider: string | undefined;
  let llmModel: string | undefined;
  if (useLLM && !customPrompt) {
    if (!isLLMAvailable()) {
      return NextResponse.json({ error: 'No LLM provider configured (set OPENAI_API_KEY or ANTHROPIC_API_KEY).' }, { status: 400 });
    }
    try {
      const { text: activeSystemPrompt } = await getActiveSystemPrompt();
      const engineered = await engineerPrompt(
        { areas, style: style as AestheticStyle, dreams, mode: built.mode },
        activeSystemPrompt,
      );
      llmPrompt = engineered.prompt;
      llmProvider = engineered.provider;
      llmModel = engineered.model;
    } catch (err) {
      return NextResponse.json({ error: `LLM engineering failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
    }
  }

  const finalPrompt = llmPrompt ?? built.hydrated;

  // Determine which model to use
  const resolvedModel = requestedModel
    ?? (built.mode === 'image-to-image' ? DEFAULT_I2I_MODEL : DEFAULT_T2I_MODEL);

  const modelMeta = IMAGE_MODELS.find((m) => m.id === resolvedModel);
  const provider = modelMeta?.provider ?? 'replicate';

  // Persist immediately so we have a record even if generation fails
  const [test] = await getDb()
    .insert(generationTests)
    .values({
      areas,
      style,
      dreams,
      prompt: finalPrompt,
      notes: notes ?? null,
      model: resolvedModel,
      provider,
    })
    .returning();

  try {
    let imageUrl: string;

    if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ test, promptInfo: built, error: 'OPENAI_API_KEY is not configured.' }, { status: 207 });
      }
      imageUrl = await runOpenAI(resolvedModel, finalPrompt, built.mode, referenceImageBase64);
    } else if (provider === 'google') {
      if (!process.env.GOOGLE_AI_API_KEY) {
        return NextResponse.json({ test, promptInfo: built, error: 'GOOGLE_AI_API_KEY is not configured.' }, { status: 207 });
      }
      imageUrl = await runGoogle(resolvedModel, finalPrompt);
    } else {
      if (!process.env.REPLICATE_API_TOKEN) {
        return NextResponse.json({ test, promptInfo: built, error: 'REPLICATE_API_TOKEN is not configured.' }, { status: 207 });
      }
      imageUrl = await runReplicate(resolvedModel, finalPrompt, built.mode, { steps, guidance, imagePromptStrength }, referenceImageBase64);
    }

    if (imageUrl) {
      await getDb()
        .update(generationTests)
        .set({ imageUrl })
        .where(eq(generationTests.id, test.id));
    }

    await logger.info('Test generation succeeded', {
      route: ROUTE,
      details: { resolvedModel, provider, mode: built.mode, style, areas },
    });

    return NextResponse.json({
      test: { ...test, imageUrl },
      promptInfo: built,
      resolvedModel,
      provider,
      llmPrompt,
      llmProvider,
      llmModel,
    }, { status: 201 });
  } catch (err) {
    await logger.error('Test generation failed', {
      route: ROUTE,
      details: { ...serializeError(err), resolvedModel, provider, style, areas },
    });
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ test, promptInfo: built, error: message }, { status: 207 });
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = UpdateTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, notes, rating } = parsed.data;
  const updates: Record<string, unknown> = {};
  if (notes !== undefined) updates.notes = notes;
  if (rating !== undefined) updates.rating = rating;

  const [updated] = await getDb()
    .update(generationTests)
    .set(updates)
    .where(eq(generationTests.id, id))
    .returning();

  return NextResponse.json({ test: updated });
}

// Re-export for backwards compat + admin UI metadata
export { buildPrompt as buildCollagePrompt };
export { TEXT_TO_IMAGE_TEMPLATE, IMAGE_TO_IMAGE_TEMPLATE, STYLE_DATA, AREA_SCENES };
