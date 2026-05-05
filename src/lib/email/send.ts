import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.RESEND_FROM_EMAIL || 'hello@joinmanifesta.com';

const OFFER_LABELS: Record<string, string> = {
  wallpaper: 'Dream Board Wallpaper (Free)',
  'dream-card': 'Manifesta Dream Card — $19',
  meditations: 'Guided Manifestation Meditations — $39',
  'life-coach': 'Daily Life Coach Emails — $17/month',
};

export async function sendWelcomeEmail(to: string, manifesto: string) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Your dream life is waiting ✨',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Welcome to Manifesta</title>
        </head>
        <body style="background:#f9f6ef;font-family:'DM Sans',Arial,sans-serif;color:#162420;margin:0;padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#f9f6ef;border-radius:12px;overflow:hidden;border:1px solid #d4ddd9;">
            <tr>
              <td style="background:hsl(150,22%,38%);padding:32px 40px;text-align:center;">
                <h1 style="font-family:Georgia,serif;color:#fff;font-size:28px;font-weight:300;margin:0;letter-spacing:0.05em;">Manifesta</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#162420;margin:0 0 16px;">Welcome to your dream life ✨</h2>
                <p style="font-size:15px;line-height:1.7;color:#2b4a40;margin:0 0 24px;">
                  Your vision board is ready. Here is your personal manifesto:
                </p>
                <blockquote style="border-left:3px solid hsl(43,65%,58%);margin:0 0 24px;padding:16px 20px;background:hsl(43,55%,92%);border-radius:0 8px 8px 0;">
                  <p style="font-family:Georgia,serif;font-size:16px;font-style:italic;color:#162420;margin:0;line-height:1.7;">
                    ${manifesto}
                  </p>
                </blockquote>
                <p style="font-size:14px;color:#5a7a70;line-height:1.6;margin:0;">
                  Come back every day to check your habits and keep manifesting your dream life.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;border-top:1px solid #d4ddd9;text-align:center;">
                <p style="font-size:12px;color:#8aa49a;margin:0;">
                  You received this because you signed up for Manifesta.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function sendBoardConfirmation({
  to,
  firstName,
  dreams,
  selectedOffers,
  dashboardUrl,
}: {
  to: string;
  firstName: string | null;
  dreams: string;
  selectedOffers: string[];
  dashboardUrl: string;
}) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
  const offerListHtml = selectedOffers
    .map((id) => `<li style="margin-bottom:6px;">${OFFER_LABELS[id] ?? id}</li>`)
    .join('');
  const hasPaid = selectedOffers.some((id) => id !== 'wallpaper');

  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Your dream board is being crafted ✨',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Your Dream Board Is On Its Way</title>
        </head>
        <body style="background:#f9f6ef;font-family:'DM Sans',Arial,sans-serif;color:#162420;margin:0;padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#f9f6ef;border-radius:12px;overflow:hidden;border:1px solid #d4ddd9;">
            <tr>
              <td style="background:hsl(150,22%,38%);padding:32px 40px;text-align:center;">
                <h1 style="font-family:Georgia,serif;color:#fff;font-size:28px;font-weight:300;margin:0;letter-spacing:0.05em;">Manifesta</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#162420;margin:0 0 12px;">${greeting}</h2>
                <p style="font-size:15px;line-height:1.7;color:#2b4a40;margin:0 0 24px;">
                  Your dream board is officially in motion. We&apos;re crafting everything by hand and you&apos;ll receive it within <strong>24 hours</strong>.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #d4ddd9;margin-bottom:24px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#5a7a70;margin:0 0 8px;">What you&apos;re getting</p>
                      <ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:#2b4a40;line-height:1.8;">
                        ${offerListHtml}
                      </ul>
                    </td>
                  </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:hsl(43,55%,92%);border-radius:10px;border:1px solid hsl(43,40%,82%);margin-bottom:24px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#5a7a70;margin:0 0 8px;">Your dreams</p>
                      <p style="font-family:Georgia,serif;font-size:15px;font-style:italic;color:#162420;margin:0;line-height:1.7;">&ldquo;${dreams}&rdquo;</p>
                    </td>
                  </tr>
                </table>
                ${hasPaid ? `<p style="font-size:14px;line-height:1.7;color:#2b4a40;margin:0 0 24px;">We&apos;ll follow up shortly about your additional selections. Keep an eye on your inbox.</p>` : ''}
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align:center;padding:8px 0;">
                      <a href="${dashboardUrl}" style="display:inline-block;background:hsl(150,22%,38%);color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">View My Dashboard</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;border-top:1px solid #d4ddd9;text-align:center;">
                <p style="font-size:12px;color:#8aa49a;margin:0;">
                  You received this because you signed up for Manifesta. Questions? Reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function sendAdminNewSignup({
  userEmail,
  firstName,
  lastName,
  dreams,
  selectedAreas,
  selectedOffers,
  boardId,
  appUrl,
}: {
  userEmail: string;
  firstName: string | null;
  lastName: string | null;
  dreams: string;
  selectedAreas: string[];
  selectedOffers: string[];
  boardId: string;
  appUrl: string;
}) {
  const name = [firstName, lastName].filter(Boolean).join(' ') || userEmail;
  const offerListHtml = selectedOffers
    .map((id) => `<li style="margin-bottom:4px;">${OFFER_LABELS[id] ?? id}</li>`)
    .join('');
  const areasText = selectedAreas.join(', ');
  const hasPaid = selectedOffers.some((id) => id !== 'wallpaper');

  return getResend().emails.send({
    from: FROM(),
    to: 'bdimandailife@gmail.com',
    subject: `${hasPaid ? '💰 Paid interest — ' : ''}New Manifesta signup: ${name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="background:#f0f0f0;font-family:Arial,sans-serif;color:#111;margin:0;padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #ddd;">
            <tr>
              <td style="background:${hasPaid ? '#1a4731' : '#2b6349'};padding:24px 32px;">
                <h1 style="color:#fff;font-size:18px;margin:0;">
                  ${hasPaid ? '💰 New paid-interest signup' : 'New free signup'} — Manifesta
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:6px 0;font-size:13px;color:#555;width:120px;">Name</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${name}</td></tr>
                  <tr><td style="padding:6px 0;font-size:13px;color:#555;">Email</td><td style="padding:6px 0;font-size:14px;"><a href="mailto:${userEmail}" style="color:#2b6349;">${userEmail}</a></td></tr>
                  <tr><td style="padding:6px 0;font-size:13px;color:#555;">Life areas</td><td style="padding:6px 0;font-size:14px;">${areasText}</td></tr>
                  <tr><td style="padding:6px 0;font-size:13px;color:#555;">Board ID</td><td style="padding:6px 0;font-size:13px;font-family:monospace;color:#888;">${boardId}</td></tr>
                </table>

                <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />

                <p style="font-size:13px;color:#555;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Dreams</p>
                <p style="font-size:14px;font-style:italic;color:#222;background:#f9f6ef;border-left:3px solid #c8a84b;padding:12px 16px;border-radius:0 6px 6px 0;margin:0 0 20px;">&ldquo;${dreams}&rdquo;</p>

                <p style="font-size:13px;color:#555;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Selected offers</p>
                <ul style="margin:0 0 24px;padding:0 0 0 18px;font-size:14px;color:#222;line-height:1.8;">
                  ${offerListHtml}
                </ul>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:8px;">
                      <a href="${appUrl}/admin" style="display:block;text-align:center;background:#2b6349;color:#fff;font-size:13px;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px;">Open Admin Panel</a>
                    </td>
                    <td>
                      <a href="mailto:${userEmail}" style="display:block;text-align:center;background:#f0f0f0;color:#111;font-size:13px;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px;">Reply to User</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function sendDailyAffirmation(
  to: string,
  affirmation: string,
  habitChecklistHtml: string,
) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Good morning — your dream life reminder 🌅',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Your Daily Reminder</title>
        </head>
        <body style="background:#f9f6ef;font-family:'DM Sans',Arial,sans-serif;color:#162420;margin:0;padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#f9f6ef;border-radius:12px;overflow:hidden;border:1px solid #d4ddd9;">
            <tr>
              <td style="background:hsl(150,22%,38%);padding:32px 40px;text-align:center;">
                <h1 style="font-family:Georgia,serif;color:#fff;font-size:28px;font-weight:300;margin:0;letter-spacing:0.05em;">Manifesta</h1>
                <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:8px 0 0;">Good morning 🌅</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <blockquote style="border-left:3px solid hsl(43,65%,58%);margin:0 0 32px;padding:16px 20px;background:hsl(43,55%,92%);border-radius:0 8px 8px 0;">
                  <p style="font-family:Georgia,serif;font-size:17px;font-style:italic;color:#162420;margin:0;line-height:1.7;">
                    ${affirmation}
                  </p>
                </blockquote>
                <h3 style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#5a7a70;margin:0 0 16px;">Today&apos;s Habits</h3>
                ${habitChecklistHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;border-top:1px solid #d4ddd9;text-align:center;">
                <p style="font-size:12px;color:#8aa49a;margin:0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color:hsl(150,22%,38%);">Unsubscribe from daily reminders</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
