import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { modelConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const SaveConfigSchema = z.object({
  configKey: z.string().min(1),
  provider: z.enum(['replicate', 'openai', 'google']),
  modelId: z.string().min(1),
  params: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const rows = await getDb().select().from(modelConfig);
  return NextResponse.json({ configs: rows });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = SaveConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { configKey, provider, modelId, params } = parsed.data;

  const [row] = await getDb()
    .insert(modelConfig)
    .values({ configKey, provider, modelId, params: params ?? null })
    .onConflictDoUpdate({
      target: modelConfig.configKey,
      set: { provider, modelId, params: params ?? null, updatedAt: new Date() },
    })
    .returning();

  return NextResponse.json({ config: row });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const configKey = searchParams.get('key');
  if (!configKey) return NextResponse.json({ error: 'key required' }, { status: 400 });

  await getDb().delete(modelConfig).where(eq(modelConfig.configKey, configKey));
  return NextResponse.json({ ok: true });
}
