'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Derive menu visibility — never show on desktop even if state is stale
  const isMenuOpen = isMobile && mobileOpen;

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-cream/95 backdrop-blur-md shadow-sm border-b border-sage/10'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles className="w-5 h-5 text-gold transition-transform group-hover:scale-110" />
            <span className="font-display text-xl font-semibold text-forest tracking-wide">
              Manifesta
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm font-sans text-forest/80 hover:text-forest transition-colors hover:underline underline-offset-4 decoration-sage/50 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-sans text-forest/70 hover:text-forest transition-colors"
            >
              Sign in
            </Link>
            <Button variant="gold" size="sm" asChild>
              <Link href="/create">Create Your Board</Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-forest rounded-md hover:bg-sage-light transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-cream/98 backdrop-blur-md border-b border-sage/10"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left text-sm font-sans text-forest/80 hover:text-forest py-2 border-b border-sage/10 last:border-0 cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <Link
                href="/sign-in"
                className="text-sm font-sans text-forest/70 hover:text-forest py-2"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Button variant="gold" className="w-full mt-1" asChild>
                <Link href="/create" onClick={() => setMobileOpen(false)}>
                  Create Your Board
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
