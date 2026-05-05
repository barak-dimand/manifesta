import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { boards } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { LifeArea, AestheticStyle, GoalSchema } from '@/lib/validations/wizard';
import { logger, serializeError } from '@/lib/logger';

const ROUTE = '/api/boards';

const SaveBoardSchema = z.object({
  selectedAreas: z.array(LifeArea),
  dreams: z.string().min(1),
  style: AestheticStyle,
  goals: z.array(GoalSchema),
  manifesto: z.string().optional(),
  enableTimeline: z.boolean().optional(),
  photoUrls: z.array(z.string()).optional(),
  explorerData: z.unknown().optional(),
  selectedOffers: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
    if (!email) {
      await logger.warn('Board save: no email on account', { route: ROUTE, userId });
      return NextResponse.json({ error: 'No email on account' }, { status: 400 });
    }

    const body: unknown = await request.json();
    const parsed = SaveBoardSchema.safeParse(body);
    if (!parsed.success) {
      await logger.warn('Board save: validation failed', {
        route: ROUTE,
        userId,
        details: { errors: parsed.error.flatten() },
      });
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { selectedAreas, dreams, style, goals, manifesto, enableTimeline, photoUrls, explorerData, selectedOffers } = parsed.data;

    const [board] = await getDb()
      .insert(boards)
      .values({
        userId,
        email,
        selectedAreas,
        dreams,
        style,
        goals,
        manifesto: manifesto || null,
        enableTimeline: enableTimeline ?? false,
        photoUrls: photoUrls?.length ? photoUrls : null,
        explorerData: explorerData ?? null,
        selectedOffers: selectedOffers?.length ? selectedOffers : ['wallpaper'],
      })
      .returning();

    await logger.info('Board saved', {
      route: ROUTE,
      userId,
      details: { boardId: board.id, style, areas: selectedAreas },
    });

    return NextResponse.json({ board }, { status: 201 });
  } catch (err) {
    await logger.error('Board save failed', {
      route: ROUTE,
      details: serializeError(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBoards = await getDb()
      .select()
      .from(boards)
      .where(eq(boards.userId, userId))
      .orderBy(desc(boards.createdAt));

    return NextResponse.json({ boards: userBoards });
  } catch (err) {
    await logger.error('Boards list failed', {
      route: ROUTE,
      details: serializeError(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
