import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { boards } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { logger, serializeError } from '@/lib/logger';
import { z } from 'zod';

const PatchBoardSchema = z.object({
  wallpaperUrl: z.string().url(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = PatchBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [board] = await getDb()
      .update(boards)
      .set({ wallpaperUrl: parsed.data.wallpaperUrl, updatedAt: new Date() })
      .where(and(eq(boards.id, id), eq(boards.userId, userId)))
      .returning();

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json({ board });
  } catch (err) {
    await logger.error('Board wallpaper update failed', {
      route: '/api/boards/[id]',
      details: serializeError(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
