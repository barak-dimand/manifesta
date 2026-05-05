'use client';

import { useRef, useState } from 'react';
import { Upload, X, Eye, ChevronLeft, ChevronRight, UserRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { WizardState } from '@/hooks/use-wizard';
import type { AestheticStyle } from '@/lib/validations/wizard';
import { cn } from '@/lib/utils';

interface Step2Props {
  state: WizardState;
  update: (updates: Partial<WizardState>) => void;
  next: () => void;
  prev: () => void;
}

const MAX_PHOTOS = 5;

interface StyleOption {
  id: AestheticStyle;
  name: string;
  description: string;
  image: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'minimal',
    name: 'Clean & Minimal',
    description: 'Soft tones, lots of white space, serene compositions',
    image: '/images/style-minimal.jpg',
  },
  {
    id: 'vibrant',
    name: 'Bold & Vibrant',
    description: 'Rich colors, high energy, dynamic collage layouts',
    image: '/images/style-vibrant.jpg',
  },
  {
    id: 'ethereal',
    name: 'Ethereal & Dreamy',
    description: 'Pastels, soft light, magical and whimsical',
    image: '/images/style-ethereal.jpg',
  },
  {
    id: 'luxe',
    name: 'Luxe & Elevated',
    description: 'Gold accents, marble textures, refined elegance',
    image: '/images/style-luxe.jpg',
  },
];

const EXAMPLE_BOARDS = [
  { image: '/images/example-board-1.jpg', caption: 'Wellness & Ocean Living Board' },
  { image: '/images/example-board-2.jpg', caption: 'Career Success & Abundance Board' },
];

