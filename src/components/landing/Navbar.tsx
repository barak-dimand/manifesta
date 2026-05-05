'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, LayoutDashboard, LogOut, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser, useClerk } from '@clerk/nextjs';
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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarOpen) return;
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [avatarOpen]);

  const isMenuOpen = isMobile && mobileOpen;

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Avatar initials from Clerk user
  const initials = isLoaded && user
    ? (`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || (user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? '?'))
    : null;

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
          <div className="hidden md:flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <div ref={avatarRef} className="relative flex items-center gap-3">
                <Link
                  href="/create?new=1"
                  className="flex items-center gap-1 text-sm font-sans font-semibold text-sage hover:text-forest transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Board
                </Link>
                <button
                  onClick={() => setAvatarOpen((v) => !v)}
                  className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-white text-xs font-bold font-sans hover:bg-sage/80 transition-colors focus:outline-none"
                  aria-label="Account menu"
                >
                  {initials}
                </button>
                <AnimatePresence>
                  {avatarOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-10 w-44 rounded-xl bg-cream border border-sage/20 shadow-lg overflow-hidden z-50"
                    >
                      <Link
                        href="/dashboard"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 font-sans text-sm text-forest/80 hover:bg-sage-light/50 hover:text-forest transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                      </Link>
                      <button
                        onClick={() => { setAvatarOpen(false); void signOut(); }}
                        className="w-full flex items-center gap-2 px-4 py-3 font-sans text-sm text-forest/80 hover:bg-sage-light/50 hover:text-forest transition-colors border-t border-sage/10"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-sans text-forest/70 hover:text-forest transition-colors"
                >
                  Sign in
                </Link>
                <Button variant="gold" size="sm" asChild>
                  <Link href="/create">Create Your Board</Link>
                </Button>
              </>
            )}
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

              {isLoaded && isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm font-sans text-forest/70 hover:text-forest py-2 border-b border-sage/10"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Button variant="gold" className="w-full mt-1" asChild>
                    <Link href="/create?new=1" onClick={() => setMobileOpen(false)}>
                      + New Board
                    </Link>
                  </Button>
                  <button
                    onClick={() => { setMobileOpen(false); void signOut(); }}
                    className="flex items-center gap-2 text-sm font-sans text-forest/60 hover:text-forest py-2 mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
