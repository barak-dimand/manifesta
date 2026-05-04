'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  buildPrompt,
  TEXT_TO_IMAGE_TEMPLATE,
  IMAGE_TO_IMAGE_TEMPLATE,
  STYLE_DATA,
  AREA_SCENES,
  blobUrlToBase64,
} from '@/lib/promptBuilder';
import {
  IMAGE_MODELS,
  DEFAULT_T2I_MODEL,
  DEFAULT_I2I_MODEL,
  PROVIDERS,
} from '@/lib/imageModels';
import type { BuiltPrompt, GenerationMode } from '@/lib/promptBuilder';
import type { AestheticStyle } from '@/lib/validations/wizard';

const AREAS = Object.keys(AREA_SCENES);
const STYLES = Object.keys(STYLE_DATA) as AestheticStyle[];

type GenerationResult = {
  test: { id: string; imageUrl?: string | null; prompt: string };
  promptInfo?: BuiltPrompt;
  resolvedModel?: string;
  provider?: string;
  llmPrompt?: string;
  llmProvider?: string;
  llmModel?: string;
  error?: string;
};

interface Props {
  onGenerated: () => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  replicate: 'bg-indigo-900 text-indigo-300',
  openai: 'bg-emerald-900 text-emerald-300',
  google: 'bg-blue-900 text-blue-300',
};

