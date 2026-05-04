'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

const TABLES = [
  { key: 'boards', label: 'Boards' },
  { key: 'generatedWallpapers', label: 'Generated Wallpapers' },
  { key: 'leads', label: 'Leads' },
  { key: 'emailSubscriptions', label: 'Email Subscriptions' },
  { key: 'generationTests', label: 'Generation Tests' },
  { key: 'modelConfig', label: 'Model Config' },
  { key: 'promptConfig', label: 'Prompt Config' },
  { key: 'appLogs', label: 'App Logs' },
] as const;

type TableKey = (typeof TABLES)[number]['key'];
type Row = Record<string, unknown>;

// Fields to never show an edit input for
const READONLY_FIELDS = new Set(['id', 'userId', 'createdAt', 'updatedAt']);
// Fields to render as images when they look like URLs
const IMAGE_FIELDS = new Set(['imageUrl', 'wallpaperUrl']);

export function DbExplorer() {
  const [activeTable, setActiveTable] = useState<TableKey>('boards');
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [draft, setDraft] = useState('');
  const [savingCell, setSavingCell] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setExpandedRow(null);
    setEditingCell(null);
    try {
      const res = await fetch(`/api/admin/db/${activeTable}`);
      const data = (await res.json()) as { rows: Row[]; count: number };
      setRows(data.rows ?? []);
      setCount(data.count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [activeTable]);

  useEffect(() => { load(); }, [load]);

  const saveCell = async (rowId: string, field: string, value: string) => {
    setSavingCell(true);
    await fetch(`/api/admin/db/${activeTable}/${rowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setSavingCell(false);
    setEditingCell(null);
    load();
  };

  const deleteRow = async (rowId: string) => {
    await fetch(`/api/admin/db/${activeTable}/${rowId}`, { method: 'DELETE' });
    setConfirmDelete(null);
    load();
  };

  // Filter rows by search string (searches all string values)
  const filtered = search.trim()
    ? rows.filter((row) =>
        Object.values(row).some((v) =>
          typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase()),
        ),
      )
    : rows;

  // Derive column order: id first, then alphabetical, createdAt/updatedAt last
  const columns = rows.length > 0
    ? [
        'id',
        ...Object.keys(rows[0])
          .filter((k) => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt')
          .sort(),
        ...Object.keys(rows[0]).filter((k) => k === 'createdAt' || k === 'updatedAt'),
      ].filter((k) => Object.keys(rows[0]).includes(k))
    : [];

  return (
    <div className="space-y-4">
      {/* Table tabs */}
      <div className="flex gap-1 border-b border-gray-800 pb-0">
        {TABLES.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTable(t.key); setSearch(''); }}
            className={cn(
              'px-3 py-2 text-xs font-medium rounded-t-lg transition-colors',
              activeTable === t.key
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rows…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
        />
        <span className="text-xs text-gray-500 flex-shrink-0">
          {filtered.length} / {count} rows
        </span>
        <button
          onClick={load}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="py-12 text-center text-gray-500 text-sm">Loading…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-12 text-center text-gray-500 text-sm">
          {search ? 'No rows match your search.' : 'This table is empty.'}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((row) => {
            const rowId = row.id as string;
            const isExpanded = expandedRow === rowId;

            return (
              <div
                key={rowId}
                className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden"
              >
                {/* Row summary */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => setExpandedRow(isExpanded ? null : rowId)}
                >
                  <RowSummary row={row} tableKey={activeTable} />
                  <span className="text-gray-600 text-xs ml-auto flex-shrink-0">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expanded fields */}
                {isExpanded && (
                  <div className="border-t border-gray-800 px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                      {columns.map((field) => {
                        const raw = row[field];
                        const value = raw === null || raw === undefined ? '' : typeof raw === 'object' ? JSON.stringify(raw, null, 2) : String(raw);
                        const isEditing = editingCell?.rowId === rowId && editingCell?.field === field;
                        const isReadonly = READONLY_FIELDS.has(field);
                        const isImage = IMAGE_FIELDS.has(field) && typeof raw === 'string' && raw.startsWith('http');
                        const isJson = typeof raw === 'object' && raw !== null;

                        return (
                          <div key={field}>
                            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                              {field}
                              {isReadonly && <span className="ml-1 text-gray-700 normal-case">(readonly)</span>}
                            </p>

                            {isImage && (
                              <div className="mb-1 rounded overflow-hidden border border-gray-700 w-24 h-32">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={value} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}

                            {isEditing ? (
                              <div className="flex gap-2 items-start">
                                {isJson || value.includes('\n') ? (
                                  <textarea
                                    autoFocus
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    rows={4}
                                    className="flex-1 bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none resize-none"
                                  />
                                ) : (
                                  <input
                                    autoFocus
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveCell(rowId, field, draft);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="flex-1 bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                  />
                                )}
                                <button
                                  onClick={() => saveCell(rowId, field, draft)}
                                  disabled={savingCell}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 flex-shrink-0"
                                >
                                  {savingCell ? '…' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingCell(null)}
                                  className="text-xs text-gray-500 hover:text-gray-300 flex-shrink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  if (!isReadonly) {
                                    setEditingCell({ rowId, field });
                                    setDraft(value);
                                  }
                                }}
                                className={cn(
                                  'text-xs rounded px-2 py-1 font-mono break-all',
                                  isReadonly
                                    ? 'text-gray-600 cursor-default'
                                    : 'text-gray-300 cursor-pointer hover:bg-gray-800 border border-transparent hover:border-gray-700',
                                  isJson && 'whitespace-pre-wrap',
                                )}
                              >
                                {value || <span className="text-gray-700 italic">null</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Delete */}
                    <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
                      {confirmDelete === rowId ? (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-red-400">Delete this row permanently?</span>
                          <button
                            onClick={() => deleteRow(rowId)}
                            className="text-xs text-red-500 hover:text-red-400 font-semibold"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-500 hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(rowId)}
                          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                        >
                          Delete row
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── per-table summary line shown in collapsed state ──────────────────────────
function RowSummary({ row, tableKey }: { row: Row; tableKey: TableKey }) {
  const id = (row.id as string).slice(0, 8) + '…';

  if (tableKey === 'boards') {
    const wallpaperUrl = row.wallpaperUrl as string | null;
    return (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {!!wallpaperUrl && (
          <div className="w-8 h-11 rounded overflow-hidden bg-gray-800 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={wallpaperUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs text-white font-medium truncate">{row.email as string}</p>
          <p className="text-xs text-gray-500 truncate">
            {(row.selectedAreas as string[]).join(', ')} · {row.style as string}
          </p>
        </div>
        <span className="text-[10px] text-gray-600 ml-auto flex-shrink-0">{id}</span>
      </div>
    );
  }

  if (tableKey === 'leads') {
    return (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <p className="text-xs text-white font-medium">{row.email as string}</p>
        <span className="text-xs text-gray-500">{row.source as string}</span>
        <span className="text-[10px] text-gray-600 ml-auto">{id}</span>
      </div>
    );
  }

  if (tableKey === 'emailSubscriptions') {
    const isActive = row.isActive as boolean;
    return (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <p className="text-xs text-white font-medium">{row.email as string}</p>
        <span className={cn('text-xs', isActive ? 'text-green-400' : 'text-gray-500')}>
          {isActive ? 'active' : 'inactive'}
        </span>
        <span className="text-xs text-gray-500">
          sends at {row.sendHour as number}:00 {row.timezone as string}
        </span>
        <span className="text-[10px] text-gray-600 ml-auto">{id}</span>
      </div>
    );
  }

  if (tableKey === 'generationTests') {
    const imageUrl = row.imageUrl as string | null;
    const notes = row.notes as string | null;
    const rating = row.rating as number | null;
    return (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {!!imageUrl && (
          <div className="w-8 h-11 rounded overflow-hidden bg-gray-800 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white font-medium capitalize">
            {row.style as string} · {(row.areas as string[]).join(', ')}
          </p>
          {!!notes && <p className="text-xs text-gray-500 truncate">{notes}</p>}
        </div>
        {!!rating && (
          <span className="text-xs font-bold text-indigo-400 flex-shrink-0">{rating}/5</span>
        )}
        <span className="text-[10px] text-gray-600 flex-shrink-0">{id}</span>
      </div>
    );
  }

  return <span className="text-xs text-gray-400 font-mono">{id}</span>;
}
