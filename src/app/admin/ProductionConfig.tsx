'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { IMAGE_MODELS, DEFAULT_T2I_MODEL, DEFAULT_I2I_MODEL, PROVIDERS } from '@/lib/imageModels';
import type { Provider } from '@/lib/imageModels';

const STYLES = ['minimal', 'vibrant', 'ethereal', 'luxe'] as const;
const MODES = ['text-to-image', 'image-to-image'] as const;
type Mode = (typeof MODES)[number];
type ConfigKey = string;

interface SavedModelConfig {
  configKey: ConfigKey;
  provider: Provider;
  modelId: string;
}

const PROVIDER_COLORS: Record<Provider, { badge: string }> = {
  replicate: { badge: 'bg-indigo-900/60 text-indigo-300 border-indigo-700' },
  openai:    { badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700' },
  google:    { badge: 'bg-blue-900/60 text-blue-300 border-blue-700' },
};

function modelLabel(modelId: string): string {
  return IMAGE_MODELS.find((m) => m.id === modelId)?.label ?? modelId.split('/').pop() ?? modelId;
}

function providerOf(modelId: string): Provider {
  return IMAGE_MODELS.find((m) => m.id === modelId)?.provider ?? 'replicate';
}

// ── System Prompt section ─────────────────────────────────────────────────

function SystemPromptSection() {
  const [config, setConfig] = useState<{
    text: string;
    source: 'db' | 'default';
    presets: { label: string; text: string }[];
  } | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/system-prompt');
    const data = await res.json() as { text: string; source: 'db' | 'default'; presets: { label: string; text: string }[] };
    setConfig({ text: data.text, source: data.source, presets: data.presets ?? [] });
    setDraft(data.text);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setStatus('idle');
    const res = await fetch('/api/admin/system-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: draft }),
    });
    setSaving(false);
    if (res.ok) {
      setConfig((c) => c ? { ...c, text: draft, savedText: draft, source: 'db' } as typeof c : c);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
      await load();
    } else {
      setStatus('error');
    }
  };

  const reset = async () => {
    await fetch('/api/admin/system-prompt', { method: 'DELETE' });
    await load();
    setStatus('idle');
  };

  const isDirty = draft !== config?.text;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">System Prompt</h3>
          {config && (
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border',
              config.source === 'db'
                ? 'bg-amber-900/50 text-amber-400 border-amber-800'
                : 'bg-gray-800 text-gray-500 border-gray-700',
            )}>
              {config.source === 'db' ? 'custom — saved in DB' : 'hardcoded default'}
            </span>
          )}
          {isDirty && <span className="text-[9px] text-orange-400 font-semibold">&#9679; unsaved changes</span>}
          {status === 'saved' && <span className="text-[9px] text-green-400 font-semibold">&#10003; saved</span>}
          {status === 'error' && <span className="text-[9px] text-red-400 font-semibold">&#10007; error</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600">{draft.split(/\s+/).filter(Boolean).length}w</span>
          <button
            onClick={save}
            disabled={saving || !draft.trim() || !isDirty}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            {saving ? 'Saving…' : 'Save to production'}
          </button>
          {config?.source === 'db' && (
            <button onClick={reset}
              className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400 border border-gray-700 transition-colors">
              Reset to default
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={10}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-500 resize-y leading-relaxed"
        />

        {config && config.presets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-gray-600 font-medium">Presets:</span>
            {config.presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setDraft(p.text)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] border transition-colors',
                  draft === p.text
                    ? 'bg-amber-900/40 text-amber-300 border-amber-800'
                    : 'bg-gray-800 text-gray-400 hover:text-amber-300 border-gray-700 hover:border-amber-800',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-gray-600">
          This is the instruction given to GPT-4o mini when engineering prompts. Changes saved here are immediately live for all users.
        </p>
      </div>
    </div>
  );
}

// ── Model picker cell ─────────────────────────────────────────────────────

interface CellPickerProps {
  configKey: ConfigKey;
  currentModelId: string;
  isDefault: boolean;
  onSave: (configKey: ConfigKey, modelId: string) => Promise<void>;
  onReset: (configKey: ConfigKey) => Promise<void>;
  mode: Mode;
}

function CellPicker({ configKey, currentModelId, isDefault, onSave, onReset, mode }: CellPickerProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const provider = providerOf(currentModelId);
  const colors = PROVIDER_COLORS[provider];

  const compatibleModels = IMAGE_MODELS.filter((m) => m.capability === 'both' || m.capability === mode);

  const pick = async (modelId: string) => {
    setSaving(true);
    await onSave(configKey, modelId);
    setSaving(false);
    setOpen(false);
  };

  const doReset = async () => {
    setSaving(true);
    await onReset(configKey);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full text-left px-3 py-2 rounded-lg border text-xs transition-all',
          open ? 'border-gray-500 bg-gray-800' : 'border-gray-800 bg-gray-900 hover:bg-gray-800 hover:border-gray-700',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold border', colors.badge)}>
            {modelLabel(currentModelId)}
          </span>
          <span className={cn('text-[10px]', isDefault ? 'text-gray-600' : 'text-amber-600')}>
            {isDefault ? 'default' : 'custom'}
          </span>
        </div>
        <p className="text-[10px] text-gray-600 mt-0.5 truncate">{currentModelId}</p>
      </button>

      {open && (
        <div className="absolute z-20 left-0 top-full mt-1 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 space-y-2 max-h-72 overflow-y-auto">
            {PROVIDERS.map(({ id: pid, label: plabel }) => {
              const models = compatibleModels.filter((m) => m.provider === pid);
              if (models.length === 0) return null;
              return (
                <div key={pid}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 px-2 mb-1">{plabel}</p>
                  {models.map((m) => (
                    <button key={m.id} onClick={() => pick(m.id)} disabled={saving}
                      className={cn('w-full text-left px-2 py-2 rounded-lg text-xs transition-colors hover:bg-gray-800',
                        currentModelId === m.id && 'bg-gray-800')}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-200">{m.label}</span>
                        <span className="text-[10px] text-gray-500">{m.estimatedTime}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{m.description}</p>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
          {!isDefault && (
            <div className="border-t border-gray-800 p-2">
              <button onClick={doReset} disabled={saving}
                className="w-full text-xs text-red-500 hover:text-red-400 py-1 transition-colors">
                Reset to default
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function ProductionConfig() {
  const [configs, setConfigs] = useState<SavedModelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/model-config');
    const data = (await res.json()) as { configs: SavedModelConfig[] };
    setConfigs(data.configs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const getModel = (configKey: ConfigKey): string => {
    const saved = configs.find((c) => c.configKey === configKey);
    if (saved) return saved.modelId;
    const globalMode = configKey.split(':')[0] as Mode;
    const globalSaved = configs.find((c) => c.configKey === globalMode);
    if (globalSaved) return globalSaved.modelId;
    return configKey.includes('image-to-image') ? DEFAULT_I2I_MODEL : DEFAULT_T2I_MODEL;
  };

  const isDefault = (configKey: ConfigKey): boolean => !configs.find((c) => c.configKey === configKey);

  const saveConfig = async (configKey: ConfigKey, modelId: string) => {
    const provider = providerOf(modelId);
    await fetch('/api/admin/model-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configKey, provider, modelId }),
    });
    await load();
  };

  const resetConfig = async (configKey: ConfigKey) => {
    await fetch(`/api/admin/model-config?key=${encodeURIComponent(configKey)}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Production Config</h2>
        <p className="text-xs text-gray-500">
          Everything here is live — changes take effect immediately for all users. The Generation Lab is for testing only.
        </p>
      </div>

      {/* System prompt */}
      <SystemPromptSection />

      {/* Image models */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">Image Models</h3>
          <p className="text-xs text-gray-500">
            Which model generates the wallpaper for each style × mode combination.
            Cells on <span className="text-gray-400">default</span> inherit the global default for that mode.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Global defaults */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Global Defaults</p>
              <div className="grid grid-cols-2 gap-4">
                {MODES.map((mode) => (
                  <div key={mode}>
                    <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider">{mode}</p>
                    <CellPicker
                      configKey={mode}
                      currentModelId={getModel(mode)}
                      isDefault={isDefault(mode)}
                      onSave={saveConfig}
                      onReset={resetConfig}
                      mode={mode}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Per-style overrides */}
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <div className="grid grid-cols-[120px_1fr_1fr] bg-gray-900 border-b border-gray-800">
                <div className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Style</div>
                {MODES.map((mode) => (
                  <div key={mode} className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{mode}</div>
                ))}
              </div>
              {STYLES.map((style, i) => (
                <div key={style} className={cn('grid grid-cols-[120px_1fr_1fr] items-start gap-px', i < STYLES.length - 1 && 'border-b border-gray-800')}>
                  <div className="px-4 py-3 flex items-center h-full">
                    <span className="text-sm font-medium text-gray-200 capitalize">{style}</span>
                  </div>
                  {MODES.map((mode) => (
                    <div key={mode} className="px-3 py-3">
                      <CellPicker
                        configKey={`${mode}:${style}` as ConfigKey}
                        currentModelId={getModel(`${mode}:${style}`)}
                        isDefault={isDefault(`${mode}:${style}`)}
                        onSave={saveConfig}
                        onReset={resetConfig}
                        mode={mode}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Model legend */}
            <div className="rounded-xl border border-gray-800 p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Available Models</p>
              <div className="space-y-3">
                {PROVIDERS.map(({ id: pid, label: plabel }) => (
                  <div key={pid}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">{plabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {IMAGE_MODELS.filter((m) => m.provider === pid).map((m) => (
                        <div key={m.id} className={cn('flex flex-col px-3 py-2 rounded-lg border text-[10px]', PROVIDER_COLORS[pid].badge)}>
                          <span className="font-semibold">{m.label}</span>
                          <span className="opacity-70 mt-0.5">{m.capability} · {m.estimatedTime}</span>
                          {m.notes && <span className="opacity-50 mt-0.5">{m.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
