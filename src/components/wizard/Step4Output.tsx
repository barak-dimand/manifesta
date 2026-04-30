'use client';

import { useState } from 'react';
import { Copy, Check, Sparkles, Image as ImageIcon, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LeadCaptureModal } from '@/components/wizard/LeadCaptureModal';
import type { WizardState } from '@/hooks/use-wizard';
import { cn } from '@/lib/utils';

interface Step4Props {
  state: WizardState;
  update: (updates: Partial<WizardState>) => void;
  next: () => void;
  prev: () => void;
}

export function Step4Output({ state }: Step4Props) {
  const [copied, setCopied] = useState(false);
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  const copyManifesto = async () => {
    try {
      await navigator.clipboard.writeText(state.manifesto);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const generateAIWallpaper = async () => {
    setIsGenerating(true);
    setGenerateError('');
    try {
      const res = await fetch('/api/wallpaper/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreams: state.dreams,
          style: state.style,
          areas: state.selectedAreas,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = (await res.json()) as { url?: string; imageUrl?: string };
      const url = data.url ?? data.imageUrl ?? null;
      if (!url) throw new Error('No image returned');
      setWallpaperUrl(url);
    } catch {
      setGenerateError('Could not generate wallpaper. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createCollage = () => {
    if (state.photos.length > 0) {
      setWallpaperUrl(state.photos[0]);
    }
  };

  const downloadWallpaper = () => {
    if (!wallpaperUrl) return;
    const a = document.createElement('a');
    a.href = wallpaperUrl;
    a.download = 'manifesta-wallpaper.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-2">
          Your Dream Life Board
        </h1>
        <p className="font-sans text-forest/60 text-base">
          Your personalized manifesto and wallpaper are ready.
        </p>
      </div>

      {/* Manifesto card */}
      <div className="rounded-2xl border-2 border-sage/30 bg-sage-light/30 p-6 relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sage flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-sans text-sm font-semibold text-sage uppercase tracking-wider">
              Your Manifesto
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyManifesto}
            className={cn(
              'gap-1.5 text-xs transition-all',
              copied && 'border-sage text-sage bg-sage-light',
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </Button>
        </div>
        <blockquote className="font-display italic text-lg md:text-xl text-forest leading-relaxed">
          {state.manifesto ||
            'Your manifesto will appear here once you complete the previous steps.'}
        </blockquote>
      </div>

      {/* Wallpaper section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display text-xl font-semibold text-forest">
            Generate Your Wallpaper
          </h2>
          <Badge variant="gold" className="text-xs">New</Badge>
        </div>

        {/* Wallpaper option cards */}
        {!wallpaperUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AI Generated */}
            <div className="rounded-xl border border-sage/20 bg-cream p-5 flex flex-col gap-4 hover:border-sage/40 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-xl bg-gold-light flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-sans font-semibold text-sm text-forest mb-1">AI Generated</p>
                <p className="font-sans text-xs text-forest/55 leading-relaxed">
                  Create a unique AI visualization from your dreams and chosen style.
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={generateAIWallpaper}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
              {generateError && (
                <p className="text-xs text-red-500 font-sans">{generateError}</p>
              )}
            </div>

            {/* From Photos */}
            <div
              className={cn(
                'rounded-xl border p-5 flex flex-col gap-4 transition-all',
                state.photos.length > 0
                  ? 'border-sage/20 bg-cream hover:border-sage/40 hover:shadow-sm'
                  : 'border-sage/10 bg-sage-light/20 opacity-60',
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-sage-light flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-sage" />
              </div>
              <div>
                <p className="font-sans font-semibold text-sm text-forest mb-1">From My Photos</p>
                <p className="font-sans text-xs text-forest/55 leading-relaxed">
                  {state.photos.length > 0
                    ? 'Create a collage from your uploaded photos.'
                    : 'Upload photos in step 2 to use this option.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={createCollage}
                disabled={state.photos.length === 0}
                className="w-full"
              >
                Create Collage
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isGenerating && (
          <div className="rounded-xl border border-sage/20 bg-sage-light/30 p-10 flex flex-col items-center gap-4 mt-4">
            <div className="w-10 h-10 rounded-full border-2 border-sage/30 border-t-sage animate-spin" />
            <p className="font-sans text-sm text-forest/60">
              Creating your dream board visualization…
            </p>
          </div>
        )}

        {/* Generated wallpaper preview */}
        {wallpaperUrl && !isGenerating && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="relative rounded-xl overflow-hidden border border-sage/20 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wallpaperUrl}
                alt="Your dream board wallpaper"
                className="w-full max-h-[480px] object-cover"
              />
              {/* Manifesto overlay for collage */}
              {state.photos.includes(wallpaperUrl) && (
                <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-forest/70 to-transparent">
                  <p className="font-display italic text-white text-lg leading-relaxed line-clamp-4">
                    {state.manifesto}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="gold"
                className="flex-1 gap-2"
                onClick={downloadWallpaper}
              >
                <Download className="w-4 h-4" />
                Download Wallpaper
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => setWallpaperUrl(null)}
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Daily email section */}
      <div className="rounded-2xl border border-sage/20 bg-cream p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-light flex items-center justify-center">
            <Mail className="w-5 h-5 text-sage" />
          </div>
          <div>
            <p className="font-sans font-semibold text-sm text-forest">
              Wake up to your dream life every morning
            </p>
            <p className="font-sans text-xs text-forest/55">
              A personalized email with your affirmations and habits
            </p>
          </div>
        </div>

        {/* Email opt-in toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={emailOptIn}
            onClick={() => setEmailOptIn((v) => !v)}
            className={cn(
              'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              emailOptIn ? 'bg-sage' : 'bg-sage/20',
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
                emailOptIn ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </button>
          <span className="font-sans text-sm text-forest/70">
            Send me a daily morning email
          </span>
        </div>

        <Button
          variant="default"
          className="w-full"
          disabled={!emailOptIn}
          onClick={() => setLeadModalOpen(true)}
        >
          Set Up Daily Email
        </Button>
      </div>

      {/* Sign-in prompt */}
      <div className="rounded-2xl border border-gold/30 bg-gold-light/40 p-6 text-center">
        <p className="font-display text-xl font-semibold text-forest mb-2">
          Save your board &amp; get daily emails
        </p>
        <p className="font-sans text-sm text-forest/65 mb-4">
          Create a free account to save your dream board, access it anytime, and receive daily
          morning reminders.
        </p>
        <Button variant="gold" className="w-full sm:w-auto px-8" onClick={() => setLeadModalOpen(true)}>
          Save My Dream Board
        </Button>
      </div>

      {/* Lead capture modal */}
      <LeadCaptureModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onLeadCaptured={() => setLeadModalOpen(false)}
        wizardData={state}
      />
    </div>
  );
}
