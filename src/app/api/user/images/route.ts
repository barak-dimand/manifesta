import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { generatedWallpapers } from '@/lib/db/schema';
import { eq, desc, gte, and, count } from 'drizzle-orm';

const DAILY_LIMIT = 15;

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [images, usedTodayRows] = await Promise.all([
    getDb()
      .select()
      .from(generatedWallpapers)
      .where(eq(generatedWallpapers.userId, userId))
      .orderBy(desc(generatedWallpapers.createdAt))
      .limit(50),
    getDb()
      .select({ value: count() })
      .from(generatedWallpapers)
      .where(and(
        eq(generatedWallpapers.userId, userId),
        gte(generatedWallpapers.createdAt, new Date(Date.now() - 86_400_000)),
      )),
  ]);

  const usedToday = usedTodayRows[0]?.value ?? 0;

  return NextResponse.json({
    images,
    usedToday,
    remaining: Math.max(0, DAILY_LIMIT - usedToday),
    limit: DAILY_LIMIT,
  });
}
