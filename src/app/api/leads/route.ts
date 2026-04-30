import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { LeadSchema } from '@/lib/validations/wizard';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    // Validate required email field
    const parsed = LeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const wizardData =
      body !== null &&
      typeof body === 'object' &&
      'wizardData' in body &&
      body.wizardData !== undefined
        ? (body.wizardData as Record<string, unknown>)
        : null;

    // Upsert: insert or update on email conflict
    await getDb()
      .insert(leads)
      .values({
        email: parsed.data.email,
        wizardData: wizardData,
      })
      .onConflictDoUpdate({
        target: leads.email,
        set: {
          wizardData: wizardData,
        },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('leads POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
