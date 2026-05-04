'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type TestRow = {
  id: string;
  areas: string[];
  style: string;
  dreams: string;
  prompt: string;
  imageUrl: string | null;
  notes: string | null;
  rating: number | null;
  createdAt: string;
};

export function GenerationHistory() {
  const [rows, setRows] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/db/generationTests');
    const data = (await res.json()) as { rows: TestRow[] };
    setRows(data.rows ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveNotes = async (id: string) => {
    await fetch('/api/admin/generate-test', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes: notesDraft }),
    });
    setEditingNotes(null);
    load();
  };

  const setRating = async (id: string, rating: number) => {
    await fetch('/api/admin/generate-test', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, rating }),
    });
    load();
  };

  const deleteRow = async (id: string) => {
    if (!confirm('Delete this test run?')) return;
    await fetch(`/api/admin/db/generationTests/${id}`, { method: 'DELETE' });
    load();
  };

  if (loading) {
    return <div className="text-gray-500 text-sm py-12 text-center">Loading…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 p-12 text-center">
        <p className="text-gray-500 text-sm">No test runs yet. Use the Generation Lab to create one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">{rows.length} test runs</h2>
        <button onClick={load} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          ↻ Refresh
        </button>
      </div>

      {rows.map((row) => (
        <div
          key={row.id}
          className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden"
        >
          {/* Summary row */}
          <div
            className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
            onClick={() => setExpanded(expanded === row.id ? null : row.id)}
          >
            {/* Thumbnail */}
            <div className="w-10 h-14 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
              {row.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                  —
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-white capitalize">{row.style}</span>
                <span className="text-gray-600 text-xs">·</span>
                {row.areas.map((a) => (
                  <span key={a} className="text-xs text-indigo-400 capitalize">{a}</span>
                ))}
              </div>
              {row.notes && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{row.notes}</p>
              )}
            </div>

            {/* Rating */}
            <div className="flex gap-0.5 flex-shrink-0">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={(e) => { e.stopPropagation(); setRating(row.id, r); }}
                  className={cn(
                    'w-6 h-6 rounded text-xs font-bold transition-colors',
                    row.rating === r
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-600 hover:bg-gray-700',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-600 flex-shrink-0">
              {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>

            <span className="text-gray-500 text-xs">{expanded === row.id ? '▲' : '▼'}</span>
          </div>

          {/* Expanded detail */}
          {expanded === row.id && (
            <div className="border-t border-gray-800 px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              {row.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.imageUrl} alt="Generated" className="w-full max-h-[500px] object-contain bg-gray-950" />
                </div>
              )}

              <div className="space-y-4">
                {/* Prompt */}
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Prompt</p>
                  <pre className="text-xs text-gray-400 bg-gray-950 rounded-lg p-3 whitespace-pre-wrap font-mono border border-gray-800 max-h-48 overflow-y-auto">
                    {row.prompt}
                  </pre>
                </div>

                {/* Dreams */}
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Dreams input</p>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{row.dreams}</p>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
                  {editingNotes === row.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => { if (e.key === 'Enter') saveNotes(row.id); if (e.key === 'Escape') setEditingNotes(null); }}
                      />
                      <button onClick={() => saveNotes(row.id)} className="text-xs text-indigo-400 hover:text-indigo-300">Save</button>
                      <button onClick={() => setEditingNotes(null)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingNotes(row.id); setNotesDraft(row.notes ?? ''); }}
                      className="text-xs text-gray-500 hover:text-gray-300 text-left w-full"
                    >
                      {row.notes || <span className="italic">Click to add notes…</span>}
                    </button>
                  )}
                </div>

                {/* Image URL */}
                {row.imageUrl && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Image URL</p>
                    <a
                      href={row.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:underline break-all"
                    >
                      {row.imageUrl}
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {row.imageUrl && (
                    <a
                      href={row.imageUrl}
                      download
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      ↓ Download
                    </a>
                  )}
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