function TemplateView({ template, variables }: { template: string; variables?: Record<string, string> }) {
  const parts = template.split(/(\{\{[A-Z_]+\}\})/g);
  return (
    <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => {
        const match = part.match(/^\{\{([A-Z_]+)\}\}$/);
        if (match) {
          const key = match[1];
          const value = variables?.[key];
          return (
            <span key={i} title={value ? `= "${value}"` : undefined}>
              <span className="text-amber-400 font-semibold">{`{{${key}}}`}</span>
              {value && (
                <span className="text-green-400 text-[10px] ml-0.5 opacity-80">
                  [{value.slice(0, 40)}{value.length > 40 ? '…' : ''}]
                </span>
              )}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </pre>
  );
}

function HydratedView({ hydrated, variables }: { hydrated: string; variables: Record<string, string> }) {
  const values = Object.values(variables).filter((v) => v.length > 3);
  if (values.length === 0) {
    return <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">{hydrated}</pre>;
  }
  const escaped = values
    .sort((a, b) => b.length - a.length)
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = hydrated.split(regex);
  return (
    <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        values.includes(part)
          ? <span key={i} className="text-green-400 bg-green-900/30 rounded px-0.5">{part}</span>
          : <span key={i}>{part}</span>,
      )}
    </pre>
  );
}

export function GenerationLab({ onGenerated }: Props) {
  const [areas, setAreas] = useState<string[]>(['travel', 'wealth']);
  const [style, setStyle] = useState<AestheticStyle>('vibrant');
  const [dreams, setDreams] = useState('A modern penthouse in NYC with floor-to-ceiling views. Running my own business from anywhere. A loving partner and close friends who inspire me. Calm and deeply at peace with daily meditation.');
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [steps, setSteps] = useState(28);
  const [guidance, setGuidance] = useState(3.5);
  const [imagePromptStrength, setImagePromptStrength] = useState(0.35);
  const [selectedModel, setSelectedModel] = useState<string | null>(null); // null = auto
  const [useLLM, setUseLLM] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [savingRating, setSavingRating] = useState(false);
  // LLM Engineering panel
  const [llmPreview, setLlmPreview] = useState<{
    editedPrompt: string;
    provider: string;
    model: string;
    systemPrompt: string;
    userMessage: string;
    inputSnapshot: string;
  } | null>(null);
  const [inspectTab, setInspectTab] = useState<'user-msg' | 'template'>('user-msg');
  const [isEngineeringPrompt, setIsEngineeringPrompt] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  // System prompt management
  const [systemPromptConfig, setSystemPromptConfig] = useState<{
    savedText: string;
    source: 'db' | 'default';
    presets: { label: string; text: string }[];
  } | null>(null);
  const [systemPromptDraft, setSystemPromptDraft] = useState('');
  const [isSavingSystemPrompt, setIsSavingSystemPrompt] = useState(false);
  const [systemPromptSaveStatus, setSystemPromptSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleArea = (a: string) =>
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const mode: GenerationMode = referenceImageBase64 ? 'image-to-image' : 'text-to-image';
  const inputSnapshot = JSON.stringify({ areas, style, dreams });
  const isLlmPreviewStale = !!llmPreview && llmPreview.inputSnapshot !== inputSnapshot;
  const autoModel = mode === 'image-to-image' ? DEFAULT_I2I_MODEL : DEFAULT_T2I_MODEL;
  const effectiveModel = selectedModel ?? autoModel;

  const livePrompt = buildPrompt(areas, style, dreams, !!referenceImageBase64, useCustom ? customPrompt : undefined);
  const activeTemplate = livePrompt.mode === 'image-to-image' ? IMAGE_TO_IMAGE_TEMPLATE : TEXT_TO_IMAGE_TEMPLATE;

  // Load active system prompt on mount
  useEffect(() => {
    fetch('/api/admin/system-prompt')
      .then((r) => r.json())
      .then((data: { text: string; source: 'db' | 'default'; presets: { label: string; text: string }[] }) => {
        setSystemPromptConfig({ savedText: data.text, source: data.source, presets: data.presets ?? [] });
        setSystemPromptDraft(data.text);
      })
      .catch(() => {/* silently ignore */});
  }, []);

  const saveSystemPrompt = async () => {
    if (!systemPromptDraft.trim()) return;
    setIsSavingSystemPrompt(true);
    setSystemPromptSaveStatus('idle');
    try {
      const res = await fetch('/api/admin/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: systemPromptDraft }),
      });
      if (res.ok) {
        setSystemPromptConfig((c) => c ? { ...c, savedText: systemPromptDraft, source: 'db' } : c);
        setSystemPromptSaveStatus('saved');
        setTimeout(() => setSystemPromptSaveStatus('idle'), 2500);
      } else {
        setSystemPromptSaveStatus('error');
      }
    } finally {
      setIsSavingSystemPrompt(false);
    }
  };

  const resetSystemPrompt = async () => {
    await fetch('/api/admin/system-prompt', { method: 'DELETE' });
    // Reload to get the default
    const res = await fetch('/api/admin/system-prompt');
    const data = await res.json() as { text: string; source: 'db' | 'default'; presets: { label: string; text: string }[] };
    setSystemPromptConfig({ savedText: data.text, source: data.source, presets: data.presets ?? [] });
    setSystemPromptDraft(data.text);
    setSystemPromptSaveStatus('idle');
  };

  const engineerLLMPrompt = async () => {
    setIsEngineeringPrompt(true);
    setLlmError(null);
    try {
      const res = await fetch('/api/admin/engineer-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Always pass the current draft so unsaved edits are tested immediately
        body: JSON.stringify({ areas, style, dreams, mode, systemPromptOverride: systemPromptDraft || undefined }),
      });
      const data = await res.json() as { prompt?: string; provider?: string; model?: string; systemPrompt?: string; userMessage?: string; error?: string };
      if (data.error || !data.prompt) {
        setLlmError(data.error ?? 'No prompt returned');
        return;
      }
      setLlmPreview({
        editedPrompt: data.prompt,
        provider: data.provider ?? '',
        model: data.model ?? '',
        systemPrompt: data.systemPrompt ?? '',
        userMessage: data.userMessage ?? '',
        inputSnapshot,
      });
      setInspectTab('user-msg');
    } finally {
      setIsEngineeringPrompt(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setReferencePreview(objectUrl);
    const base64 = await blobUrlToBase64(objectUrl);
    setReferenceImageBase64(base64);
  };

  const clearReference = () => {
    setReferenceImageBase64(null);
    setReferencePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setResult(null);
    setRating(null);
    try {
      // Determine prompt strategy:
      // 1. Custom override → send as customPrompt, no LLM
      // 2. LLM preview exists → send editedPrompt as customPrompt (already engineered)
      // 3. LLM on, no preview → let server run LLM
      // 4. LLM off → plain template
      const promptPayload: Record<string, unknown> = {};
      if (useCustom) {
        promptPayload.customPrompt = customPrompt;
        promptPayload.useLLM = false;
      } else if (useLLM && llmPreview) {
        promptPayload.customPrompt = llmPreview.editedPrompt;
        promptPayload.useLLM = false;
      } else {
        promptPayload.useLLM = useLLM;
      }

      const res = await fetch('/api/admin/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areas,
          style,
          dreams,
          ...promptPayload,
          referenceImageBase64: referenceImageBase64 ?? undefined,
          notes: notes || undefined,
          model: effectiveModel,
          steps,
          guidance,
          imagePromptStrength,
        }),
      });
      const data = (await res.json()) as GenerationResult;
      setResult(data);
      onGenerated();
    } catch {
      setResult({ test: { id: '', prompt: '' }, error: 'Network error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRating = async (r: number) => {
    if (!result?.test?.id) return;
    setSavingRating(true);
    setRating(r);
    await fetch('/api/admin/generate-test', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: result.test.id, rating: r }),
    });
    setSavingRating(false);
    onGenerated();
  };

  // Group models by provider for the selector
  const modelsByProvider = PROVIDERS.map((p) => ({
    ...p,
    models: IMAGE_MODELS.filter((m) => m.provider === p.id),
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

      {/* ── Left: Controls ─────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Controls</h2>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
            mode === 'image-to-image' ? 'bg-purple-900 text-purple-300' : 'bg-indigo-900 text-indigo-300',
          )}>
            {mode}
          </span>
        </div>

        {/* Model selector */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Model
            <span className="ml-2 text-gray-600 font-normal">
              (auto: <span className="text-gray-500">{autoModel.split('/').pop()}</span>)
            </span>
          </label>
          <div className="space-y-3">
            {modelsByProvider.map(({ id: providerId, label: providerLabel, models }) => (
              <div key={providerId}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">{providerLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  {models.map((m) => {
                    const isSelected = effectiveModel === m.id;
                    const isAuto = selectedModel === null && m.id === autoModel;
                    const canUse = m.capability === 'both' || m.capability === mode;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModel(selectedModel === m.id ? null : m.id)}
                        title={m.description + (m.notes ? ` — ${m.notes}` : '')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                          isSelected
                            ? PROVIDER_COLORS[providerId].replace('bg-', 'bg-').replace('text-', 'border-') + ' border ' + PROVIDER_COLORS[providerId]
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200',
                          !canUse && 'opacity-40',
                        )}
                      >
                        {m.label}
                        {isAuto && <span className="ml-1 text-[9px] opacity-70">auto</span>}
                        <span className="ml-1 text-[9px] opacity-50">{m.estimatedTime}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {selectedModel && (
            <button
              onClick={() => setSelectedModel(null)}
              className="mt-1.5 text-[10px] text-gray-500 hover:text-gray-300 underline"
            >
              Reset to auto
            </button>
          )}
        </div>

        {/* Life areas */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Life Areas</label>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <button key={a} onClick={() => toggleArea(a)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors',
                  areas.includes(a) ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Style</label>
          <div className="flex gap-2 flex-wrap">
            {STYLES.map((s) => (
              <button key={s} onClick={() => setStyle(s)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors',
                  style === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
                {s}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-mono">
            {(['mood', 'background', 'borders'] as const).map((k) => (
              <div key={k} className="bg-gray-800 rounded px-2 py-1">
                <span className="text-amber-400 block">{`{{${k.toUpperCase()}}}`}</span>
                <span className="text-gray-300 break-words">{STYLE_DATA[style][k]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Replicate-specific tuning — only shown for replicate models */}
        {IMAGE_MODELS.find((m) => m.id === effectiveModel)?.provider === 'replicate' && (
          <>
            {mode === 'text-to-image' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Steps <span className="text-gray-600">({steps})</span></label>
                  <input type="range" min={4} max={50} step={1} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full accent-indigo-500" />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>4 fast</span><span>50 quality</span></div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Guidance <span className="text-gray-600">({guidance})</span></label>
                  <input type="range" min={1} max={10} step={0.5} value={guidance} onChange={(e) => setGuidance(Number(e.target.value))} className="w-full accent-indigo-500" />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>1 free</span><span>10 strict</span></div>
                </div>
              </div>
            )}
            {mode === 'image-to-image' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Image Prompt Strength <span className="text-gray-600">({imagePromptStrength})</span>
                </label>
                <input type="range" min={0.1} max={0.9} step={0.05} value={imagePromptStrength}
                  onChange={(e) => setImagePromptStrength(Number(e.target.value))} className="w-full accent-purple-500" />
                <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                  <span>0.1 — subtle</span><span>0.9 — strong copy</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reference image */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Reference Photo (triggers image-to-image)</label>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          {referencePreview ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={referencePreview} alt="Reference" className="w-16 h-20 rounded-lg object-cover border border-gray-700" />
              <div>
                <p className="text-xs text-purple-400 font-medium">image-to-image mode</p>
                <button onClick={clearReference} className="text-xs text-red-500 hover:text-red-400 mt-1">Remove photo</button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 rounded-lg border border-dashed border-gray-700 text-xs text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors">
              + Upload reference photo
            </button>
          )}
        </div>

        {/* Dreams */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Dreams / Context</label>
          <textarea value={dreams} onChange={(e) => setDreams(e.target.value)} rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 resize-none" />
        </div>

        {/* LLM enhancement toggle */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-400 cursor-pointer">
            <input type="checkbox" checked={useLLM && !useCustom} onChange={(e) => setUseLLM(e.target.checked)} disabled={useCustom} className="accent-amber-500" />
            <span className={useCustom ? 'opacity-40' : ''}>
              LLM prompt engineering
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400 text-[9px] font-bold uppercase tracking-wider">GPT-4o mini</span>
            </span>
          </label>
          {useLLM && !useCustom && (
            <p className="mt-1 ml-5 text-[10px] text-gray-600">
              GPT-4o mini rewrites the prompt into a hyper-specific photorealistic vision board before sending to the image model.
            </p>
          )}
        </div>

        {/* Custom prompt toggle */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-400 cursor-pointer mb-2">
            <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} className="accent-indigo-500" />
            Override with custom prompt (bypasses template + LLM)
          </label>
          {useCustom && (
            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 resize-none font-mono"
              placeholder="Enter full custom prompt…" />
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Run notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
            placeholder="e.g. testing ideogram for minimal style…" />
        </div>

        <button onClick={generate} disabled={isGenerating || areas.length === 0}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          {isGenerating ? (
            <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Generating…</>
          ) : useLLM && !useCustom && llmPreview
            ? `Generate with engineered prompt →`
            : `Generate with ${IMAGE_MODELS.find((m) => m.id === effectiveModel)?.label ?? effectiveModel}`}
        </button>
      </div>


      {/* ── Right: Prompt Preview + System Prompt Config + Result ─────── */}
      <div className="space-y-5">

        {/* 1. Prompt Preview — the star of the show */}
        <div className={cn(
          'rounded-xl border bg-gray-900 overflow-hidden',
          useLLM && !useCustom ? 'border-amber-900/40' : 'border-gray-800',
        )}>
          {/* Header */}
          <div className={cn(
            'flex items-center justify-between px-4 py-2.5 border-b',
            useLLM && !useCustom ? 'border-amber-900/40 bg-amber-950/20' : 'border-gray-800',
          )}>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold', useLLM && !useCustom ? 'text-amber-300' : 'text-white')}>
                {useCustom ? 'Custom Prompt' : useLLM ? 'Engineered Prompt' : 'Template Prompt'}
              </span>
              {llmPreview && useLLM && !useCustom && (
                <span className="px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                  {llmPreview.model}
                </span>
              )}
              {isLlmPreviewStale && (
                <span className="text-[9px] text-orange-400 font-semibold">&#9888; stale</span>
              )}
            </div>
            {useLLM && !useCustom && (
              <button
                onClick={engineerLLMPrompt}
                disabled={isEngineeringPrompt || areas.length === 0}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all',
                  isEngineeringPrompt
                    ? 'bg-amber-900/30 text-amber-600 cursor-not-allowed'
                    : llmPreview
                    ? 'bg-gray-800 hover:bg-gray-700 text-amber-400 border border-amber-900/50'
                    : 'bg-amber-600 hover:bg-amber-500 text-white',
                )}
              >
                {isEngineeringPrompt ? (
                  <><span className="w-3 h-3 rounded-full border-2 border-amber-300/30 border-t-amber-300 animate-spin" />Engineering…</>
                ) : llmPreview ? '↺ Re-engineer' : '⚡ Engineer Prompt'}
              </button>
            )}
          </div>

          {/* Error */}
          {llmError && (
            <div className="px-4 py-2 bg-red-900/20 border-b border-red-900/40 text-xs text-red-400 font-mono">
              {llmError}
            </div>
          )}

          {/* Body — four states */}
          {useCustom ? (
            <div className="p-4 max-h-72 overflow-y-auto">
              {customPrompt
                ? <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">{customPrompt}</pre>
                : <p className="text-xs text-gray-700 italic">No custom prompt entered yet.</p>}
            </div>
          ) : !useLLM ? (
            <div className="p-4 max-h-72 overflow-y-auto">
              <HydratedView hydrated={livePrompt.hydrated} variables={livePrompt.variables} />
            </div>
          ) : !llmPreview && !isEngineeringPrompt ? (
            <div className="flex flex-col items-center justify-center gap-5 py-14 px-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/50 border border-amber-900/40 flex items-center justify-center text-3xl select-none">
                &#9889;
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-200 mb-2">Engineer your prompt</p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                  GPT-4o mini reads your dream life description and writes a hyper-specific,
                  photorealistic vision board prompt optimised for Flux.
                </p>
              </div>
              <button
                onClick={engineerLLMPrompt}
                disabled={areas.length === 0}
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-lg shadow-amber-900/30"
              >
                &#9889; Engineer Prompt
              </button>
              <p className="text-[10px] text-gray-700">
                Using: {systemPromptConfig?.source === 'db' ? 'saved system prompt (DB)' : 'default system prompt'}
              </p>
            </div>
          ) : isEngineeringPrompt && !llmPreview ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
              <p className="text-sm text-amber-400 font-medium">Engineering your prompt…</p>
              <p className="text-xs text-gray-600">GPT-4o mini is crafting your vision board prompt</p>
            </div>
          ) : llmPreview ? (
            <div className="p-4 space-y-3">
              {isEngineeringPrompt && (
                <div className="flex items-center gap-2 text-[10px] text-amber-500">
                  <span className="w-3 h-3 rounded-full border border-amber-500/30 border-t-amber-500 animate-spin" />
                  Re-engineering…
                </div>
              )}
              <textarea
                value={llmPreview.editedPrompt}
                onChange={(e) => setLlmPreview((p) => p ? { ...p, editedPrompt: e.target.value } : p)}
                rows={16}
                className="w-full bg-gray-800/60 border border-amber-900/40 rounded-xl px-4 py-3 text-sm text-amber-100 font-sans focus:outline-none focus:border-amber-500 resize-y leading-relaxed"
              />
              <div className="flex items-center justify-between text-[10px] text-gray-600">
                <span>{llmPreview.editedPrompt.split(/\s+/).filter(Boolean).length} words</span>
                <span>edit freely — this exact text goes to the image model</span>
              </div>

              {/* Inspect pipeline (collapsible) */}
              <details className="group">
                <summary className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer select-none list-none">
                  <span className="inline-block transition-transform group-open:rotate-90 text-[8px]">&#9654;</span>
                  Inspect pipeline
                </summary>
                <div className="mt-2 rounded-lg border border-gray-800 bg-gray-900/60 overflow-hidden">
                  <div className="flex border-b border-gray-800">
                    {(['user-msg', 'template'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setInspectTab(t)}
                        className={cn(
                          'px-3 py-1.5 text-[10px] font-medium transition-colors border-b-2',
                          inspectTab === t ? 'text-amber-300 border-amber-500' : 'text-gray-500 border-transparent hover:text-gray-300',
                        )}
                      >
                        {t === 'user-msg' ? 'User Message' : 'Template'}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 max-h-48 overflow-y-auto">
                    {inspectTab === 'user-msg' && (
                      <pre className="text-[11px] font-mono text-sky-300 whitespace-pre-wrap leading-relaxed">
                        {llmPreview.userMessage}
                      </pre>
                    )}
                    {inspectTab === 'template' && (
                      <HydratedView hydrated={livePrompt.hydrated} variables={livePrompt.variables} />
                    )}
                  </div>
                </div>
              </details>
            </div>
          ) : null}
        </div>

        {/* 2. System Prompt Config (collapsible) */}
        {useLLM && !useCustom && (
          <details className="group rounded-xl border border-gray-800 open:border-amber-900/30 bg-gray-900 overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none list-none hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 group-open:text-amber-300 transition-colors">
                  System Prompt
                </span>
                {systemPromptConfig?.source === 'db' && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-500 text-[9px] font-bold uppercase tracking-wider">
                    saved
                  </span>
                )}
                {systemPromptDraft !== systemPromptConfig?.savedText && (
                  <span className="text-[9px] text-orange-400 font-semibold">&#9679; unsaved</span>
                )}
                {systemPromptSaveStatus === 'saved' && (
                  <span className="text-[9px] text-green-400 font-semibold">&#10003;</span>
                )}
              </div>
              <span className="text-gray-600 text-xs">&#9660;</span>
            </summary>
            <div className="border-t border-gray-800 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className={cn('text-[9px] font-bold uppercase tracking-wider',
                  systemPromptConfig?.source === 'db' ? 'text-amber-400' : 'text-gray-500')}>
                  {systemPromptConfig?.source === 'db' ? '&#10003; saved — live for all users' : 'using hardcoded default'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-700">
                    {systemPromptDraft.split(/\s+/).filter(Boolean).length}w
                  </span>
                  <button
                    onClick={saveSystemPrompt}
                    disabled={isSavingSystemPrompt || !systemPromptDraft.trim() || systemPromptDraft === systemPromptConfig?.savedText}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    {isSavingSystemPrompt ? 'Saving…' : 'Save to production'}
                  </button>
                  {systemPromptConfig?.source === 'db' && (
                    <button onClick={resetSystemPrompt}
                      className="px-2.5 py-1 rounded-lg text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors">
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={systemPromptDraft}
                onChange={(e) => setSystemPromptDraft(e.target.value)}
                rows={12}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-[11px] text-gray-300 font-mono focus:outline-none focus:border-amber-600 resize-y leading-relaxed"
              />
              {systemPromptConfig && systemPromptConfig.presets.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-gray-600">Presets:</span>
                  {systemPromptConfig.presets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setSystemPromptDraft(preset.text)}
                      className="px-2.5 py-1 rounded-lg text-[10px] bg-gray-800 text-gray-400 hover:text-amber-300 border border-gray-700 hover:border-amber-800 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-700">
                Edits apply to the next Engineer Prompt run immediately. Save to production to apply for all users.
              </p>
            </div>
          </details>
        )}

        {/* 3. Result */}
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Result</h2>

          {!result && !isGenerating && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 h-80 flex items-center justify-center">
              <p className="text-gray-600 text-sm">Output will appear here</p>
            </div>
          )}

          {isGenerating && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 h-80 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <p className="text-gray-400 text-sm">
                {IMAGE_MODELS.find((m) => m.id === effectiveModel)?.label ?? effectiveModel} — {mode}
              </p>
              <p className="text-gray-600 text-xs">
                est. {IMAGE_MODELS.find((m) => m.id === effectiveModel)?.estimatedTime ?? '…'}
              </p>
            </div>
          )}

          {result && !isGenerating && (
            <div className="space-y-4">
              {result.error && (
                <div className="rounded-lg bg-red-900/30 border border-red-700 p-3 text-sm text-red-300 font-mono">
                  {result.error}
                </div>
              )}

              {result.test?.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.test.imageUrl} alt="Generated" className="w-full max-h-[560px] object-contain bg-gray-900" />
                </div>
              )}

              {result.promptInfo && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    result.promptInfo.mode === 'image-to-image' ? 'bg-purple-900 text-purple-300' : 'bg-indigo-900 text-indigo-300',
                  )}>
                    {result.promptInfo.mode}
                  </span>
                  {result.provider && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      PROVIDER_COLORS[result.provider] ?? 'bg-gray-800 text-gray-400',
                    )}>
                      {result.provider}
                    </span>
                  )}
                  {result.resolvedModel && (
                    <span className="text-xs text-gray-500 font-mono">
                      {result.resolvedModel.split('/').pop() ?? result.resolvedModel}
                    </span>
                  )}
                </div>
              )}

              {result.test?.imageUrl && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium">Rate:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button key={r} onClick={() => saveRating(r)} disabled={savingRating}
                        className={cn('w-8 h-8 rounded-lg text-sm font-bold transition-colors',
                          rating === r ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
                        {r}
                      </button>
                    ))}
                  </div>
                  {rating && <span className="text-xs text-gray-500">saved</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
