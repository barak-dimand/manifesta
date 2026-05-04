import { NextRequest, NextResponse } from 'next/server';
import { sql, desc, eq, gte, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { appLogs } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const limit = Math.min(Number(searchParams.get('limit') ?? 200), 500);

  const conditions: SQL[] = [];
  if (level && level !== 'all') conditions.push(eq(appLogs.level, level));

  const rows = await getDb()
    .select()
    .from(appLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(appLogs.createdAt))
    .limit(limit);

  const now = Date.now();
  const [errors1h, warns1h, total24h] = await Promise.all([
    getDb()
      .select({ id: appLogs.id })
      .from(appLogs)
      .where(and(eq(appLogs.level, 'error'), gte(appLogs.createdAt, new Date(now - 3_600_000)))),
    getDb()
      .select({ id: appLogs.id })
      .from(appLogs)
      .where(and(eq(appLogs.level, 'warn'), gte(appLogs.createdAt, new Date(now - 3_600_000)))),
    getDb()
      .select({ id: appLogs.id })
      .from(appLogs)
      .where(gte(appLogs.createdAt, new Date(now - 86_400_000))),
  ]);

  return NextResponse.json({
    logs: rows,
    stats: { errors1h: errors1h.length, warns1h: warns1h.length, total24h: total24h.length },
  });
}

// Purge logs older than N days
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const days = Math.max(1, Number(searchParams.get('days') ?? 7));
  const cutoff = new Date(Date.now() - days * 86_400_000);

  await getDb().delete(appLogs).where(sql`${appLogs.createdAt} < ${cutoff}`);
  return NextResponse.json({ ok: true, purgedBefore: cutoff });
}
