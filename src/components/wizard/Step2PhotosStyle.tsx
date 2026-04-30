'use client';

import { useRef } from 'react';
import { Upload, X, Check } from 'lucide-react';
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
  subtitle: string;
  gradient: string;
  textColor: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    subtitle: 'Clean & Serene',
    gradient: 'linear-gradient(135deg, hsl(150,18%,92%) 0%, hsl(150,22%,82%) 100%)',
    textColor: 'hsl(160,28%,14%)',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    subtitle: 'Bold & Energetic',
    gradient: 'linear-gradient(135deg, hsl(43,65%,58%) 0%, hsl(25,80%,55%) 100%)',
    textColor: 'hsl(160,28%,14%)',
  },
  {
    id: 'ethereal',
    name: 'Ethereal',
    subtitle: 'Dreamy & Soft',
    gradient: 'linear-gradient(135deg, hsl(220,60%,88%) 0%, hsl(280,45%,80%) 100%)',
    textColor: 'hsl(240,30%,25%)',
  },
  {
    id: 'luxe',
    name: 'Luxe',
    subtitle: 'Rich & Elegant',
    gradient: 'linear-gradient(135deg, hsl(43,65%,58%) 0%, hsl(160,28%,14%) 100%)',
    textColor: 'white',
  },
];

export function Step2PhotosStyle({ state, update, next }: Step2Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_PHOTOS - state.photos.length;
    const toAdd = files.slice(0, remaining);
    const newUrls = toAdd.map((f) => URL.createObjectURL(f));
    update({ photos: [...state.photos, ...newUrls] });
    // reset so same file can be re-selected
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const updated = state.photos.filter((_, i) => i !== index);
    update({ photos: updated });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    const remaining = MAX_PHOTOS - state.photos.length;
    const toAdd = files.slice(0, remaining);
    const newUrls = toAdd.map((f) => URL.createObjectURL(f));
    update({ photos: [...state.photos, ...newUrls] });
  };

  const canAddMore = state.photos.length < MAX_PHOTOS;

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-2">
          Set the mood for your board
        </h1>
        <p className="font-sans text-forest/60 text-base">
          Add personal photos and choose the aesthetic that resonates with your vision.
        </p>
      </div>

      {/* Photo upload */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm font-semibold text-forest/80">
          Add your photos{' '}
          <span className="text-forest/40 font-normal">
            (optional, up to {MAX_PHOTOS})
          </span>
        </Label>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Drop zone */}
        {canAddMore && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-sage/25 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-sage/50 hover:bg-sage-light/20 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-sage-light flex items-center justify-center">
              <Upload className="w-5 h-5 text-sage" />
            </div>
            <div className="text-center">
              <p className="font-sans text-sm font-medium text-forest/70">
                Drop photos here or{' '}
                <span className="text-sage underline underline-offset-2">click to upload</span>
              </p>
              <p className="font-sans text-xs text-forest/40 mt-1">
                {state.photos.length}/{MAX_PHOTOS} photos added
              </p>
            </div>
          </div>
        )}

        {/* Photo thumbnails */}
        {state.photos.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {state.photos.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Upload ${i + 1}`}
                  className="w-full h-full object-cover"
                />
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

      {/* Style selection */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm font-semibold text-forest/80">Choose your aesthetic</Label>
        <div className="grid grid-cols-2 gap-4">
          {STYLE_OPTIONS.map((option) => {
            const selected = state.style === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => update({ style: option.id })}
                className={cn(
                  'relative rounded-xl overflow-hidden h-28 cursor-pointer transition-all duration-200',
                  selected
                    ? 'ring-2 ring-sage ring-offset-2 shadow-md'
                    : 'ring-1 ring-sage/20 hover:ring-sage/40',
                )}
                style={{ background: option.gradient }}
              >
                {/* Checkmark */}
                {selected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-sage flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <p
                    className="font-display font-semibold text-base leading-none"
                    style={{ color: option.textColor }}
                  >
                    {option.name}
                  </p>
                  <p
                    className="font-sans text-xs mt-0.5 opacity-70"
                    style={{ color: option.textColor }}
                  >
                    {option.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Button
        variant="gold"
        size="lg"
        className="w-full text-base"
        onClick={next}
      >
        Next: Goals →
      </Button>
    </div>
  );
}
