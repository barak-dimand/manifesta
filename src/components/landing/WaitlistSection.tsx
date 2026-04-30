'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/landing/CountdownTimer';
import { LeadSchema, type LeadData } from '@/lib/validations/wizard';

export function WaitlistSection() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadData>({
    resolver: zodResolver(LeadSchema),
  });

  const onSubmit = async (data: LeadData) => {
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, source: 'waitlist' }),
      });
      setSuccess(true);
    } catch {
      // show success anyway to avoid blocking UX
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="waitlist"
      className="py-28"
      style={{ background: 'var(--background-gradient-sage)' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <Badge
            className="bg-gold/20 border border-gold/40 text-gold text-xs font-semibold px-4 py-1.5 gap-1.5"
          >
            🚀 Launching Soon
          </Badge>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-display text-4xl md:text-5xl font-semibold text-white mb-5"
        >
          Be First to Manifest
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-white/60 font-sans text-lg mb-10 max-w-lg mx-auto"
        >
          Join the waitlist and get early access, a founding member discount, and the chance to
          shape what Manifesta becomes.
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <CountdownTimer />
        </motion.div>

        {/* Form / Success */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-gold" />
              </div>
              <p className="font-display text-2xl text-white font-medium">
                You&apos;re in!
              </p>
              <p className="text-white/60 font-sans text-base">
                We&apos;ll notify you at launch. Get ready to manifest.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-gold focus-visible:border-gold"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-gold text-xs mt-1.5 text-left">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="h-12 px-8 whitespace-nowrap"
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Social proof */}
        {!success && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-white/40 font-sans text-sm mt-6"
          >
            847 dreamers already waiting
          </motion.p>
        )}
      </div>
    </section>
  );
}
