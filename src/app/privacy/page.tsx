import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Manifesta',
  description: 'How Manifesta collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <header className="border-b border-sage/10 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="font-display text-base font-semibold text-forest tracking-wide">Manifesta</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl font-semibold text-forest mb-2">Privacy Policy</h1>
        <p className="font-sans text-sm text-forest/50 mb-10">Last updated: May 2025</p>

        <div className="prose prose-forest font-sans text-forest/80 space-y-8 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">1. Who We Are</h2>
            <p>
              Manifesta (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a service that helps you create personalized AI-generated vision boards and manifestation tools. Our website is joinmanifesta.com. For questions about this policy, contact us at hello@joinmanifesta.com.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">2. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Email address</strong> when you sign up or capture your lead</li>
              <li><strong>Name</strong> from your account profile (via Clerk authentication)</li>
              <li><strong>Dream answers and life goals</strong> entered in the wizard</li>
              <li><strong>Photos of yourself</strong> if you choose to upload them (optional)</li>
              <li><strong>Style preferences</strong> and selected life areas</li>
            </ul>
            <p>We also collect automatically:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Usage data and page visits via PostHog analytics</li>
              <li>Advertising interaction data via the Meta Pixel</li>
              <li>Log data (IP address, browser type, pages visited) via Vercel infrastructure</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To generate your personalized vision board and manifesto using AI</li>
              <li>To deliver your vision board to your email inbox</li>
              <li>To send daily life coaching reminders if you subscribe</li>
              <li>To improve our product through aggregated usage analytics</li>
              <li>To prevent fraud and maintain platform security</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">4. Third-Party Services</h2>
            <p>We use the following sub-processors to operate our service:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Clerk</strong> (clerk.com) for authentication and account management</li>
              <li><strong>PostHog</strong> (posthog.com) for product analytics</li>
              <li><strong>Resend</strong> (resend.com) for transactional and marketing emails</li>
              <li><strong>Replicate</strong> (replicate.com) for AI image generation</li>
              <li><strong>Vercel</strong> (vercel.com) for hosting and file storage (Vercel Blob)</li>
              <li><strong>Neon</strong> (neon.tech) for our database</li>
              <li><strong>Meta</strong> (facebook.com) for advertising measurement (Meta Pixel)</li>
            </ul>
            <p>Each provider processes data according to their own privacy policies and applicable laws.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">5. Your Photos</h2>
            <p>
              If you upload photos of yourself, those images are stored securely in Vercel Blob (cloud storage) and used exclusively to personalize your vision board. Your photos are never shared publicly or with third parties beyond what is required for AI image generation via Replicate. You may request deletion of your photos at any time by contacting us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days. Analytics data may be retained in aggregated, anonymized form.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and personal data</li>
              <li>Opt out of marketing emails (via unsubscribe link in any email)</li>
              <li>Opt out of analytics tracking (contact us to request this)</li>
            </ul>
            <p>To exercise any of these rights, email us at hello@joinmanifesta.com.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">8. Cookies</h2>
            <p>
              We use cookies and similar technologies for authentication (Clerk), analytics (PostHog), and advertising measurement (Meta Pixel). By using our service, you consent to this use. You may disable cookies in your browser settings, but some features may not function correctly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">9. Children&apos;s Privacy</h2>
            <p>
              Our service is not directed to children under 18. We do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us personal data, please contact us immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top. Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-forest">11. Contact Us</h2>
            <p>
              Questions or concerns about this Privacy Policy? Email us at{' '}
              <a href="mailto:hello@joinmanifesta.com" className="text-sage underline hover:text-sage/80">
                hello@joinmanifesta.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-sage/15">
          <Link href="/" className="font-sans text-sm text-forest/50 hover:text-forest/80 transition-colors">
            ← Back to Manifesta
          </Link>
        </div>
      </main>
    </div>
  );
}
