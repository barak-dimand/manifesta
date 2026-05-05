'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Link2, Trash2, Check } from 'lucide-react';
import type { GeneratedWallpaper } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

export function WallpaperCard({ image }: { image: GeneratedWallpaper }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const date = image.createdAt
    ? new Date(image.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const isPersonalized = image.mode === 'image-to-image';

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(image.imageUrl);
    } catch {
      prompt('Copy image URL:', image.imageUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await fetch(`/api/wallpapers/${image.id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-sage/20 bg-white/70 overflow-hidden hover:border-sage/40 hover:shadow-md transition-all flex flex-col group">
      {/* Image */}
      <div className="relative overflow-hidden bg-sage-light/20" style={{ aspectRatio: '9/16', maxHeight: 320 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.imageUrl}
          alt="Generated wallpaper"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Mode badge */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
            isPersonalized ? 'bg-purple-900/80 text-purple-200' : 'bg-forest/70 text-white',
          )}>
            {isPersonalized ? 'Personalized' : 'AI Generated'}
          </span>
        </div>
        {/* Download on hover */}
        <div className="absolute inset-0 bg-forest/0 group-hover:bg-forest/10 transition-colors" />
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={image.imageUrl}
            download="manifesta-wallpaper.png"
            className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
            title="Download wallpaper"
          >
            <Download className="w-3.5 h-3.5 text-forest" />
          </a>
        </div>
      </div>

      {/* Context */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {image.manifesto && (
          <blockquote className="font-display italic text-forest text-sm leading-relaxed line-clamp-3">
            {image.manifesto}
          </blockquote>
        )}
        {image.dreams && (
          <p className="font-sans text-xs text-forest/60 leading-relaxed line-clamp-2">{image.dreams}</p>
        )}
        {image.areas && image.areas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {image.areas.map((a) => (
              <span key={a} className="px-2 py-0.5 rounded-full bg-sage-light text-sage text-[10px] font-sans font-medium capitalize">
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-sage/10">
          <div className="flex items-center gap-2">
            {date && <span className="font-sans text-xs text-forest/40">{date}</span>}
            {image.style && <span className="font-sans text-xs text-forest/40 capitalize">{image.style}</span>}
          </div>

          {/* Actions */}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-forest/60">Delete?</span>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="font-sans text-xs font-semibold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="font-sans text-xs text-forest/50 hover:text-forest transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleShare()}
                title="Copy image URL"
                className={cn('transition-colors', copied ? 'text-sage' : 'text-forest/40 hover:text-sage')}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              </button>
              <a
                href={image.imageUrl}
                download="manifesta-wallpaper.png"
                title="Download"
                className="text-forest/40 hover:text-sage transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Delete"
                className="text-forest/40 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
