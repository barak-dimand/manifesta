import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { boards } from '@/lib/db/schema';
import { WizardSchema } from '@/lib/validations/wizard';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const CreateBoardSchema = WizardSchema.extend({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = CreateBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const {
      email,
      selectedAreas,
      dreams,
      style,
      goals,
      manifesto,
      wallpaperType,
      enableTimeline,
    } = parsed.data;

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
        wallpaperType: wallpaperType || null,
        enableTimeline,
      })
      .returning();

    return NextResponse.json({ board }, { status: 201 });
  } catch (err) {
    console.error('boards POST error:', err);
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
      .orderBy(boards.createdAt);

    return NextResponse.json({ boards: userBoards });
  } catch (err) {
    console.error('boards GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
