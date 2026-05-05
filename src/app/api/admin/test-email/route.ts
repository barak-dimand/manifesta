import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/admin';

export async function POST() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'hello@joinmanifesta.com';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://joinmanifesta.com';

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  // Send a simple plain-text test to both inboxes to cut through any HTML rendering issues
  const results = await Promise.allSettled([
    resend.emails.send({
      from: fromEmail,
      to: 'barakdimand6@gmail.com',
      subject: '[Manifesta Test] barakdimand6 inbox check',
      text: `Test email from ${fromEmail} via Resend. App URL: ${appUrl}. If you see this, delivery is working.`,
    }),
    resend.emails.send({
      from: fromEmail,
      to: 'bdimandailife@gmail.com',
      subject: '[Manifesta Test] bdimandailife inbox check',
      text: `Test email from ${fromEmail} via Resend. App URL: ${appUrl}. If you see this, delivery is working.`,
    }),
  ]);

  const output = results.map((r, i) => {
    const to = i === 0 ? 'barakdimand6@gmail.com' : 'bdimandailife@gmail.com';
    if (r.status === 'fulfilled') {
      const { data, error } = r.value;
      if (error) {
        return { to, status: 'resend_error', error };
      }
      return { to, status: 'sent', resend_id: data?.id };
    }
    return { to, status: 'exception', error: String(r.reason) };
  });

  const allOk = output.every((o) => o.status === 'sent');
  return NextResponse.json({
    ok: allOk,
    config: { from: fromEmail, api_key_set: true, app_url: appUrl },
    emails: output,
  }, { status: allOk ? 200 : 500 });
}
