import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { LeadSchema } from '@/lib/validations/wizard';
import { logger, serializeError } from '@/lib/logger';
import type { WizardLeadPayload } from '@/lib/validations/lead';

const ROUTE = '/api/leads';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const parsed = LeadSchema.safeParse(body);
    if (!parsed.success) {
      await logger.warn('Lead capture: validation failed', {
        route: ROUTE,
        details: { errors: parsed.error.flatten() },
      });
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const wizardData =
      body !== null && typeof body === 'object' && 'wizardData' in body
        ? (body.wizardData as WizardLeadPayload)
        : null;

    const source =
      body !== null && typeof body === 'object' && 'source' in body
        ? String((body as { source: unknown }).source)
        : 'wizard';

    await getDb()
      .insert(leads)
      .values({ email: parsed.data.email, source, wizardData: wizardData ?? undefined })
      .onConflictDoUpdate({
        target: leads.email,
        set: { wizardData: wizardData ?? undefined, source },
      });

    await logger.info('Lead captured', {
      route: ROUTE,
      details: { email: parsed.data.email, source },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    await logger.error('Lead capture failed', {
      route: ROUTE,
      details: serializeError(err),
    });

    if (err instanceof Error && err.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { error: 'Database not configured — set DATABASE_URL and run pnpm db:push.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
