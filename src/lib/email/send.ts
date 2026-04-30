import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.RESEND_FROM_EMAIL || 'hello@manifesta.app';

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
