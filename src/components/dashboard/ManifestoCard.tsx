'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Heart, Copy, Check, Pencil, Lock, X, Plus,
} from 'lucide-react';
import type { Board } from '@/lib/db/schema';
import type { LifeArea, AestheticStyle, Goal } from '@/lib/validations/wizard';
import { getExplorerItems } from '@/lib/wizard/explorationPrompts';
import { buildManifestoDocument } from '@/lib/manifesto';
import { cn } from '@/lib/utils';

const AREA_LABELS: Record<string, string> = {
  career: 'Career & Purpose',
  love: 'Love & Relationships',
  health: 'Health & Vitality',
  travel: 'Travel & Adventure',
  wealth: 'Wealth & Abundance',
  creativity: 'Creativity & Joy',
};

const STYLE_NAMES: Record<AestheticStyle, string> = {
  minimal: 'Minimal',
  vibrant: 'Vibrant',
  ethereal: 'Ethereal',
  luxe: 'Luxe',
};

const ALL_AREAS: LifeArea[] = ['career', 'love', 'health', 'travel', 'wealth', 'creativity'];
const ALL_STYLES: AestheticStyle[] = ['minimal', 'vibrant', 'ethereal', 'luxe'];

type ExplorerData = {
  promptStates?: Array<{ selectedIndices: number[]; edits: Record<number, string>; customText: string }>;
  priorities?: Record<string, { want: number; believe: number }>;
};

interface Props {
  board: Board;
  isPaid: boolean;
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-sage/12" />
      <p className="font-sans text-[10px] font-semibold text-forest/35 uppercase tracking-[0.18em] whitespace-nowrap">
        {label}
      </p>
      <div className="flex-1 h-px bg-sage/12" />
    </div>
  );
}

function AutoTextarea({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  className: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={className}
    />
  );
}