const GENDER_OPTIONS: { value: WizardState['gender']; label: string; emoji: string }[] = [
  { value: 'female', label: 'Female', emoji: '👩' },
  { value: 'male', label: 'Male', emoji: '👨' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', emoji: '✨' },
];

export function Step2PhotosStyle({ state, update, next }: Step2Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFiles = async (files: File[]) => {
    const remaining = MAX_PHOTOS - state.photos.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) return;
    setUploading(true);
    setUploadError(null);

    let storageUnavailable = false;
    const results = await Promise.all(
      toUpload.map(async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        try {
          const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
          if (res.status === 503) { storageUnavailable = true; return null; }
          if (!res.ok) return null;
          const data = await res.json() as { url?: string };
          return data.url ?? null;
        } catch {
          return null;
        }
      }),
    );

    const uploaded = results.filter((u): u is string => u !== null);
    if (uploaded.length > 0) update({ photos: [...state.photos, ...uploaded] });

    if (storageUnavailable) {
      setUploadError('Photo storage is not configured — you can continue without a photo.');
    } else if (uploaded.length < toUpload.length) {
      setUploadError(
        uploaded.length === 0
          ? 'Photos failed to upload — please try again.'
          : `${toUpload.length - uploaded.length} photo(s) failed to upload.`,
      );
    }
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    void uploadFiles(files);
  };

  const removePhoto = (index: number) => {
    update({ photos: state.photos.filter((_, i) => i !== index) });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    void uploadFiles(files);
  };

  const canAddMore = state.photos.length < MAX_PHOTOS && !uploading;
  const hasPhotos = state.photos.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-2">
          Make it yours
        </h1>
        <p className="font-sans text-forest/60 text-base">
          Personalize your vision board with your own face and the aesthetic that resonates with your dream life.
        </p>
      </div>

      {/* Photo upload */}
      <div className="flex flex-col gap-3">
        {/* Section header with clear callout */}
        <div className="flex items-start justify-between">
          <Label className="text-sm font-semibold text-forest/80">
            Your photos{' '}
            <span className="text-forest/40 font-normal">(optional, up to {MAX_PHOTOS})</span>
          </Label>
        </div>

        {/* Feature callout */}
        <div className="rounded-xl bg-gold/10 border border-gold/25 px-4 py-3 flex items-start gap-3">
          <span className="text-xl mt-0.5">🪞</span>
          <div>
            <p className="font-sans text-sm font-semibold text-forest">
              See yourself in your dream life
            </p>
            <p className="font-sans text-xs text-forest/60 mt-0.5 leading-relaxed">
              Upload photos of <strong>yourself</strong> and our AI will place you inside the vision board — living your dream life as if it&apos;s already real.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          data-testid="photo-file-input"
          onChange={handleFileChange}
        />

        {(canAddMore || uploading) && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 transition-all duration-200',
              uploading
                ? 'border-sage/40 bg-sage-light/10 cursor-default'
                : 'border-gold/30 cursor-pointer hover:border-gold/60 hover:bg-gold/5',
            )}
          >
            {uploading ? (
              <>
                <div className="w-10 h-10 rounded-full bg-sage-light flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-sage/30 border-t-sage animate-spin" />
                </div>
                <p className="font-sans text-sm font-medium text-forest/50">Uploading…</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-gold" />
                </div>
                <div className="text-center">
                  <p className="font-sans text-sm font-semibold text-forest/80">
                    Upload photos of yourself
                  </p>
                  <p className="font-sans text-xs text-forest/50 mt-1">
                    Drop here or{' '}
                    <span className="text-sage underline underline-offset-2">click to browse</span>
                    {' '}· face photos work best · {state.photos.length}/{MAX_PHOTOS} added
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-red-500 font-sans">{uploadError}</p>
        )}

        {hasPhotos && (
          <div className="flex flex-wrap gap-3">
            {state.photos.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-forest/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-forest"
                  aria-label="Remove photo"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gender picker — shown when no photos uploaded */}
      <AnimatePresence>
        {!hasPhotos && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <UserRound className="w-4 h-4 text-forest/50" />
              <Label className="text-sm font-semibold text-forest/80">
                How should we portray you?{' '}
                <span className="text-forest/40 font-normal">(optional)</span>
              </Label>
            </div>
            <p className="font-sans text-xs text-forest/50 -mt-1">
              Since you haven&apos;t uploaded a photo, this helps us generate imagery that feels like you.
            </p>
            <div className="flex gap-2 flex-wrap">
              {GENDER_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ gender: state.gender === value ? null : value })}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-sans text-sm font-medium transition-all duration-200',
                    state.gender === value
                      ? 'border-sage bg-sage-light text-forest shadow-sm'
                      : 'border-sage/20 text-forest/70 hover:border-sage/40 hover:bg-sage-light/30',
                  )}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Style selection */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm font-semibold text-forest/80">Choose your aesthetic</Label>
        <div className="grid grid-cols-2 gap-4">
          {STYLE_OPTIONS.map((option) => {
            const selected = state.style === option.id;
            return (
              <motion.button
                key={option.id}
                type="button"
                data-testid={`style-${option.id}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => update({ style: option.id })}
                className={cn(
                  'relative rounded-xl overflow-hidden border-2 text-left group transition-all duration-300',
                  selected
                    ? 'border-sage shadow-lg ring-2 ring-sage/20'
                    : 'border-sage/20 hover:border-sage/40',
                )}
              >
                <div className="relative h-36 sm:h-44 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={option.image}
                    alt={option.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/40 to-transparent" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(option.image); }}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Preview"
                  >
                    <Eye className="h-3.5 w-3.5 text-forest" />
                  </button>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-sage flex items-center justify-center shadow-md"
                    >
                      <span className="text-white text-xs font-bold">✓</span>
                    </motion.div>
                  )}
                </div>
                <div className="p-3 bg-cream">
                  <p className="font-sans text-sm font-semibold text-forest">{option.name}</p>
                  <p className="font-sans text-xs text-forest/55 leading-relaxed mt-0.5">
                    {option.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Example boards carousel */}
      <div className="flex flex-col gap-3">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-forest">See what you&apos;ll create</p>
          <p className="font-sans text-xs text-forest/50 mt-0.5">Real examples of AI-generated dream boards</p>
        </div>
        <div className="relative rounded-xl overflow-hidden border border-sage/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={exampleIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={EXAMPLE_BOARDS[exampleIndex].image}
                alt={EXAMPLE_BOARDS[exampleIndex].caption}
                className="w-full h-56 sm:h-72 object-cover cursor-pointer"
                onClick={() => setPreviewImage(EXAMPLE_BOARDS[exampleIndex].image)}
              />
            </motion.div>
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setExampleIndex((i) => (i - 1 + EXAMPLE_BOARDS.length) % EXAMPLE_BOARDS.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <ChevronLeft className="h-4 w-4 text-forest" />
          </button>
          <button
            type="button"
            onClick={() => setExampleIndex((i) => (i + 1) % EXAMPLE_BOARDS.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <ChevronRight className="h-4 w-4 text-forest" />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-forest/60 to-transparent p-4">
            <p className="font-sans text-sm text-white font-medium">
              {EXAMPLE_BOARDS[exampleIndex].caption}
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-2">
          {EXAMPLE_BOARDS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setExampleIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === exampleIndex ? 'w-6 bg-sage' : 'w-3 bg-sage/20',
              )}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <Button variant="gold" size="lg" className="w-full text-base" onClick={next} data-testid="step2-next">
        Next: Your Quotes →
      </Button>

      {/* Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-forest/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setPreviewImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
