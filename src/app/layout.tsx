import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { PHProvider } from '@/components/providers/PosthogProvider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Manifesta — AI Dream Boards',
  description:
    'Create your dream life vision board with AI. Set intentions, visualize your goals, and manifest the life you want.',
  keywords: ['vision board', 'dream board', 'manifestation', 'AI', 'goals', 'affirmations'],
  authors: [{ name: 'Manifesta' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Manifesta — AI Dream Boards',
    description:
      'Create your dream life vision board with AI. Set intentions, visualize your goals, and manifest the life you want.',
    siteName: 'Manifesta',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Manifesta — AI Dream Boards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manifesta — AI Dream Boards',
    description:
      'Create your dream life vision board with AI. Set intentions, visualize your goals, and manifest the life you want.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${cormorantGaramond.variable} ${dmSans.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-cream font-sans">
          <PHProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </PHProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