export function ManifestoCard({ board, isPaid }: Props) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showLockHint, setShowLockHint] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [dreams, setDreams] = useState(board.dreams ?? '');
  const [areas, setAreas] = useState<LifeArea[]>(board.selectedAreas as LifeArea[]);
  const [style, setStyle] = useState<AestheticStyle>(board.style as AestheticStyle);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>(board.selectedQuotes ?? []);
  const [customQuotes, setCustomQuotes] = useState<string[]>(board.customQuotes ?? []);
  const [goals, setGoals] = useState<Goal[]>((board.goals as Goal[]) ?? []);
  const [newQuote, setNewQuote] = useState('');

  const explorerData = board.explorerData as ExplorerData | null;
  const explorerItems = getExplorerItems(explorerData?.promptStates);
  const allQuotes = [...selectedQuotes, ...customQuotes];
  const activeGoals = goals.filter((g) => g.objective?.trim());

  const manifestoText = buildManifestoDocument({
    dreams,
    selectedAreas: areas,
    style,
    goals,
    selectedQuotes,
    customQuotes,
    explorerData: board.explorerData,
    photoUrls: board.photoUrls,
  });

  const handleCopy = () => {
    void navigator.clipboard.writeText(manifestoText);
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
    setDreams(board.dreams ?? '');
    setAreas(board.selectedAreas as LifeArea[]);
    setStyle(board.style as AestheticStyle);
    setSelectedQuotes(board.selectedQuotes ?? []);
    setCustomQuotes(board.customQuotes ?? []);
    setGoals((board.goals as Goal[]) ?? []);
    setNewQuote('');
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedAreas: areas,
          dreams,
          style,
          goals: goals.filter((g) => g.objective.trim() || g.habit.trim()),
          manifesto: board.manifesto ?? undefined,
          enableTimeline: board.enableTimeline ?? false,
          photoUrls: board.photoUrls ?? [],
          explorerData: board.explorerData,
          selectedOffers: board.selectedOffers ?? ['wallpaper'],
          selectedQuotes,
          customQuotes,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setIsEditing(false);
    } catch {
      setSaveError('Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [board, areas, dreams, style, goals, selectedQuotes, customQuotes]);

  const toggleArea = (area: LifeArea) => {
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const getGoal = (area: LifeArea): Goal =>
    goals.find((g) => g.area === area) ?? { area, objective: '', habit: '' };

  const updateGoal = (area: LifeArea, patch: Partial<Omit<Goal, 'area'>>) => {
    setGoals((prev) => {
      const existing = prev.find((g) => g.area === area);
      return existing
        ? prev.map((g) => (g.area === area ? { ...g, ...patch } : g))
        : [...prev, { area, objective: '', habit: '', ...patch }];
    });
  };

  const addQuote = () => {
    const q = newQuote.trim();
    if (!q) return;
    setCustomQuotes((prev) => [...prev, q]);
    setNewQuote('');
  };

  const removeQuote = (q: string) => {
    setSelectedQuotes((prev) => prev.filter((x) => x !== q));
    setCustomQuotes((prev) => prev.filter((x) => x !== q));
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
                disabled={isSaving || areas.length === 0}
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
      <div className="px-6 pb-8 flex flex-col gap-5">

        {/* Document title */}
        <div className="text-center py-3 border-y border-sage/10">
          <p className="font-display text-xs font-semibold text-gold/80 tracking-[0.22em] uppercase">
            ✦ My Dream Life Manifesto ✦
          </p>
        </div>

        {/* My Dream Life */}
        {(dreams.trim() || isEditing) && (
          <div className="flex flex-col gap-3">
            <SectionDivider label="My Dream Life" />
            {isEditing ? (
              <AutoTextarea
                value={dreams}
                onChange={setDreams}
                placeholder="Describe your dream life..."
                className="w-full font-sans text-sm text-forest/80 leading-relaxed bg-transparent resize-none outline-none border-b border-dashed border-sage/30 focus:border-sage transition-colors pb-1"
              />
            ) : (
              <p className="font-sans text-sm text-forest/80 leading-relaxed">{dreams}</p>
            )}
          </div>
        )}

        {/* Prioritized Dreams */}
        {explorerItems.length > 0 && (
          <div className="flex flex-col gap-3">
            <SectionDivider label="My Prioritized Dreams" />
            <ol className="flex flex-col gap-2.5">
              {explorerItems.map((item, i) => {
                const p = explorerData?.priorities?.[item.text];
                return (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="font-display text-sm font-semibold text-gold/60 flex-shrink-0 w-5 text-right mt-px">
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-sans text-sm text-forest/80 leading-snug">{item.text}</span>
                      {p && (
                        <span className="ml-2 font-sans text-[10px] text-forest/30 whitespace-nowrap">
                          want {p.want}/10 · believe {p.believe}/10
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Life Areas */}
        {(areas.length > 0 || isEditing) && (
          <div className="flex flex-col gap-3">
            <SectionDivider label="Life Areas I'm Focusing On" />
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {ALL_AREAS.map((area) => {
                  const active = areas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className={cn(
                        'px-3 py-1.5 rounded-full font-sans text-xs font-medium border transition-all',
                        active
                          ? 'bg-sage text-white border-sage'
                          : 'bg-cream text-forest/30 border-sage/10 line-through hover:border-sage/25 hover:text-forest/45',
                      )}
                    >
                      {AREA_LABELS[area]}
                    </button>
                  );
                })}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {areas.map((area) => (
                  <li key={area} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage/40 flex-shrink-0" />
                    <span className="font-sans text-sm text-forest/80">{AREA_LABELS[area] ?? area}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Quotes & Affirmations */}
        {(allQuotes.length > 0 || isEditing) && (
          <div className="flex flex-col gap-3">
            <SectionDivider label="Quotes & Affirmations" />
            <div className="flex flex-col gap-3">
              {allQuotes.map((q) => (
                <div key={q} className={cn('relative group', isEditing && 'pr-7')}>
                  <p className="font-display italic text-sm text-forest/70 leading-relaxed">
                    &ldquo;{q}&rdquo;
                  </p>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeQuote(q)}
                      aria-label="Remove quote"
                      className="absolute right-0 top-0.5 text-forest/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {isEditing && (
                <div className="flex items-center gap-2 border-b border-dashed border-sage/30 pb-0.5">
                  <input
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addQuote()}
                    placeholder="Add a quote or affirmation..."
                    className="flex-1 font-display italic text-sm text-forest/70 bg-transparent outline-none placeholder:not-italic placeholder:font-sans placeholder:text-forest/30 placeholder:text-xs"
                  />
                  {newQuote.trim() && (
                    <button
                      type="button"
                      onClick={addQuote}
                      className="text-sage hover:text-sage/70 transition-colors flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Goals & Habits */}
        {(activeGoals.length > 0 || isEditing) && (
          <div className="flex flex-col gap-3">
            <SectionDivider label="My Goals & Habits" />
            <div className="flex flex-col gap-3">
              {isEditing ? (
                ALL_AREAS.filter((area) => areas.includes(area)).map((area) => {
                  const goal = getGoal(area);
                  return (
                    <div key={area} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage/40 flex-shrink-0" />
                        <input
                          value={goal.objective}
                          onChange={(e) => updateGoal(area, { objective: e.target.value })}
                          placeholder={`${AREA_LABELS[area]} goal...`}
                          className="flex-1 font-sans text-sm text-forest/80 bg-transparent outline-none border-b border-dashed border-sage/30 focus:border-sage transition-colors pb-0.5 min-w-0"
                        />
                      </div>
                      <div className="pl-4 flex items-center gap-2">
                        <span className="font-sans text-[11px] text-forest/35 flex-shrink-0">Daily:</span>
                        <input
                          value={goal.habit}
                          onChange={(e) => updateGoal(area, { habit: e.target.value })}
                          placeholder="daily habit..."
                          className="flex-1 font-sans text-xs text-forest/55 bg-transparent outline-none border-b border-dashed border-sage/20 focus:border-sage/50 transition-colors pb-0.5 min-w-0"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                activeGoals.map((g) => (
                  <div key={g.area} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage/40 flex-shrink-0" />
                      <span className="font-sans text-sm text-forest/80">{g.objective}</span>
                    </div>
                    {g.habit?.trim() && (
                      <p className="font-sans text-xs text-forest/50 pl-4">Daily: {g.habit}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Visual Aesthetic */}
        <div className="flex flex-col gap-3">
          <SectionDivider label="Visual Aesthetic" />
          {isEditing ? (
            <div className="flex gap-2 flex-wrap">
              {ALL_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-full font-sans text-xs font-medium border transition-all',
                    style === s
                      ? 'bg-sage text-white border-sage'
                      : 'bg-cream text-forest/60 border-sage/20 hover:border-sage/40',
                  )}
                >
                  {STYLE_NAMES[s]}
                </button>
              ))}
            </div>
          ) : (
            <p className="font-sans text-sm text-forest/80">{STYLE_NAMES[style] ?? style}</p>
          )}
        </div>

        {/* Photo note */}
        {(board.photoUrls?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-3">
            <SectionDivider label="Note" />
            <p className="font-sans text-sm text-forest/60 italic">
              Uploaded image files are included separately and help personalize your visual board.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
