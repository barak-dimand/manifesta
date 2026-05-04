'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

type LogLevel = 'error' | 'warn' | 'info';

interface LogRow {
  id: string;
  level: string;
  route: string | null;
  message: string;
  details: unknown;
  userId: string | null;
  createdAt: string;
}

interface Stats {
  errors1h: number;
  warns1h: number;
  total24h: number;
}

const LEVEL_STYLES: Record<string, { badge: string; row: string; dot: string }> = {
  error: {
    badge: 'bg-red-900/70 text-red-300 border border-red-700',
    row: 'bg-red-950/20 hover:bg-red-950/40 border-red-900/30',
    dot: 'bg-red-500',
  },
  warn: {
    badge: 'bg-amber-900/70 text-amber-300 border border-amber-700',
    row: 'bg-amber-950/20 hover:bg-amber-950/40 border-amber-900/30',
    dot: 'bg-amber-400',
  },
  info: {
    badge: 'bg-blue-900/60 text-blue-300 border border-blue-800',
    row: 'bg-gray-900/60 hover:bg-gray-800/60 border-gray-800',
    dot: 'bg-blue-400',
  },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function JsonDetails({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null;

  let formatted: string;
  try {
    formatted = JSON.stringify(data, null, 2);
  } catch {
    formatted = String(data);
  }

  // Highlight stack traces
  const lines = formatted.split('\n');
  return (
    <pre className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
      {lines.map((line, i) => {
        const isStack = line.includes('at ') || line.includes('Error:');
        const isKey = /^\s+"[^"]+":/.test(line);
        return (
          <span key={i} className={cn(
            isStack && 'text-red-400/80',
            isKey && 'text-amber-400/80',
          )}>
            {line}
            {'\n'}
          </span>
        );
      })}
    </pre>
  );
}

export function AppLogs() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [stats, setStats] = useState<Stats>({ errors1h: 0, warns1h: 0, total24h: 0 });
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [livePulse, setLivePulse] = useState(false);
  const [purging, setPurging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '300' });
      if (levelFilter !== 'all') params.set('level', levelFilter);
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = (await res.json()) as { logs: LogRow[]; stats: Stats };
      setLogs(data.logs ?? []);
      setStats(data.stats ?? { errors1h: 0, warns1h: 0, total24h: 0 });
      setLastRefresh(new Date());
      if (silent) {
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 600);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [levelFilter]);

  // Initial load + on filter change
  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => void fetchLogs(true), 10_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh, fetchLogs]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const purgeLogs = async (days: number) => {
    if (!confirm(`Delete all logs older than ${days} day(s)?`)) return;
    setPurging(true);
    await fetch(`/api/admin/logs?days=${days}`, { method: 'DELETE' });
    await fetchLogs();
    setPurging(false);
  };

  const filtered = logs.filter((l) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        (l.route ?? '').toLowerCase().includes(q) ||
        (l.userId ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const styles = (level: string) => LEVEL_STYLES[level] ?? LEVEL_STYLES.info;

  return (
    <div className="space-y-4 max-w-6xl">

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-0.5">Errors (last hour)</p>
          <p className={cn('text-2xl font-bold', stats.errors1h > 0 ? 'text-red-400' : 'text-gray-500')}>
            {stats.errors1h}
          </p>
        </div>
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold mb-0.5">Warnings (last hour)</p>
          <p className={cn('text-2xl font-bold', stats.warns1h > 0 ? 'text-amber-400' : 'text-gray-500')}>
            {stats.warns1h}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Events (24 hours)</p>
          <p className="text-2xl font-bold text-gray-300">{stats.total24h}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Level filters */}
        <div className="flex gap-1">
          {(['all', 'error', 'warn', 'info'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                levelFilter === lvl
                  ? lvl === 'error' ? 'bg-red-800 text-red-100'
                    : lvl === 'warn' ? 'bg-amber-800 text-amber-100'
                    : lvl === 'info' ? 'bg-blue-800 text-blue-100'
                    : 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
              )}
            >
              {lvl}
              {lvl !== 'all' && (
                <span className="ml-1 opacity-60">
                  {logs.filter((l) => l.level === lvl).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search message, route, user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-gray-500"
        />

        {/* Auto-refresh toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              autoRefresh ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-gray-800 text-gray-400 border border-gray-700',
            )}
          >
            <span className={cn(
              'w-1.5 h-1.5 rounded-full transition-all',
              autoRefresh ? (livePulse ? 'bg-green-300 scale-150' : 'bg-green-500') : 'bg-gray-600',
            )} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={() => void fetchLogs()}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => void purgeLogs(7)}
            disabled={purging}
            className="px-3 py-1.5 rounded-lg text-xs text-red-500 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors disabled:opacity-50"
          >
            {purging ? 'Purging…' : 'Purge >7d'}
          </button>
        </div>
      </div>

      {/* Last refreshed */}
      <p className="text-[10px] text-gray-600">
        Last refreshed {lastRefresh.toLocaleTimeString()} · showing {filtered.length} of {logs.length} events
        {autoRefresh && ' · auto-refreshes every 10s'}
      </p>

      {/* Log list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 h-48 flex flex-col items-center justify-center gap-2">
          <p className="text-gray-500 text-sm">No events found</p>
          {levelFilter !== 'all' || search ? (
            <button
              onClick={() => { setLevelFilter('all'); setSearch(''); }}
              className="text-xs text-gray-600 underline hover:text-gray-400"
            >
              Clear filters
            </button>
          ) : (
            <p className="text-xs text-gray-600">Events will appear here as the app runs</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden divide-y divide-gray-800/60">
          {filtered.map((log) => {
            const s = styles(log.level);
            const isOpen = expanded.has(log.id);
            const hasDetails = log.details !== null && log.details !== undefined;

            return (
              <div key={log.id} className={cn('border-l-2 transition-colors', s.row, `border-l-${s.dot.replace('bg-', '')}`)}>
                <button
                  className="w-full text-left px-4 py-2.5 flex items-start gap-3"
                  onClick={() => hasDetails && toggleExpand(log.id)}
                  style={{ cursor: hasDetails ? 'pointer' : 'default' }}
                >
                  {/* Level dot */}
                  <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />

                  {/* Level badge */}
                  <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5', s.badge)}>
                    {log.level}
                  </span>

                  {/* Route */}
                  {log.route && (
                    <span className="text-[10px] font-mono text-gray-500 flex-shrink-0 mt-1 hidden sm:block">
                      {log.route}
                    </span>
                  )}

                  {/* Message */}
                  <span className="flex-1 text-xs text-gray-200 leading-relaxed min-w-0 text-left">
                    {log.message}
                  </span>

                  {/* Time + expand indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {log.userId && (
                      <span className="text-[9px] text-gray-600 font-mono hidden md:block truncate max-w-20" title={log.userId}>
                        {log.userId.slice(0, 8)}…
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600 whitespace-nowrap" title={absoluteTime(log.createdAt)}>
                      {relativeTime(log.createdAt)}
                    </span>
                    {hasDetails && (
                      <span className="text-gray-600 text-xs">{isOpen ? '▲' : '▼'}</span>
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && hasDetails && (
                  <div className="px-4 pb-3 pt-0 ml-6">
                    <div className="rounded-lg bg-gray-950 border border-gray-800 p-3 mt-1">
                      <p className="text-[10px] text-gray-600 mb-2 font-mono">{absoluteTime(log.createdAt)}</p>
                      <JsonDetails data={log.details} />
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
