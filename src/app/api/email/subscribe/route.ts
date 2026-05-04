import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { emailSubscriptions, boards } from '@/lib/db/schema';
import { sendWelcomeEmail } from '@/lib/email/send';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger, serializeError } from '@/lib/logger';

const ROUTE = '/api/email/subscribe';

const SubscribeSchema = z.object({
  boardId: z.string().uuid(),
  sendHour: z.number().int().min(0).max(23).optional().default(8),
  timezone: z.string().optional().default('UTC'),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      await logger.warn('Email subscribe: validation failed', {
        route: ROUTE,
        userId,
        details: { errors: parsed.error.flatten() },
      });
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { boardId, sendHour, timezone } = parsed.data;

    const [board] = await getDb()
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    if (!board || board.userId !== userId) {
      await logger.warn('Email subscribe: board not found or unauthorized', {
        route: ROUTE,
        userId,
        details: { boardId },
      });
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? board.email;

    await getDb()
      .insert(emailSubscriptions)
      .values({ userId, email, boardId, isActive: true, sendHour, timezone })
      .onConflictDoUpdate({
        target: emailSubscriptions.userId,
        set: { boardId, isActive: true, sendHour, timezone },
      });

    await logger.info('Email subscription saved', {
      route: ROUTE,
      userId,
      details: { boardId, sendHour, timezone },
    });

    if (board.manifesto) {
      try {
        await sendWelcomeEmail(email, board.manifesto);
        await logger.info('Welcome email sent', { route: ROUTE, userId, details: { email } });
      } catch (emailErr) {
        await logger.warn('Welcome email failed (subscription still saved)', {
          route: ROUTE,
          userId,
          details: { ...serializeError(emailErr), email },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    await logger.error('Email subscribe failed', {
      route: ROUTE,
      details: serializeError(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
