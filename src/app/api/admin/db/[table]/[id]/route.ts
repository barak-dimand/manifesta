import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { leads, boards, emailSubscriptions, generationTests, modelConfig, appLogs, generatedWallpapers, promptConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const TABLE_MAP = { leads, boards, emailSubscriptions, generationTests, modelConfig, appLogs, generatedWallpapers, promptConfig } as const;
type TableKey = keyof typeof TABLE_MAP;

function resolveTable(name: string) {
  if (name in TABLE_MAP) return TABLE_MAP[name as TableKey];
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { table, id } = await params;
  const tbl = resolveTable(table);
  if (!tbl) return NextResponse.json({ error: 'Unknown table' }, { status: 404 });

  const body: unknown = await request.json().catch(() => ({}));
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Strip protected fields — never allow overwriting id, userId, createdAt
  const { id: _id, userId: _uid, createdAt: _ca, ...updates } = body as Record<string, unknown>;
  void _id; void _uid; void _ca;

  const [row] = await getDb().update(tbl).set(updates).where(eq(tbl.id, id)).returning();
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ row });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { table, id } = await params;
  const tbl = resolveTable(table);
  if (!tbl) return NextResponse.json({ error: 'Unknown table' }, { status: 404 });

  await getDb().delete(tbl).where(eq(tbl.id, id));
  return NextResponse.json({ ok: true });
}
