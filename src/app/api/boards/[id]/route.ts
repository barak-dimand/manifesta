import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { boards } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { logger, serializeError } from '@/lib/logger';
import { z } from 'zod';
import { LifeArea, AestheticStyle, GoalSchema } from '@/lib/validations/wizard';

const ROUTE = '/api/boards/[id]';

const PatchBoardSchema = z.object({
  wallpaperUrl: z.string().url().optional(),
  name: z.string().max(100).optional(),
  selectedOffers: z.array(z.string()).optional(),
  goals: z.array(GoalSchema).optional(),
  enableTimeline: z.boolean().optional(),
  explorerData: z.unknown().optional(),
}).refine((d) =>
  d.wallpaperUrl !== undefined ||
  d.name !== undefined ||
  d.selectedOffers !== undefined ||
  d.goals !== undefined ||
  d.enableTimeline !== undefined ||
  d.explorerData !== undefined, {
  message: 'At least one field is required',
});

const PutBoardSchema = z.object({
  selectedAreas: z.array(LifeArea),
  dreams: z.string().min(1),
  style: AestheticStyle,
  goals: z.array(GoalSchema),
  manifesto: z.string().optional(),
  enableTimeline: z.boolean().optional(),
  photoUrls: z.array(z.string()).optional(),
  explorerData: z.unknown().optional(),
  selectedOffers: z.array(z.string()).optional(),
  selectedQuotes: z.array(z.string()).optional(),
  customQuotes: z.array(z.string()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const [board] = await getDb()
      .select()
      .from(boards)
      .where(and(eq(boards.id, id), eq(boards.userId, userId)))
      .limit(1);

    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    return NextResponse.json({ board });
  } catch (err) {
    await logger.error('Board fetch failed', { route: ROUTE, details: serializeError(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = PutBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { selectedAreas, dreams, style, goals, manifesto, enableTimeline, photoUrls, explorerData, selectedOffers, selectedQuotes, customQuotes } = parsed.data;

    const [board] = await getDb()
      .update(boards)
      .set({
        selectedAreas,
        dreams,
        style,
        goals,
        manifesto: manifesto ?? null,
        enableTimeline: enableTimeline ?? false,
        photoUrls: photoUrls?.length ? photoUrls : null,
        explorerData: explorerData ?? null,
        selectedOffers: selectedOffers?.length ? selectedOffers : null,
        selectedQuotes: selectedQuotes?.length ? selectedQuotes : null,
        customQuotes: customQuotes?.length ? customQuotes : null,
        updatedAt: new Date(),
      })
      .where(and(eq(boards.id, id), eq(boards.userId, userId)))
      .returning();

    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

    await logger.info('Board updated', {
      route: ROUTE,
      userId,
      details: { boardId: id, style, areas: selectedAreas },
    });

    return NextResponse.json({ board });
  } catch (err) {
    await logger.error('Board update failed', { route: ROUTE, details: serializeError(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = PatchBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.wallpaperUrl !== undefined) update.wallpaperUrl = parsed.data.wallpaperUrl;
    if (parsed.data.name !== undefined) update.name = parsed.data.name || null;
    if (parsed.data.selectedOffers !== undefined) update.selectedOffers = parsed.data.selectedOffers;
    if (parsed.data.goals !== undefined) update.goals = parsed.data.goals;
    if (parsed.data.enableTimeline !== undefined) update.enableTimeline = parsed.data.enableTimeline;
    if (parsed.data.explorerData !== undefined) update.explorerData = parsed.data.explorerData;

    const [board] = await getDb()
      .update(boards)
      .set(update)
      .where(and(eq(boards.id, id), eq(boards.userId, userId)))
      .returning();

    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    return NextResponse.json({ board });
  } catch (err) {
    await logger.error('Board update failed', { route: ROUTE, details: serializeError(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const [deleted] = await getDb()
      .delete(boards)
      .where(and(eq(boards.id, id), eq(boards.userId, userId)))
      .returning({ id: boards.id });

    if (!deleted) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

    await logger.info('Board deleted', { route: ROUTE, userId, details: { boardId: id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    await logger.error('Board delete failed', { route: ROUTE, details: serializeError(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
