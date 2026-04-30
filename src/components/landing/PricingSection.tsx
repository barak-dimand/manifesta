'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaVariant: 'outline' | 'gold' | 'default';
  popular?: boolean;
  highlighted?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Dreamer',
    price: 'Free',
    description: 'Start your manifestation journey at no cost.',
    features: [
      'Dream board creation',
      '1 personal manifesto',
      'Basic phone wallpaper',
      'Goal & habit tracker',
    ],
    cta: 'Get Started Free',
    ctaVariant: 'outline',
    popular: false,
  },
  {
    name: 'Manifester',
    price: '$9',
    period: '/month',
    description: 'The complete daily manifestation system.',
    features: [
      'Everything in Dreamer',
      'Daily email reminders',
      'AI-generated wallpaper',
      'Unlimited dream boards',
      'Priority AI generation',
      'Board history & archives',
    ],
    cta: 'Start Manifesting',
    ctaVariant: 'gold',
    popular: true,
    highlighted: true,
  },
  {
    name: 'Visionary',
    price: '$29',
    period: '/month',
    description: 'For those who are fully committed to their vision.',
    features: [
      'Everything in Manifester',
      'Custom domain vision page',
      'Print-quality export',
      '1:1 onboarding call',
      'White-label exports',
      'Early access to new features',
    ],
    cta: 'Go Visionary',
    ctaVariant: 'default',
    popular: false,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-sans font-semibold text-sage uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-forest font-semibold">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-forest/60 font-sans text-lg max-w-xl mx-auto">
            Start free. Upgrade when you&apos;re ready to go deeper.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
        >
          {tiers.map((tier, i) => (
            <motion.div key={i} variants={cardVariants}>
              <Card
                className={cn(
                  'relative transition-all duration-300',
                  tier.highlighted
                    ? 'border-2 border-sage shadow-lg shadow-sage/10 scale-[1.02]'
                    : 'border border-sage/15 hover:border-sage/30',
                )}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge variant="gold" className="px-4 py-1 text-xs font-semibold shadow-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className={cn('pb-4', tier.popular && 'pt-8')}>
                  <p className="font-sans text-xs font-semibold text-sage uppercase tracking-widest mb-1">
                    {tier.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <CardTitle className="text-4xl font-display font-bold text-forest">
                      {tier.price}
                    </CardTitle>
                    {tier.period && (
                      <span className="text-sm font-sans text-forest/50">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-forest/60 mt-1">{tier.description}</p>
                </CardHeader>

                <CardContent className="flex flex-col gap-5">
                  {/* Features list */}
                  <ul className="flex flex-col gap-3">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-sage" />
                        </div>
                        <span className="text-sm font-sans text-forest/75">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  <Button
                    variant={tier.ctaVariant}
                    className="w-full mt-2"
                    size="lg"
                    asChild
                  >
                    <Link href="/create">{tier.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center text-sm font-sans text-forest/50 mt-8"
        >
          No credit card required for free tier. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}
