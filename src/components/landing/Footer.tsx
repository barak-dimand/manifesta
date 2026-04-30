import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const footerLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Contact', href: '#' },
];

export function Footer() {
  return (
    <footer className="bg-forest py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + brand */}
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="font-display text-lg font-semibold text-cream/90 tracking-wide">
              Manifesta
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-sans text-sm text-cream/50 hover:text-cream/80 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="font-sans text-sm text-cream/40">
            &copy; 2025 Manifesta. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
