'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Copy, Check, Sparkles, Image as ImageIcon, Download, Mail,
  LayoutDashboard, ExternalLink, Lock, X, ChevronLeft, ChevronRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useClerk } from '@clerk/nextjs';
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
  onReset: () => void;
}

interface SavedImage {
  id: string;
  imageUrl: string;
  manifesto: string | null;
  dreams: string | null;
  style: string | null;
  areas: string[] | null;
  mode: string | null;
  createdAt: string;
}

interface ImagesResponse {
  images: SavedImage[];
  usedToday: number;
  remaining: number;
  limit: number;
}

const DAILY_LIMIT = 3;

// Full-screen lightbox for viewing an image with all its context
function ImageLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: SavedImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const img = images[idx];
  if (!img) return null;

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(images.length - 1, i + 1));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-cream rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image */}
        <div className="relative flex-shrink-0 md:w-64 lg:w-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.imageUrl}
            alt="Generated wallpaper"
            className="w-full h-64 md:h-full object-cover"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button onClick={prev} disabled={idx === 0}
                className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-white text-xs font-mono bg-black/50 px-2 py-0.5 rounded-full">
                {idx + 1}/{images.length}
              </span>
              <button onClick={next} disabled={idx === images.length - 1}
                className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Context */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
          {img.manifesto && (
            <div>
              <p className="text-xs font-sans font-semibold text-sage uppercase tracking-wider mb-2">Manifesto</p>
              <blockquote className="font-display italic text-forest text-base md:text-lg leading-relaxed">
                {img.manifesto}
              </blockquote>
            </div>
          )}

          {img.dreams && (
            <div>
              <p className="text-xs font-sans font-semibold text-sage uppercase tracking-wider mb-2">Dream Life</p>
              <p className="font-sans text-sm text-forest/75 leading-relaxed">{img.dreams}</p>
            </div>
          )}

          {img.areas && img.areas.length > 0 && (
            <div>
              <p className="text-xs font-sans font-semibold text-sage uppercase tracking-wider mb-2">Life Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {img.areas.map((a) => (
                  <span key={a} className="px-2.5 py-0.5 rounded-full bg-sage-light text-sage text-xs font-sans font-medium capitalize">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {img.style && (
              <span className="px-2.5 py-0.5 rounded-full bg-gold-light text-forest text-xs font-sans font-medium capitalize border border-gold/20">
                {img.style} style
              </span>
            )}
            {img.mode && (
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-sans font-medium',
                img.mode === 'image-to-image'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-sage-light text-sage',
              )}>
                {img.mode === 'image-to-image' ? 'Personalized' : 'AI Generated'}
              </span>
            )}
            <span className="text-xs text-forest/40 ml-auto">
              {new Date(img.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="mt-auto pt-4 border-t border-sage/10">
            <a
              href={img.imageUrl}
              download="manifesta-wallpaper.png"
              className="inline-flex items-center gap-2 bg-gold text-forest font-sans text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gold/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Wallpaper
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Step4Output({ state, onReset }: Step4Props) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [billingRequired, setBillingRequired] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [usedToday, setUsedToday] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null); // null = loading
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const abortRef = useRef<AbortController | null>(null);

  const pendingGenerate = useRef(false);
  const pendingCollage = useRef(false);
  const generateRef = useRef<(() => Promise<void>) | null>(null);
  const collageRef = useRef<(() => void) | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const loadImages = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch('/api/user/images');
      const data = (await res.json()) as ImagesResponse;
      setSavedImages(data.images ?? []);
      setUsedToday(data.usedToday ?? 0);
      setRemaining(data.remaining ?? DAILY_LIMIT);
    } catch {
      setRemaining(DAILY_LIMIT);
    }
  }, [isSignedIn]);

  useEffect(() => { void loadImages(); }, [loadImages]);

  // Auto-fire after sign-in
  useEffect(() => {
    if (!isSignedIn) return;
    if (pendingGenerate.current) {
      pendingGenerate.current = false;
      void generateRef.current?.();
    }
    if (pendingCollage.current) {
      pendingCollage.current = false;
      collageRef.current?.();
    }
  }, [isSignedIn]);

  const copyManifesto = async () => {
    try {
      await navigator.clipboard.writeText(state.manifesto);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* fallback */ }
  };

  const generateAIWallpaper = async () => {
    if (isGenerating) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setGenerateError('');
    setBillingRequired(false);

    try {
      let referenceImageBase64: string | undefined;
      if (state.photos.length > 0) {
        try {
          const photoRes = await fetch(state.photos[0]);
          const blob = await photoRes.blob();
          referenceImageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch { /* fall back to text-only */ }
      }

      const res = await fetch('/api/wallpaper/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          dreams: state.dreams,
          style: state.style,
          areas: state.selectedAreas,
          manifesto: state.manifesto || undefined,
          boardId: state.boardId ?? undefined,
          referenceImageBase64,
        }),
      });

      const data = (await res.json()) as {
        imageUrl?: string;
        error?: string;
        remaining?: number;
        usedToday?: number;
      };

      if (res.status === 429) {
        setRemaining(0);
        setGenerateError("You've used all 3 generations for today. Come back tomorrow!");
        return;
      }
      if (res.status === 402) { setBillingRequired(true); return; }
      if (!res.ok) { setGenerateError('Could not generate wallpaper. Please try again.'); return; }

      if (!data.imageUrl) { setGenerateError('No image was returned. Please try again.'); return; }

      if (data.remaining !== undefined) setRemaining(data.remaining);
      if (data.usedToday !== undefined) setUsedToday(data.usedToday);

      // Update the board's featured wallpaper
      if (state.boardId) {
        fetch(`/api/boards/${state.boardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallpaperUrl: data.imageUrl }),
        }).catch(console.error);
      }

      // Refresh the gallery — the new image is now in the DB
      await loadImages();
      // Open lightbox on the newest image (index 0 after reload)
      setLightboxIndex(0);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setGenerateError('Could not generate wallpaper. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  generateRef.current = generateAIWallpaper;

  const createCollage = () => {
    if (state.photos.length === 0) return;
    // For collage, we just show the uploaded photo locally (no API call / rate limit)
    setLightboxIndex(null);
    // Push it into savedImages as a local preview (not saved to DB)
    setSavedImages((prev) => [
      {
        id: 'local-collage',
        imageUrl: state.photos[0],
        manifesto: state.manifesto || null,
        dreams: state.dreams || null,
        style: state.style || null,
        areas: state.selectedAreas,
        mode: 'collage',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setLightboxIndex(0);
  };
  collageRef.current = createCollage;

  const handleGenerateClick = () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      pendingGenerate.current = true;
      openSignIn();
      return;
    }
    void generateAIWallpaper();
  };

  const handleCollageClick = () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      pendingCollage.current = true;
      openSignIn();
      return;
    }
    createCollage();
  };

  const notSignedIn = isLoaded && !isSignedIn;
  const limitReached = remaining === 0;
  const todayImages = savedImages.filter((img) => {
    const created = new Date(img.createdAt).getTime();
    return Date.now() - created < 86_400_000;
  });

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
            variant="outline" size="sm" onClick={copyManifesto}
            className={cn('gap-1.5 text-xs transition-all', copied && 'border-sage text-sage bg-sage-light')}
          >
            {copied ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
          </Button>
        </div>
        <blockquote className="font-display italic text-lg md:text-xl text-forest leading-relaxed">
          {state.manifesto || 'Your manifesto will appear here once you complete the previous steps.'}
        </blockquote>
      </div>

      {/* Wallpaper section */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-forest">Generate Your Wallpaper</h2>
            <Badge variant="gold" className="text-xs">New</Badge>
          </div>
          {/* Daily usage indicator */}
          {isSignedIn && remaining !== null && (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all',
                    i < usedToday ? 'bg-sage' : 'bg-sage/20',
                  )}
                />
              ))}
              <span className="font-sans text-xs text-forest/50 ml-1">
                {remaining > 0
                  ? `${remaining} generation${remaining === 1 ? '' : 's'} left today`
                  : 'Limit reached for today'}
              </span>
            </div>
          )}
        </div>

        {/* Sign-in nudge */}
        {notSignedIn && (
          <div className="rounded-xl border border-gold/30 bg-gold-light/30 px-4 py-3 flex items-center gap-3 mb-4">
            <Lock className="w-4 h-4 text-gold flex-shrink-0" />
            <p className="font-sans text-sm text-forest/75">
              Sign in to generate your wallpaper — your board and images are saved automatically.
            </p>
          </div>
        )}

        {/* Daily limit reached */}
        {limitReached && isSignedIn && (
          <div className="rounded-xl border border-sage/20 bg-sage-light/20 px-4 py-4 mb-4 text-center">
            <p className="font-sans text-sm font-semibold text-forest mb-1">Daily limit reached</p>
            <p className="font-sans text-xs text-forest/60">
              You&apos;ve used all 3 generations for today. Your images are saved — check back tomorrow for more.
            </p>
            <Link href="/dashboard" className="inline-block mt-3">
              <Button variant="default" size="sm" className="gap-2">
                <LayoutDashboard className="w-3.5 h-3.5" />
                View All My Images
              </Button>
            </Link>
          </div>
        )}

        {/* Generation cards — hidden when limit reached */}
        {!limitReached && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AI Generated */}
            <div className="rounded-xl border border-sage/20 bg-cream p-5 flex flex-col gap-4 hover:border-sage/40 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-xl bg-gold-light flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-sans font-semibold text-sm text-forest mb-1">AI Generated</p>
                <p className="font-sans text-xs text-forest/55 leading-relaxed">
                  {state.photos.length > 0
                    ? 'Your uploaded photo will be used to place you as the main character in the scenes.'
                    : 'Create a unique AI vision board from your dreams and chosen style.'}
                </p>
                {state.photos.length > 0 && (
                  <p className="font-sans text-[10px] text-sage font-medium mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
                    Personalized mode — using your photo
                  </p>
                )}
              </div>
              <Button
                variant="gold" size="sm"
                onClick={handleGenerateClick}
                disabled={isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {state.photos.length > 0 ? 'Personalizing…' : 'Generating…'}</>
                ) : notSignedIn ? (
                  <><Lock className="w-3.5 h-3.5" />Sign in to Generate</>
                ) : (
                  state.photos.length > 0 ? 'Generate with My Photo' : 'Generate'
                )}
              </Button>
              {generateError && <p className="text-xs text-red-500 font-sans">{generateError}</p>}
              {billingRequired && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex flex-col gap-1.5">
                  <p className="font-sans text-xs font-semibold text-amber-800">Replicate billing required</p>
                  <p className="font-sans text-xs text-amber-700 leading-relaxed">
                    Add $5 of credits to your Replicate account to enable AI generation.
                  </p>
                  <a href="https://replicate.com/account/billing" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 w-fit">
                    Add credits <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* From Photos */}
            <div className={cn(
              'rounded-xl border p-5 flex flex-col gap-4 transition-all',
              state.photos.length > 0
                ? 'border-sage/20 bg-cream hover:border-sage/40 hover:shadow-sm'
                : 'border-sage/10 bg-sage-light/20 opacity-60',
            )}>
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
                variant="outline" size="sm"
                onClick={handleCollageClick}
                disabled={state.photos.length === 0}
                className="w-full gap-2"
              >
                {notSignedIn && state.photos.length > 0
                  ? <><Lock className="w-3.5 h-3.5" />Sign in to Create Collage</>
                  : 'Create Collage'}
              </Button>
            </div>
          </div>
        )}

        {/* Generating spinner */}
        {isGenerating && (
          <div className="rounded-xl border border-sage/20 bg-sage-light/30 p-10 flex flex-col items-center gap-4 mt-4">
            <div className="w-10 h-10 rounded-full border-2 border-sage/30 border-t-sage animate-spin" />
            <p className="font-sans text-sm text-forest/60">Creating your dream board visualization…</p>
          </div>
        )}
      </div>

      {/* Generated images gallery */}
      {savedImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-semibold text-forest">
              {todayImages.length > 0 ? "Today's Generations" : "Your Wallpapers"}
            </h2>
            {savedImages.length > 3 && (
              <Link href="/dashboard" className="font-sans text-xs text-sage hover:text-forest transition-colors">
                View all →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {savedImages.slice(0, 6).map((img, i) => (
              <button
                key={img.id}
                onClick={() => setLightboxIndex(i)}
                className="group relative rounded-xl overflow-hidden border border-sage/20 hover:border-sage/50 hover:shadow-md transition-all aspect-[9/16]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt="Generated wallpaper"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-forest/0 group-hover:bg-forest/20 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
                  <p className="font-sans text-[9px] text-white font-medium truncate">
                    {new Date(img.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                {/* "New" badge on the most recent one */}
                {i === 0 && usedToday > 0 && Date.now() - new Date(img.createdAt).getTime() < 120_000 && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-gold text-forest text-[9px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="font-sans text-xs text-forest/40 mt-2 text-center">
            Click any image to view with full context
          </p>
        </div>
      )}

      {/* Start New Board CTA */}
      {savedImages.length > 0 && (
        <div className="rounded-2xl border border-sage/20 bg-sage-light/20 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-sage flex-shrink-0" />
            <div>
              <p className="font-sans font-semibold text-sm text-forest">Done for now?</p>
              <p className="font-sans text-xs text-forest/55">
                Your wallpapers are saved. Start a fresh board whenever you&apos;re ready.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button variant="default" className="w-full gap-2">
                <LayoutDashboard className="w-4 h-4" />
                My Dashboard
              </Button>
            </Link>
            {!showResetConfirm ? (
              <Button variant="outline" onClick={() => setShowResetConfirm(true)} className="gap-2">
                New Board
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={onReset}
                >
                  Yes, reset
                </Button>
                <Button variant="ghost" className="text-xs" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily email section */}
      <div className="rounded-2xl border border-sage/20 bg-cream p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-light flex items-center justify-center">
            <Mail className="w-5 h-5 text-sage" />
          </div>
          <div>
            <p className="font-sans font-semibold text-sm text-forest">Wake up to your dream life every morning</p>
            <p className="font-sans text-xs text-forest/55">A personalized email with your affirmations and habits</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button" role="switch" aria-checked={emailOptIn}
            onClick={() => setEmailOptIn((v) => !v)}
            className={cn('relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              emailOptIn ? 'bg-sage' : 'bg-sage/20')}
          >
            <span className={cn('pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
              emailOptIn ? 'translate-x-4' : 'translate-x-0')} />
          </button>
          <span className="font-sans text-sm text-forest/70">Send me a daily morning email</span>
        </div>
        <Button variant="default" className="w-full" disabled={!emailOptIn} onClick={() => setLeadModalOpen(true)}>
          Set Up Daily Email
        </Button>
      </div>

      {/* Board save state */}
      {isLoaded && (
        isSignedIn ? (
          <div className="rounded-2xl border border-sage/30 bg-sage-light/30 p-6 text-center">
            {state.boardId ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-sage" />
                  <p className="font-display text-xl font-semibold text-forest">Board saved!</p>
                </div>
                <p className="font-sans text-sm text-forest/65 mb-4">Your dream board is saved to your account.</p>
                <Link href="/dashboard">
                  <Button variant="default" className="gap-2 px-8">
                    <LayoutDashboard className="w-4 h-4" />View Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-sage/30 border-t-sage animate-spin" />
                <p className="font-sans text-sm font-medium text-forest/70">Saving your board…</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gold/30 bg-gold-light/40 p-6 text-center">
            <p className="font-display text-xl font-semibold text-forest mb-2">
              Save your board &amp; get daily emails
            </p>
            <p className="font-sans text-sm text-forest/65 mb-4">
              Create a free account to save your dream board, access it anytime, and receive daily morning reminders.
            </p>
            <Button variant="gold" className="w-full sm:w-auto px-8" onClick={() => setLeadModalOpen(true)}>
              Save My Dream Board
            </Button>
          </div>
        )
      )}

      {/* Lead capture modal */}
      <LeadCaptureModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onLeadCaptured={() => setLeadModalOpen(false)}
        wizardData={state}
      />

      {/* Image lightbox */}
      {lightboxIndex !== null && savedImages.length > 0 && (
        <ImageLightbox
          images={savedImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
