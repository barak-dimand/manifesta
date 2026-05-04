'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { IMAGE_MODELS, DEFAULT_T2I_MODEL, DEFAULT_I2I_MODEL, PROVIDERS } from '@/lib/imageModels';
import type { Provider } from '@/lib/imageModels';

const STYLES = ['minimal', 'vibrant', 'ethereal', 'luxe'] as const;
const MODES = ['text-to-image', 'image-to-image'] as const;
type Mode = (typeof MODES)[number];

// e.g. 'text-to-image', 'image-to-image', 'text-to-image:minimal'
type ConfigKey = string;

interface SavedConfig {
  configKey: ConfigKey;
  provider: Provider;
  modelId: string;
}

const PROVIDER_COLORS: Record<Provider, { badge: string; button: string }> = {
  replicate: { badge: 'bg-indigo-900/60 text-indigo-300 border-indigo-700', button: 'bg-indigo-700 hover:bg-indigo-600' },
  openai:    { badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700', button: 'bg-emerald-700 hover:bg-emerald-600' },
  google:    { badge: 'bg-blue-900/60 text-blue-300 border-blue-700', button: 'bg-blue-700 hover:bg-blue-600' },
};

function modelLabel(modelId: string): string {
  return IMAGE_MODELS.find((m) => m.id === modelId)?.label ?? modelId.split('/').pop() ?? modelId;
}

function providerOf(modelId: string): Provider {
  return IMAGE_MODELS.find((m) => m.id === modelId)?.provider ?? 'replicate';
}

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

  const compatibleModels = IMAGE_MODELS.filter(
    (m) => m.capability === 'both' || m.capability === mode,
  );

  const pick = async (modelId: string) => {
    setSaving(true);
    await onSave(configKey, modelId);
    setSaving(false);
    setOpen(false);
  };

  const reset = async () => {
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
          {isDefault && <span className="text-[10px] text-gray-600">default</span>}
          {!isDefault && <span className="text-[10px] text-amber-600">custom</span>}
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
                    <button
                      key={m.id}
                      onClick={() => pick(m.id)}
                      disabled={saving}
                      className={cn(
                        'w-full text-left px-2 py-2 rounded-lg text-xs transition-colors hover:bg-gray-800',
                        currentModelId === m.id && 'bg-gray-800',
                      )}
                    >
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
              <button
                onClick={reset}
                disabled={saving}
                className="w-full text-xs text-red-500 hover:text-red-400 py-1 transition-colors"
              >
                Reset to default
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ModelConfig() {
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/model-config');
    const data = (await res.json()) as { configs: SavedConfig[] };
    setConfigs(data.configs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const getModel = (configKey: ConfigKey): string => {
    const saved = configs.find((c) => c.configKey === configKey);
    if (saved) return saved.modelId;
    // fallback to global default for the mode
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Model Preferences</h2>
        <p className="text-xs text-gray-500">
          Set which model to use for each style × mode combination. The wallpaper generation route reads these preferences.
          Leave a cell on &quot;default&quot; to inherit the global default for that mode.
        </p>
      </div>

      {/* Global defaults row */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Global Defaults</h3>
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
      <div>
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Per-Style Overrides</h3>
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[120px_1fr_1fr] bg-gray-900 border-b border-gray-800">
            <div className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Style</div>
            {MODES.map((mode) => (
              <div key={mode} className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                {mode}
              </div>
            ))}
          </div>

          {/* Rows */}
          {STYLES.map((style, i) => (
            <div
              key={style}
              className={cn(
                'grid grid-cols-[120px_1fr_1fr] items-start gap-px',
                i < STYLES.length - 1 && 'border-b border-gray-800',
              )}
            >
              <div className="px-4 py-3 flex items-center h-full">
                <span className="text-sm font-medium text-gray-200 capitalize">{style}</span>
              </div>
              {MODES.map((mode) => {
                const configKey = `${mode}:${style}` as ConfigKey;
                return (
                  <div key={mode} className="px-3 py-3">
                    <CellPicker
                      configKey={configKey}
                      currentModelId={getModel(configKey)}
                      isDefault={isDefault(configKey)}
                      onSave={saveConfig}
                      onReset={resetConfig}
                      mode={mode}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-gray-800 p-4">
        <h3 className="text-xs font-semibold text-gray-400 mb-3">Available Models</h3>
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
    </div>
  );
}
