import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { engineerPrompt, isLLMAvailable, buildUserMessage } from '@/lib/promptEngineer';
import { getActiveSystemPrompt } from '@/lib/getActiveSystemPrompt';
import type { AestheticStyle } from '@/lib/validations/wizard';

const Schema = z.object({
  areas: z.array(z.string()).min(1),
  style: z.enum(['minimal', 'vibrant', 'ethereal', 'luxe']),
  dreams: z.string().default(''),
  manifesto: z.string().optional(),
  mode: z.enum(['text-to-image', 'image-to-image']).default('text-to-image'),
  // Optional override — lets the admin test an unsaved draft system prompt
  systemPromptOverride: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  if (!isLLMAvailable()) {
    return NextResponse.json(
      { error: 'No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.' },
      { status: 400 },
    );
  }

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { areas, style, dreams, manifesto, mode, systemPromptOverride } = parsed.data;
  const input = { areas, style: style as AestheticStyle, dreams, manifesto, mode };
  const userMessage = buildUserMessage(input);

  // Use the override (unsaved draft) if provided; otherwise load the saved/default prompt
  const activeSystemPrompt = systemPromptOverride?.trim()
    ? { text: systemPromptOverride.trim(), source: 'override' as const }
    : await getActiveSystemPrompt();

  try {
    const result = await engineerPrompt(input, activeSystemPrompt.text);
    return NextResponse.json({
      prompt: result.prompt,
      provider: result.provider,
      model: result.model,
      systemPrompt: activeSystemPrompt.text,
      systemPromptSource: activeSystemPrompt.source,
      userMessage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
