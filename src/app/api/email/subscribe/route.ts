import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { emailSubscriptions, boards } from '@/lib/db/schema';
import { sendWelcomeEmail } from '@/lib/email/send';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

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
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { boardId, sendHour, timezone } = parsed.data;

    // Verify the board belongs to this user
    const [board] = await getDb()
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    if (!board || board.userId !== userId) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Get the Clerk user email
    const clerkUser = await currentUser();
    const email =
      clerkUser?.emailAddresses?.[0]?.emailAddress ?? board.email;

    // Upsert email subscription for this user
    await getDb()
      .insert(emailSubscriptions)
      .values({
        userId,
        email,
        boardId,
        isActive: true,
        sendHour,
        timezone,
      })
      .onConflictDoUpdate({
        target: emailSubscriptions.userId,
        set: {
          boardId,
          isActive: true,
          sendHour,
          timezone,
        },
      });

    // Send welcome email with manifesto
    if (board.manifesto) {
      await sendWelcomeEmail(email, board.manifesto);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('email subscribe POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
