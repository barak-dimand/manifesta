'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Image, Loader2, X, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

type Board = {
  id: string;
  email: string;
  dreams: string;
  style: string;
  selectedAreas: string[];
  wallpaperUrl: string | null;
  createdAt: string;
};

type UploadState = {
  boardId: string;
  file: File | null;
  preview: string | null;
  uploading: boolean;
  done: boolean;
  error: string;
};

export function VisionBoardUploader() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [active, setActive] = useState<UploadState | null>(null);
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/db/boards')
      .then((r) => r.json())
      .then((data: { rows?: Board[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setBoards(data.rows ?? []);
      })
      .catch((e: unknown) => setFetchError(e instanceof Error ? e.message : 'Failed to load boards'))
      .finally(() => setLoading(false));
  }, []);

  const openUpload = (boardId: string) => {
    setActive({ boardId, file: null, preview: null, uploading: false, done: false, error: '' });
    // Defer focus so the element is mounted
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const cancelUpload = () => {
    if (active?.preview) URL.revokeObjectURL(active.preview);
    setActive(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    if (active.preview) URL.revokeObjectURL(active.preview);
    setActive((prev) => prev && { ...prev, file, preview: URL.createObjectURL(file), error: '' });
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!active?.file || active.uploading) return;
    setActive((prev) => prev && { ...prev, uploading: true, error: '' });

    const form = new FormData();
    form.append('file', active.file);

    try {
      const res = await fetch(`/api/admin/boards/${active.boardId}/upload-image`, {
        method: 'POST',
        body: form,
      });
      const data = (await res.json()) as { success?: boolean; imageUrl?: string; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Upload failed');

      // Update board in list to show has-image status
      setBoards((prev) =>
        prev.map((b) => (b.id === active.boardId ? { ...b, wallpaperUrl: data.imageUrl ?? b.wallpaperUrl } : b))
      );
      setUploadedIds((prev) => new Set([...prev, active.boardId]));
      setActive((prev) => prev && { ...prev, uploading: false, done: true });

      // Auto-close after 2 s
      setTimeout(() => setActive(null), 2000);
    } catch (err) {
      setActive((prev) =>
        prev && { ...prev, uploading: false, error: err instanceof Error ? err.message : 'Upload failed' }
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-forest/50 py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-sans text-sm">Loading boards…</span>
      </div>
    );
  }

  if (fetchError) {
    return <p className="font-sans text-sm text-red-500 py-8 text-center">{fetchError}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input shared across all rows */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-forest/60">
          {boards.length} board{boards.length !== 1 ? 's' : ''} · click Upload to send a vision board image to a user
        </p>
        <span className="font-sans text-xs text-forest/40">Notification email sent automatically</span>
      </div>

      <div className="flex flex-col gap-3">
        {boards.map((board) => {
          const isActive = active?.boardId === board.id;
          const justUploaded = uploadedIds.has(board.id);
          const hasImage = !!board.wallpaperUrl;
          const dreamsSnippet = board.dreams.length > 120 ? board.dreams.slice(0, 117) + '…' : board.dreams;

          return (
            <div
              key={board.id}
              className={cn(
                'rounded-xl border bg-white/80 transition-all duration-200',
                isActive ? 'border-sage shadow-sm' : 'border-sage/15',
              )}
            >
              {/* Board row */}
              <div className="flex items-start gap-4 p-4">
                {/* Thumbnail */}
                <div className="w-12 h-16 rounded-lg bg-sage/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {hasImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={board.wallpaperUrl!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="h-5 w-5 text-sage/30" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-forest/40 flex-shrink-0" />
                    <span className="font-sans text-sm font-semibold text-forest truncate">{board.email}</span>
                  </div>
                  <p className="font-sans text-xs text-forest/50 leading-relaxed line-clamp-2">{dreamsSnippet}</p>
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-[11px] text-forest/35">
                      {new Date(board.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="font-sans text-[11px] text-forest/35 capitalize">{board.style}</span>
                    {board.selectedAreas.slice(0, 3).map((a) => (
                      <span key={a} className="font-sans text-[11px] bg-sage/10 text-sage px-1.5 py-0.5 rounded-full capitalize">{a}</span>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                  {justUploaded ? (
                    <div className="flex items-center gap-1.5 text-sage">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-sans text-xs font-semibold">Sent!</span>
                    </div>
                  ) : hasImage ? (
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1 text-sage/60">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span className="font-sans text-[11px]">Has image</span>
                      </div>
                      <button
                        onClick={() => isActive ? cancelUpload() : openUpload(board.id)}
                        className="font-sans text-xs text-forest/40 hover:text-forest transition-colors"
                      >
                        {isActive ? 'Cancel' : 'Re-upload'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => isActive ? cancelUpload() : openUpload(board.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-all',
                        isActive
                          ? 'bg-sage/10 text-sage'
                          : 'bg-sage text-white hover:bg-sage/90',
                      )}
                    >
                      {isActive ? (
                        <><X className="h-3 w-3" /> Cancel</>
                      ) : (
                        <><Upload className="h-3 w-3" /> Upload</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Upload panel — shown when this row is active */}
              {isActive && (
                <div className="border-t border-sage/10 p-4 space-y-3">
                  {active.done ? (
                    <div className="flex items-center gap-2 text-sage justify-center py-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-sans text-sm font-semibold">Uploaded & notification sent ✨</span>
                    </div>
                  ) : (
                    <>
                      {/* File picker trigger */}
                      {!active.file && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-sage/25 rounded-xl py-8 text-center font-sans text-sm text-forest/40 hover:border-sage/50 hover:text-forest/60 transition-colors"
                        >
                          <Upload className="h-5 w-5 mx-auto mb-2 opacity-50" />
                          Click to select the vision board image
                        </button>
                      )}

                      {/* Preview */}
                      {active.preview && (
                        <div className="flex items-start gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={active.preview}
                            alt="Preview"
                            className="w-20 h-28 object-cover rounded-lg border border-sage/20 flex-shrink-0"
                          />
                          <div className="flex-1 space-y-2">
                            <p className="font-sans text-xs text-forest/60">
                              <span className="font-semibold">{active.file?.name}</span>
                              <span className="ml-2 text-forest/40">
                                ({((active.file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            </p>
                            <p className="font-sans text-xs text-forest/50">
                              Uploading will save this image to the user&apos;s dashboard and send them a notification email.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleUpload}
                                disabled={active.uploading}
                                className="flex items-center gap-1.5 bg-sage text-white rounded-lg px-4 py-2 font-sans text-xs font-semibold hover:bg-sage/90 transition-colors disabled:opacity-50"
                              >
                                {active.uploading ? (
                                  <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</>
                                ) : (
                                  <><Upload className="h-3 w-3" /> Upload &amp; Notify User ✨</>
                                )}
                              </button>
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={active.uploading}
                                className="font-sans text-xs text-forest/40 hover:text-forest transition-colors disabled:opacity-30"
                              >
                                Change file
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error */}
                      {active.error && (
                        <div className="flex items-center gap-2 text-red-500">
                          <XCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="font-sans text-xs">{active.error}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {boards.length === 0 && (
          <p className="font-sans text-sm text-forest/40 text-center py-12">No boards found.</p>
        )}
      </div>
    </div>
  );
}
