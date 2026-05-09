import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import Script from 'next/script';
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
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${cormorantGaramond.variable} ${dmSans.variable} h-full antialiased`}
      >
        <head>
          {pixelId && (
            <Script id="meta-pixel" strategy="afterInteractive">{`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
            `}</Script>
          )}
        </head>
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
