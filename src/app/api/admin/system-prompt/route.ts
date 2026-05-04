import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { promptConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_1 } from '@/lib/promptEngineer';
import { getActiveSystemPrompt } from '@/lib/getActiveSystemPrompt';

const CONFIG_KEY = 'llm_system_prompt';

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const active = await getActiveSystemPrompt();
  return NextResponse.json({
    text: active.text,
    source: active.source,
    presets: [
      { label: 'Compact (v2 — current default)', text: SYSTEM_PROMPT },
      { label: 'Verbose (v1)', text: SYSTEM_PROMPT_1 },
    ],
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json().catch(() => ({})) as { text?: string; label?: string };
  if (typeof body.text !== 'string' || !body.text.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  await getDb()
    .insert(promptConfig)
    .values({ configKey: CONFIG_KEY, value: body.text.trim(), label: body.label ?? 'LLM system prompt' })
    .onConflictDoUpdate({
      target: promptConfig.configKey,
      set: { value: body.text.trim(), updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, source: 'db' });
}

export async function DELETE() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  await getDb().delete(promptConfig).where(eq(promptConfig.configKey, CONFIG_KEY));
  return NextResponse.json({ ok: true, source: 'default' });
}
