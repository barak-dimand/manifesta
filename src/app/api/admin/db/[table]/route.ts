import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { leads, boards, emailSubscriptions, generationTests, modelConfig, appLogs, generatedWallpapers, promptConfig } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

const TABLE_MAP = { leads, boards, emailSubscriptions, generationTests, modelConfig, appLogs, generatedWallpapers, promptConfig } as const;
type TableKey = keyof typeof TABLE_MAP;

function resolveTable(name: string) {
  if (name in TABLE_MAP) return TABLE_MAP[name as TableKey];
  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ table: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { table } = await params;
  const tbl = resolveTable(table);
  if (!tbl) return NextResponse.json({ error: 'Unknown table' }, { status: 404 });

  // Order by createdAt when available, otherwise updatedAt, fallback to id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = tbl as any;
  const orderCol = t.createdAt ?? t.updatedAt ?? t.id;
  const rows = await getDb().select().from(tbl).orderBy(desc(orderCol));
  return NextResponse.json({ rows, count: rows.length });
}
