'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Link2, Check, X } from 'lucide-react';
import type { Board } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

export function BoardCard({ board }: { board: Board }) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(board.name ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = board.name ?? board.selectedAreas.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(' · ');

  const date = board.createdAt
    ? new Date(board.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus();
  }, [isRenaming]);

  const saveRename = async () => {
    const trimmed = nameValue.trim();
    await fetch(`/api/boards/${board.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    setIsRenaming(false);
    router.refresh();
  };

  const cancelRename = () => {
    setNameValue(board.name ?? '');
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await fetch(`/api/boards/${board.id}`, { method: 'DELETE' });
    router.refresh();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/share/${board.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      prompt('Copy this link:', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-sage/20 bg-white/70 overflow-hidden hover:border-sage/40 hover:shadow-sm transition-all flex flex-col">
      {board.wallpaperUrl && (
        <div className="h-40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={board.wallpaperUrl} alt="Dream board wallpaper" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Name / rename */}
        {isRenaming ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveRename();
                if (e.key === 'Escape') cancelRename();
              }}
              placeholder={displayName}
              className="flex-1 rounded-lg border-2 border-sage/40 bg-cream px-3 py-1.5 font-sans text-sm text-forest focus:border-sage focus:outline-none"
            />
            <button type="button" onClick={() => void saveRename()} className="text-sage hover:text-forest transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button type="button" onClick={cancelRename} className="text-forest/40 hover:text-forest transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="font-sans text-sm font-semibold text-forest truncate">{displayName}</p>
        )}

        {/* Area tags */}
        <div className="flex flex-wrap gap-1.5">
          {board.selectedAreas.map((area) => (
            <span key={area} className="px-2.5 py-0.5 rounded-full bg-sage-light text-sage text-xs font-sans font-medium capitalize">
              {area}
            </span>
          ))}
        </div>

        {board.manifesto && (
          <p className="font-display italic text-forest text-sm leading-relaxed line-clamp-3">
            {board.manifesto}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-2 border-t border-sage/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {date && <span className="font-sans text-xs text-forest/40">{date}</span>}
            <span className="font-sans text-xs text-forest/40 capitalize">{board.style}</span>
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
                title="Copy share link"
                className={cn('transition-colors', copied ? 'text-sage' : 'text-forest/40 hover:text-sage')}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => { setIsRenaming(true); setConfirmDelete(false); }}
                title="Rename"
                className="text-forest/40 hover:text-sage transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <Link
                href={`/create?boardId=${board.id}`}
                title="Edit board"
                className="font-sans text-xs font-medium text-sage hover:text-forest transition-colors"
              >
                Edit
              </Link>
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
