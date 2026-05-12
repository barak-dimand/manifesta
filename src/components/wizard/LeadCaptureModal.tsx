'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LeadSchema, type LeadData } from '@/lib/validations/wizard';
import type { WizardState } from '@/hooks/use-wizard';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCaptured: () => void;
  wizardData: WizardState;
}

export function LeadCaptureModal({
  isOpen,
  onClose,
  onLeadCaptured,
  wizardData,
}: LeadCaptureModalProps) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LeadData>({
    resolver: zodResolver(LeadSchema),
  });

  const onSubmit = async (data: LeadData) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          source: 'wizard',
          wizardData: {
            selectedAreas: wizardData.selectedAreas,
            dreams: wizardData.dreams,
            style: wizardData.style,
            goals: wizardData.goals,
            manifesto: wizardData.manifesto,
            enableTimeline: wizardData.enableTimeline,
            photoCount: wizardData.photos.length,
            photoUrls: wizardData.photos.filter((p) => p.startsWith('http')),
            dreamPriorities: Object.keys(wizardData.dreamPriorities ?? {}).length
              ? wizardData.dreamPriorities
              : undefined,
          },
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Something went wrong');
      }

      reset();
      onLeadCaptured();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setServerError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-semibold text-forest">
            Save your dream board
          </DialogTitle>
          <DialogDescription className="font-sans text-forest/60 text-sm mt-1">
            Enter your email to save your board and set up daily reminders. No spam, only your
            dream life, delivered every morning.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-email" className="text-sm font-semibold text-forest/80">
              Email address
            </Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-sans">{errors.email.message}</p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-xs text-red-500 font-sans rounded-md bg-red-50 px-3 py-2 border border-red-200">
              {serverError}
            </p>
          )}

          {/* Manifesta preview (manifesto snippet) */}
          {wizardData.manifesto && (
            <div className="rounded-lg bg-sage-light/50 border border-sage/15 px-4 py-3">
              <p className="font-display italic text-sm text-forest/70 line-clamp-3">
                {wizardData.manifesto}
              </p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue →'}
          </Button>

          <p className="text-xs text-center text-forest/40 font-sans">
            By continuing you agree to our{' '}
            <a href="#" className="underline hover:text-forest/60">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-forest/60">
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
