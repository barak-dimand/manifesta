import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { boards, generatedWallpapers } from '@/lib/db/schema';
import { sendVisionBoardReady } from '@/lib/email/send';
import { logger, serializeError } from '@/lib/logger';

const ROUTE = '/api/admin/boards/[boardId]/upload-image';
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { boardId } = await params;

  // Fetch the board
  const [board] = await getDb().select().from(boards).where(eq(boards.id, boardId)).limit(1);
  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 });
  }

  try {
    // Upload to Vercel Blob
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filename = `vision-boards/${boardId}/${uniqueId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(filename, buffer, { access: 'public', contentType: file.type });
    const imageUrl = blob.url;

    // Save to generatedWallpapers (shows in user dashboard wallpapers section)
    await getDb().insert(generatedWallpapers).values({
      userId: board.userId,
      boardId: board.id,
      imageUrl,
      manifesto: board.manifesto ?? null,
      dreams: board.dreams,
      style: board.style,
      areas: board.selectedAreas,
      mode: 'manual',
    });

    // Update board's wallpaperUrl so the board card shows a preview
    await getDb()
      .update(boards)
      .set({ wallpaperUrl: imageUrl, wallpaperType: 'manual' })
      .where(eq(boards.id, boardId));

    await logger.info('Admin uploaded vision board image', {
      route: ROUTE,
      userId: authResult.userId,
      details: { boardId, targetUserId: board.userId, imageUrl },
    });

    // Send notification email — awaited so it completes before the response is returned.
    // Wrapped in its own try/catch so an email failure never rolls back the upload.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://joinmanifesta.com';
    try {
      await sendVisionBoardReady({
        to: board.email,
        firstName: null,
        imageUrl,
        dreams: board.dreams,
        dashboardUrl: `${appUrl}/dashboard`,
      });
    } catch (emailErr) {
      await logger.warn('Vision board ready email failed', {
        route: ROUTE,
        details: serializeError(emailErr),
      });
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (err) {
    await logger.error('Vision board upload failed', {
      route: ROUTE,
      details: serializeError(err),
    });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
