import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { sendBoardConfirmation, sendAdminNewSignup } from '@/lib/email/send';

export async function POST() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://manifesta.app';
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? '(not set — defaulting to hello@manifesta.app)';
  const hasApiKey = !!process.env.RESEND_API_KEY;

  const results = await Promise.allSettled([
    sendBoardConfirmation({
      to: 'bdimandailife@gmail.com',
      firstName: 'Barak',
      dreams: 'Building a product that helps millions of people manifest their dream lives.',
      selectedOffers: ['wallpaper', 'dream-card', 'life-coach'],
      dashboardUrl: `${appUrl}/dashboard`,
    }),
    sendAdminNewSignup({
      userEmail: 'testuser@example.com',
      firstName: 'Test',
      lastName: 'User',
      dreams: 'Building a product that helps millions of people manifest their dream lives.',
      selectedAreas: ['career', 'health', 'relationships'],
      selectedOffers: ['wallpaper', 'dream-card'],
      boardId: 'test-board-id-123',
      appUrl,
    }),
  ]);

  const output = results.map((r, i) => {
    const label = i === 0 ? 'user_confirmation' : 'admin_notification';
    if (r.status === 'fulfilled') {
      return { email: label, status: 'sent', resend_id: (r.value as { id?: string })?.id };
    }
    return { email: label, status: 'failed', error: String(r.reason) };
  });

  const allOk = output.every((o) => o.status === 'sent');
  return NextResponse.json({
    ok: allOk,
    config: { from: fromEmail, api_key_set: hasApiKey },
    emails: output,
  }, { status: allOk ? 200 : 500 });
}
