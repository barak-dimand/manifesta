import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-forest px-4">
      <Sparkles className="w-12 h-12 text-gold mb-6" strokeWidth={1.5} />
      <h1 className="font-display text-6xl font-light text-forest mb-4">404</h1>
      <p className="font-display text-2xl font-light text-forest-light mb-2 italic">
        This page doesn&apos;t exist (yet)
      </p>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
        The dream you&apos;re looking for may have already been manifested elsewhere.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md bg-sage px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-forest-light transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Back to Manifesta
      </Link>
    </div>
  );
}
