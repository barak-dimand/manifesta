'use client';

import Link from 'next/link';
import { Pencil, Share2, Check, Clock } from 'lucide-react';
import { useState } from 'react';
import type { Board } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

const STYLE_GRADIENTS: Record<string, string> = {
  minimal: 'from-sage-light via-cream to-cream',
  bold: 'from-forest/10 via-gold/10 to-cream',
  dreamy: 'from-purple-50 via-pink-50 to-cream',
  romantic: 'from-rose-50 via-pink-50 to-cream',
  adventurous: 'from-amber-50 via-orange-50 to-cream',
  luxurious: 'from-yellow-50 via-gold/10 to-cream',
};

export function DreamBoardHero({ board }: { board: Board }) {
  const [copied, setCopied] = useState(false);

  const gradient = STYLE_GRADIENTS[board.style] ?? STYLE_GRADIENTS['minimal'];

  const date = board.createdAt
    ? new Date(board.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const handleShare = async () => {
    const url = `${window.location.origin}/share/${board.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      prompt('Copy this link:', url);
    }
    analytics.boardShared();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-sage/20 shadow-sm">
      {/* Hero image or gradient */}
      {board.wallpaperUrl ? (
        <div className="relative h-56 sm:h-72 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={board.wallpaperUrl}
            alt="Your dream board"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {board.selectedAreas.map((area) => (
                <span key={area} className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-sans font-medium capitalize border border-white/20">
                  {area}
                </span>
              ))}
            </div>
            <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-sans font-medium border border-white/20 capitalize">
              {board.style}
            </span>
          </div>
        </div>
      ) : (
        <div className={cn('relative h-40 sm:h-52 bg-gradient-to-br flex flex-col justify-end p-5', gradient)}>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {board.selectedAreas.map((area) => (
              <span key={area} className="px-2.5 py-0.5 rounded-full bg-sage-light text-sage text-xs font-sans font-medium capitalize">
                {area}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-sans text-xs text-forest/50">
              <Clock className="w-3 h-3" />
              Wallpaper arriving within 5 days
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white/70 p-5 flex flex-col gap-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-sans text-[10px] font-semibold text-sage/70 uppercase tracking-wider mb-1">Your Dream Board</p>
            <p className="font-sans text-sm font-semibold text-forest">
              {board.name ?? board.selectedAreas.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(' · ')}
            </p>
            {date && <p className="font-sans text-xs text-forest/40 mt-0.5">Created {date}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => void handleShare()}
              title="Copy share link"
              className={cn('p-2 rounded-lg transition-colors', copied ? 'text-sage bg-sage-light' : 'text-forest/40 hover:text-sage hover:bg-sage-light')}
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </button>
            <Link
              href={`/create?boardId=${board.id}`}
              onClick={() => analytics.boardEdited()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sage/30 text-sage hover:bg-sage-light hover:border-sage transition-colors font-sans text-xs font-semibold"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </Link>
          </div>
        </div>

        {/* Dreams snippet */}
        {board.dreams && (
          <p className="font-display italic text-forest/70 text-sm leading-relaxed line-clamp-3">
            &ldquo;{board.dreams}&rdquo;
          </p>
        )}

        {/* Manifesto snippet */}
        {board.manifesto && (
          <p className="font-sans text-xs text-forest/50 leading-relaxed line-clamp-2 border-t border-sage/10 pt-3">
            {board.manifesto}
          </p>
        )}
      </div>
    </div>
  );
}
