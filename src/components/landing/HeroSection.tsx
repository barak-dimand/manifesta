'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const particles = [
  { size: 10, top: '15%', left: '8%', delay: 0, color: 'bg-gold/30' },
  { size: 6, top: '25%', left: '85%', delay: 1, color: 'bg-sage/40' },
  { size: 14, top: '60%', left: '5%', delay: 2, color: 'bg-gold/20' },
  { size: 8, top: '70%', left: '90%', delay: 0.5, color: 'bg-sage/30' },
  { size: 12, top: '40%', left: '92%', delay: 1.5, color: 'bg-gold/25' },
  { size: 7, top: '80%', left: '15%', delay: 2.5, color: 'bg-sage/35' },
  { size: 9, top: '10%', left: '55%', delay: 3, color: 'bg-gold/20' },
  { size: 5, top: '88%', left: '70%', delay: 0.8, color: 'bg-sage/25' },
];

const avatarColors = [
  { bg: 'bg-sage', initials: 'AK' },
  { bg: 'bg-gold', initials: 'MR' },
  { bg: 'bg-forest', initials: 'SL' },
  { bg: 'bg-sage', initials: 'JP' },
  { bg: 'bg-gold', initials: 'TC' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: 'var(--background-gradient-hero)' }}
    >
      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${p.color} animate-float pointer-events-none`}
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start gap-6"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <Badge variant="gold" className="gap-1.5 px-3 py-1 text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                Free Dream Board — No Credit Card
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.div variants={itemVariants}>
              <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-semibold text-forest leading-[1.05] tracking-tight">
                Manifest Your
                <br />
                <em className="text-gold not-italic font-semibold">Dream Life</em>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="text-xl text-forest/65 font-sans leading-relaxed max-w-md"
            >
              Get your personalized AI dream board wallpaper — free, delivered to your inbox within 24 hours.
              <br />
              <span className="text-forest/50 text-lg">Deepen your practice with meditations, a manifesto PDF, and daily coaching.</span>
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="gold" size="lg" className="text-base px-8 animate-pulse-glow" asChild>
                <Link href="/create">Create Your Dream Board</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8"
                onClick={() => {
                  const el = document.querySelector('#examples');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                See Examples
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                {avatarColors.map((a, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full ${a.bg} border-2 border-cream flex items-center justify-center`}
                  >
                    <span className="text-white text-xs font-semibold font-sans">{a.initials}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-forest/60 font-sans">
                Join{' '}
                <span className="font-semibold text-forest/80">2,000+ dreamers</span>{' '}
                manifesting their best life
              </p>
            </motion.div>
          </motion.div>

          {/* Right — floating dream board preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden md:flex justify-center"
          >
            <div
              className="animate-float"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="relative w-72 rounded-2xl overflow-hidden shadow-2xl border border-sage/20 bg-cream">
                {/* Board header */}
                <div
                  className="p-4"
                  style={{ background: 'var(--background-gradient-sage)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="font-display text-white text-sm font-medium">
                      My Dream Life Board
                    </span>
                  </div>
                  <p className="font-display italic text-white/80 text-xs leading-relaxed">
                    &ldquo;Living freely, creating boldly, loving deeply.&rdquo;
                  </p>
                </div>

                {/* Visual grid */}
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg h-24 bg-gradient-to-br from-gold-light to-gold/30 flex items-end p-2">
                    <span className="text-forest text-xs font-sans font-medium">Career & Purpose</span>
                  </div>
                  <div className="rounded-lg h-24 bg-gradient-to-br from-sage-light to-sage/30 flex items-end p-2">
                    <span className="text-forest text-xs font-sans font-medium">Love & Joy</span>
                  </div>
                  <div className="rounded-lg h-20 col-span-2 bg-gradient-to-r from-forest/10 to-sage/20 flex items-center px-3 gap-2">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                    <span className="text-forest/70 text-xs font-sans">Daily habit: meditate 10 min</span>
                  </div>
                  <div className="rounded-lg h-16 bg-gradient-to-br from-gold/20 to-cream flex items-end p-2">
                    <span className="text-forest text-xs font-sans font-medium">Travel</span>
                  </div>
                  <div className="rounded-lg h-16 bg-gradient-to-br from-sage/20 to-cream flex items-end p-2">
                    <span className="text-forest text-xs font-sans font-medium">Health</span>
                  </div>
                </div>

                {/* Bottom affirmation */}
                <div className="px-3 pb-3">
                  <div className="rounded-md bg-gold-light/60 px-3 py-2">
                    <p className="font-display italic text-forest text-xs text-center">
                      This is my life. This is my time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-gold/10 rounded-3xl blur-2xl -z-10 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream/40 to-transparent pointer-events-none" />
    </section>
  );
}
