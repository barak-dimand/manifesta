'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, Star, Headphones, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Tier {
  id: string;
  Icon: React.ElementType;
  badge: string | null;
  name: string;
  price: string;
  period?: string;
  tagline: string;
  bullets: string[];
  cta: string;
  popular?: boolean;
  free?: boolean;
}

const tiers: Tier[] = [
  {
    id: 'dream-card',
    Icon: Star,
    badge: 'MOST POPULAR',
    name: 'Manifesta Dream Card',
    price: '$19',
    tagline: 'Your dream board + a personal manifesto — a declaration of the life you\'re calling in.',
    bullets: [
      'Custom manifesto written for you',
      'Beautifully designed PDF',
      'Phone & desktop wallpaper included',
      'Yours to print & frame',
    ],
    cta: 'Get My Dream Card',
    popular: true,
  },
  {
    id: 'meditations',
    Icon: Headphones,
    badge: null,
    name: 'Guided Meditations',
    price: '$39',
    tagline: '3 personalized audio meditations to rewire your subconscious and accelerate manifestation.',
    bullets: [
      '3 custom audio meditations',
      '5–10 minutes each',
      'Scripted around your specific dreams',
      'Download & keep forever',
    ],
    cta: 'Get My Meditations',
  },
  {
    id: 'life-coach',
    Icon: Mail,
    badge: null,
    name: 'Daily Life Coach',
    price: '$17',
    period: '/month',
    tagline: 'Your AI coach in your inbox every morning — motivation, vision images, and reminders.',
    bullets: [
      'Daily personalized message',
      'AI-generated vision images',
      'Habit & goal reminders',
      'Cancel anytime',
    ],
    cta: 'Start My Coaching',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-sm font-sans font-semibold text-sage uppercase tracking-widest mb-3">
            Your Journey
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-forest font-semibold">
            Start Free. Go as Deep as You Want.
          </h2>
          <p className="mt-4 text-forest/60 font-sans text-lg max-w-xl mx-auto">
            Your dream board wallpaper is always free. Add upgrades to go deeper into your manifestation practice.
          </p>
        </motion.div>

        {/* Free tier — full width spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-r from-gold/5 to-gold/10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-7 h-7 text-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Always Free</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-forest">Dream Board Wallpaper</h3>
                <p className="font-sans text-sm text-forest/60 mt-0.5">
                  Your personalized AI vision board, hand-crafted and delivered to your inbox within 24 hours.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 sm:flex-col sm:gap-2 sm:items-end">
              {['Personalized to your dreams', 'Phone & desktop sizes', 'In your inbox in 24 hrs'].map((b) => (
                <span key={b} className="flex items-center gap-1.5 font-sans text-xs text-forest/65">
                  <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" /> {b}
                </span>
              ))}
            </div>
            <Button variant="gold" size="lg" className="sm:self-center flex-shrink-0 px-8" asChild>
              <Link href="/create">Create Mine — Free</Link>
            </Button>
          </div>
        </motion.div>

        {/* Paid tiers — 3 column */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.id}
              variants={cardVariants}
              className={cn(
                'relative rounded-2xl border-2 p-6 flex flex-col gap-5 transition-all duration-300',
                tier.popular
                  ? 'border-sage shadow-lg shadow-sage/10 scale-[1.02] bg-white'
                  : 'border-sage/15 bg-white/70 hover:border-sage/35 hover:shadow-sm',
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="bg-sage text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}

              {tier.popular && <div className="pt-2" />}

              {/* Icon + name */}
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  tier.popular ? 'bg-sage-light' : 'bg-sage-light/60',
                )}>
                  <tier.Icon className="w-5 h-5 text-sage" />
                </div>
                <div>
                  {tier.badge && (
                    <p className="text-[10px] font-bold text-sage uppercase tracking-widest leading-none mb-0.5">
                      {tier.badge}
                    </p>
                  )}
                  <p className="font-sans font-semibold text-sm text-forest leading-tight">{tier.name}</p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-0.5">
                <span className="font-display text-4xl font-bold text-forest">{tier.price}</span>
                {tier.period && <span className="font-sans text-sm text-forest/50">{tier.period}</span>}
              </div>

              {/* Tagline */}
              <p className="font-sans text-xs text-forest/60 leading-relaxed">{tier.tagline}</p>

              {/* Bullets */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {tier.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-sage" />
                    </div>
                    <span className="font-sans text-xs text-forest/70">{b}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.popular ? 'gold' : 'outline'}
                className="w-full mt-auto"
                size="lg"
                asChild
              >
                <Link href="/create">{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center text-sm font-sans text-forest/45 mt-8"
        >
          Wallpaper is always free — no credit card required. Add upgrades any time during the flow.
        </motion.p>
      </div>
    </section>
  );
}
