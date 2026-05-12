'use client';

import { useState } from 'react';
import { Heart, Copy, Check, Pencil, Lock, X } from 'lucide-react';
import type { Board } from '@/lib/db/schema';
import { buildManifestoDocument } from '@/lib/manifesto';
import { cn } from '@/lib/utils';

interface Props {
  board: Board;
  isPaid: boolean;
}

export function ManifestoCard({ board, isPaid }: Props) {
  const generated = buildManifestoDocument({
    dreams: board.dreams,
    selectedAreas: board.selectedAreas,
    style: board.style,
    goals: board.goals as Array<{ area: string; objective: string; habit: string }> | undefined,
    selectedQuotes: board.selectedQuotes,
    customQuotes: board.customQuotes,
    explorerData: board.explorerData,
    photoUrls: board.photoUrls,
  });

  const displayText = (board.manifesto as string | null) ?? generated;

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showLockHint, setShowLockHint] = useState(false);
  const [text, setText] = useState(displayText);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleCopy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditClick = () => {
    if (!isPaid) {
      setShowLockHint(true);
      setTimeout(() => setShowLockHint(false), 3000);
      return;
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setText(displayText);
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedAreas: board.selectedAreas,
          dreams: board.dreams,
          style: board.style,
          goals: board.goals ?? [],
          manifesto: text,
          enableTimeline: board.enableTimeline ?? false,
          photoUrls: board.photoUrls ?? [],
          explorerData: board.explorerData,
          selectedOffers: board.selectedOffers ?? ['wallpaper'],
          selectedQuotes: board.selectedQuotes ?? [],
          customQuotes: board.customQuotes ?? [],
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setIsEditing(false);
    } catch {
      setSaveError('Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-sage/20 bg-white/90 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Heart className="w-4 h-4 text-sage" />
            <h2 className="font-sans text-base font-semibold text-forest">My Manifesto</h2>
          </div>
          <p className="font-sans text-xs text-forest/45">
            Read this daily. Edit it as your dream evolves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              {saveError && (
                <p className="font-sans text-xs text-red-500 mr-1">{saveError}</p>
              )}
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 font-sans text-xs text-forest/50 hover:text-forest transition-colors px-3 py-1.5 rounded-lg hover:bg-cream"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="flex items-center gap-1.5 font-sans text-xs px-3 py-1.5 rounded-lg bg-sage text-white hover:bg-sage/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? (
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 font-sans text-xs text-forest/50 hover:text-forest transition-colors px-3 py-1.5 rounded-lg hover:bg-sage-light/40"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                className={cn(
                  'flex items-center gap-1.5 font-sans text-xs px-3 py-1.5 rounded-lg border transition-all',
                  isPaid
                    ? 'text-forest border-sage/30 hover:bg-sage-light/40 hover:border-sage/50'
                    : 'text-forest/40 border-sage/15 cursor-default',
                )}
              >
                {isPaid ? <Pencil className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lock hint */}
      {showLockHint && (
        <div className="mx-6 mb-3 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-xs font-sans text-forest/70">
          Inline editing is available on paid plans. Upgrade to keep refining your dream.
        </div>
      )}

      {/* Body */}
      <div className="px-6 pb-6">
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[320px] font-sans text-sm text-forest/80 leading-relaxed bg-cream/60 border border-sage/20 rounded-xl px-4 py-4 resize-none outline-none focus:border-sage transition-colors"
          />
        ) : (
          <pre className="font-sans text-sm text-forest/80 whitespace-pre-wrap leading-relaxed">
            {text || 'No manifesto yet. Complete the wizard to generate your dream manifesto.'}
          </pre>
        )}
      </div>

    </div>
  );
}
