import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { generatedWallpapers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { logger, serializeError } from '@/lib/logger';

const ROUTE = '/api/wallpapers/[id]';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const [deleted] = await getDb()
      .delete(generatedWallpapers)
      .where(and(eq(generatedWallpapers.id, id), eq(generatedWallpapers.userId, userId)))
      .returning({ id: generatedWallpapers.id });

    if (!deleted) return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });

    await logger.info('Wallpaper deleted', { route: ROUTE, userId, details: { wallpaperId: id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    await logger.error('Wallpaper delete failed', { route: ROUTE, details: serializeError(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
