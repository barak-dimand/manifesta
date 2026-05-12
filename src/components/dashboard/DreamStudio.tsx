'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Wand2, Download, ChevronDown, ChevronUp, Check,
  X, Heart, Briefcase, Globe, TrendingUp, Palette, Zap,
  ImageIcon, Quote, Target, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WallpaperCard } from '@/components/dashboard/WallpaperCard';
import type { Board, GeneratedWallpaper } from '@/lib/db/schema';
import type { LifeArea, AestheticStyle, Goal } from '@/lib/validations/wizard';
import { getExplorerItems } from '@/lib/wizard/explorationPrompts';
import { cn } from '@/lib/utils';

// ── Static data ────────────────────────────────────────────────────────────────

const AREA_META: Record<LifeArea, { label: string; Icon: React.ElementType }> = {
  career: { label: 'Career', Icon: Briefcase },
  love: { label: 'Love', Icon: Heart },
  health: { label: 'Health', Icon: Zap },
  travel: { label: 'Travel', Icon: Globe },
  wealth: { label: 'Wealth', Icon: TrendingUp },
  creativity: { label: 'Creativity', Icon: Palette },
};

const ALL_AREAS: LifeArea[] = ['career', 'love', 'health', 'travel', 'wealth', 'creativity'];

const STYLE_OPTIONS: { id: AestheticStyle; name: string; desc: string; gradient: string; accent: string }[] = [
  { id: 'minimal', name: 'Clean & Minimal', desc: 'Soft tones, serene', gradient: 'from-slate-100 to-gray-50', accent: 'border-slate-300' },
  { id: 'vibrant', name: 'Bold & Vibrant', desc: 'Rich colors, high energy', gradient: 'from-purple-100 to-pink-50', accent: 'border-purple-400' },
  { id: 'ethereal', name: 'Ethereal & Dreamy', desc: 'Pastels, magical', gradient: 'from-sky-50 to-indigo-50', accent: 'border-indigo-300' },
  { id: 'luxe', name: 'Luxe & Elevated', desc: 'Gold accents, refined', gradient: 'from-amber-50 to-yellow-50', accent: 'border-amber-400' },
];

const GOAL_SUGGESTIONS: Record<LifeArea, string[]> = {
  career: ['Launch a business generating $10k/month', 'Leave my 9-5 and work entirely for myself', 'Get promoted to a senior leadership role'],
  love: ['Build a deeply loving, committed relationship', 'Strengthen my closest friendships', 'Heal past patterns and show up fully'],
  health: ['Get lean, strong, and feel energetic every day', 'Complete a marathon or major fitness challenge', 'Build a consistent sleep routine'],
  travel: ['Visit 3 new countries this year', 'Take a solo trip that changes my perspective', 'Live as a digital nomad for 3 months'],
  wealth: ['Build a 6-month emergency fund', 'Invest consistently and grow my net worth by 30%', 'Pay off all high-interest debt'],
  creativity: ['Complete and share a creative project I am proud of', 'Launch a creative side project or brand', 'Master a new creative skill'],
};

const HABIT_SUGGESTIONS: Record<LifeArea, string[]> = {
  career: ['Work on my business for 1 focused hour before 9am', 'Review my top 3 priorities every morning', 'Block 2 hours of deep work daily'],
  love: ['Express gratitude to someone I love daily', 'Put my phone away during quality time', 'Journal for 10 min about my feelings'],
  health: ['Move my body for 30 minutes every morning', 'Drink 2L of water and eat a nourishing breakfast', 'Be in bed by 10:30pm, no screens'],
  travel: ['Save $20 daily into a travel fund', 'Research one upcoming trip each Sunday', 'Learn 5 phrases in a new language weekly'],
  wealth: ['Track every expense and review finances Sunday', 'Auto-invest a fixed amount on every payday', 'Read 15 min of finance content daily'],
  creativity: ['Create something for 20 min daily', 'Share one piece of work publicly each week', 'Attend one creative class per month'],
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  board: Board;
  initialImages: GeneratedWallpaper[];
  initialRemaining: number;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DreamStudio({ board, initialImages, initialRemaining }: Props) {
  // Editable dream inputs
  const [areas, setAreas] = useState<LifeArea[]>(board.selectedAreas as LifeArea[]);
  const [style, setStyle] = useState<AestheticStyle>(board.style as AestheticStyle);
  const [dreams, setDreams] = useState(board.dreams);
  const [photoUrls] = useState<string[]>(board.photoUrls ?? []);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>(board.selectedQuotes ?? []);
  const [customQuotes, setCustomQuotes] = useState<string[]>(board.customQuotes ?? []);
  const [goals, setGoals] = useState<Goal[]>((board.goals as Goal[]) ?? []);

  // UI state
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [images, setImages] = useState<GeneratedWallpaper[]>(initialImages);
  const [latestImageUrl, setLatestImageUrl] = useState<string | null>(initialImages[0]?.imageUrl ?? null);

  // Section expand state
  const [dreamsExpanded, setDreamsExpanded] = useState(false);
  const [quotesExpanded, setQuotesExpanded] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [openGoalAreas, setOpenGoalAreas] = useState<Record<string, boolean>>({});

  const dreamsRef = useRef<HTMLTextAreaElement>(null);
  const generatedRef = useRef<HTMLDivElement>(null);

  // ── Save ──────────────────────────────────────────────────────────────────

  const saveBoard = useCallback(async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/boards/${board.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedAreas: areas,
          dreams,
          style,
          goals: goals.filter((g) => g.objective.trim() || g.habit.trim()),
          manifesto: board.manifesto ?? undefined,
          enableTimeline: board.enableTimeline ?? false,
          photoUrls: photoUrls.filter((p) => p.startsWith('http')),
          explorerData: board.explorerData,
          selectedOffers: board.selectedOffers ?? ['wallpaper'],
          selectedQuotes,
          customQuotes,
          gender: board.gender ?? undefined,
        }),
      });
      setIsDirty(false);
    } catch {
      // Non-fatal — generate continues regardless
    } finally {
      setIsSaving(false);
    }
  }, [board, areas, dreams, style, goals, photoUrls, selectedQuotes, customQuotes]);

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (remaining <= 0) {
      setGenerateError('Daily generation limit reached. Come back tomorrow!');
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);

    // Save first if dirty
    if (isDirty) await saveBoard();

    try {
      const res = await fetch('/api/wallpaper/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreams,
          style,
          areas,
          manifesto: board.manifesto ?? undefined,
          boardId: board.id,
        }),
      });
      const data = (await res.json()) as {
        imageUrl?: string;
        savedId?: string;
        mode?: string;
        remaining?: number;
        error?: string;
        detail?: string;
      };

      if (!res.ok) {
        const msg = data.error === 'daily_limit_reached'
          ? 'Daily generation limit reached. Come back tomorrow!'
          : data.error === 'billing_required'
          ? 'Image generation is temporarily unavailable. Please try again later.'
          : (data.detail ?? 'Something went wrong. Please try again.');
        setGenerateError(msg);
        return;
      }

      if (data.imageUrl) {
        setLatestImageUrl(data.imageUrl);
        const newImg: GeneratedWallpaper = {
          id: data.savedId ?? '',
          userId: board.userId,
          boardId: board.id,
          imageUrl: data.imageUrl,
          manifesto: board.manifesto ?? null,
          dreams,
          style,
          areas,
          mode: data.mode ?? 'text-to-image',
          createdAt: new Date(),
        };
        setImages((prev) => [newImg, ...prev]);
        if (data.remaining !== undefined) setRemaining(data.remaining);

        // Scroll to the new image
        setTimeout(() => generatedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } catch {
      setGenerateError('Connection error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [board, areas, dreams, style, remaining, isDirty, saveBoard]);

  // ── Input handlers ────────────────────────────────────────────────────────

  const toggleArea = (area: LifeArea) => {
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
    setIsDirty(true);
  };

  const changeStyle = (s: AestheticStyle) => {
    setStyle(s);
    setIsDirty(true);
  };

  const changeDreams = (val: string) => {
    setDreams(val.slice(0, 1500));
    setIsDirty(true);
  };

  const removeQuote = (q: string) => {
    setSelectedQuotes((prev) => prev.filter((x) => x !== q));
    setCustomQuotes((prev) => prev.filter((x) => x !== q));
    setIsDirty(true);
  };

  const getGoal = (area: LifeArea): Goal =>
    goals.find((g) => g.area === area) ?? { area, objective: '', habit: '' };

  const updateGoal = (area: LifeArea, patch: Partial<Omit<Goal, 'area'>>) => {
    const existing = goals.find((g) => g.area === area);
    setGoals(existing
      ? goals.map((g) => (g.area === area ? { ...g, ...patch } : g))
      : [...goals, { area, objective: '', habit: '', ...patch }],
    );
    setIsDirty(true);
  };

  const allQuotes = [...selectedQuotes, ...customQuotes];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-10">

      {/* ── Visual + Generate ──────────────────────────────────────────── */}
      <section ref={generatedRef} className="flex flex-col items-center gap-6">

        {/* Latest image */}
        {latestImageUrl ? (
          <motion.div
            key={latestImageUrl}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden shadow-lg border border-sage/20 w-full"
            style={{ maxHeight: 480 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={latestImageUrl}
              alt="Your dream board"
              className="w-full object-cover"
              style={{ maxHeight: 480 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="flex flex-wrap gap-1.5">
                {areas.map((a) => (
                  <span key={a} className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-sans font-medium capitalize border border-white/20">
                    {a}
                  </span>
                ))}
              </div>
              <a
                href={latestImageUrl}
                download="manifesta-dream-board.jpg"
                className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                title="Download"
              >
                <Download className="w-3.5 h-3.5 text-forest" />
              </a>
            </div>
          </motion.div>
        ) : (
          <div className="w-full rounded-2xl border-2 border-dashed border-sage/20 bg-gradient-to-br from-sage-light/30 to-gold/5 flex flex-col items-center justify-center gap-3 py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-gold/60" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-forest/70 mb-1">No image generated yet</p>
              <p className="font-sans text-sm text-forest/40">
                Refine your dream below, then hit Generate to bring it to life.
              </p>
            </div>
          </div>
        )}

        {/* Generate button */}
        <div className="w-full flex flex-col gap-3">
          <Button
            variant="gold"
            size="lg"
            className="w-full text-base font-semibold gap-2.5"
            onClick={() => void handleGenerate()}
            disabled={isGenerating || areas.length === 0}
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin flex-shrink-0" />
                Painting your vision… (~30 sec)
              </>
            ) : isDirty ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Save Changes & Generate
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Dream Board
              </>
            )}
          </Button>

          {/* Status row */}
          <div className="flex items-center justify-between px-1">
            {generateError ? (
              <p className="flex items-center gap-1.5 font-sans text-xs text-red-500">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {generateError}
              </p>
            ) : (
              <p className="font-sans text-xs text-forest/40">
                {remaining > 0
                  ? `${remaining} generation${remaining === 1 ? '' : 's'} remaining today`
                  : 'Daily limit reached — resets tomorrow'}
              </p>
            )}
            {isDirty && !isGenerating && (
              <button
                type="button"
                onClick={() => void saveBoard()}
                disabled={isSaving}
                className="font-sans text-xs text-sage hover:text-forest transition-colors"
              >
                {isSaving ? 'Saving…' : 'Save only'}
              </button>
            )}
          </div>
        </div>

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full rounded-xl bg-sage-light/40 border border-sage/20 px-4 py-3 flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-sage animate-pulse flex-shrink-0" />
            <div>
              <p className="font-sans text-sm font-medium text-forest">Our AI is reading your dream and painting your vision</p>
              <p className="font-sans text-xs text-forest/50 mt-0.5">This usually takes 20-40 seconds. Don&apos;t close this tab.</p>
            </div>
          </motion.div>
        )}
      </section>

      {/* ── Dream Definition ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-semibold text-forest">Your Dream Definition</h2>
          <p className="font-sans text-sm text-forest/50 mt-1">
            Everything below shapes your next generated image. Edit freely and regenerate.
          </p>
        </div>

        {/* ── Areas ── */}
        <DreamCard
          title="Life Areas"
          subtitle="Which parts of life are you transforming?"
          icon={<Sparkles className="w-4 h-4 text-gold" />}
          isDirty={false}
        >
          <div className="flex flex-wrap gap-2">
            {ALL_AREAS.map((area) => {
              const { label, Icon } = AREA_META[area];
              const selected = areas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-sans text-sm font-medium transition-all duration-200',
                    selected
                      ? 'bg-sage border-sage text-white shadow-sm'
                      : 'bg-cream border-sage/20 text-forest hover:border-sage/50 hover:bg-sage-light/40',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {selected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
          {areas.length === 0 && (
            <p className="font-sans text-xs text-red-400 mt-1">Select at least one area to generate.</p>
          )}
        </DreamCard>

        {/* ── Style ── */}
        <DreamCard
          title="Aesthetic Style"
          subtitle="The visual mood of your dream board"
          icon={<Palette className="w-4 h-4 text-sage" />}
          isDirty={false}
        >
          <div className="grid grid-cols-2 gap-2">
            {STYLE_OPTIONS.map((opt) => {
              const selected = style === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => changeStyle(opt.id)}
                  className={cn(
                    'relative rounded-xl border-2 p-4 text-left transition-all duration-200 bg-gradient-to-br',
                    opt.gradient,
                    selected
                      ? `${opt.accent} shadow-sm`
                      : 'border-transparent hover:border-sage/30',
                  )}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sage flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <p className="font-sans text-xs font-semibold text-forest leading-tight">{opt.name}</p>
                  <p className="font-sans text-[11px] text-forest/50 mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </DreamCard>

        {/* ── Dream Description ── */}
        <DreamCard
          title="Dream Description"
          subtitle="The words that define your vision"
          icon={<Wand2 className="w-4 h-4 text-sage" />}
          isDirty={false}
        >
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="wait">
              {dreamsExpanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-2"
                >
                  <textarea
                    ref={dreamsRef}
                    value={dreams}
                    onChange={(e) => changeDreams(e.target.value)}
                    className="w-full min-h-[160px] rounded-xl border-2 border-sage/20 bg-white/70 p-4 font-sans text-sm text-forest placeholder:text-forest/30 focus:border-sage focus:outline-none transition-colors resize-none leading-relaxed"
                    placeholder="Describe your dream life in as much detail as possible…"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs text-forest/40">{dreams.length}/1500</span>
                    <button
                      type="button"
                      onClick={() => setDreamsExpanded(false)}
                      className="font-sans text-xs text-sage hover:text-forest transition-colors"
                    >
                      Collapse ↑
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="collapsed"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { setDreamsExpanded(true); setTimeout(() => dreamsRef.current?.focus(), 50); }}
                  className="w-full text-left rounded-xl border-2 border-sage/20 bg-white/70 p-4 hover:border-sage/40 transition-colors group"
                >
                  <p className="font-display italic text-forest/70 text-sm leading-relaxed line-clamp-3">
                    {dreams || 'No description yet — click to add one.'}
                  </p>
                  <p className="font-sans text-[11px] text-sage mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to edit →
                  </p>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </DreamCard>

        {/* ── Reference Photos ── */}
        {photoUrls.length > 0 && (
          <DreamCard
            title="Reference Photos"
            subtitle="Personal photos that guide the AI style"
            icon={<ImageIcon className="w-4 h-4 text-sage" />}
            isDirty={false}
          >
            <div className="flex flex-wrap gap-2">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-sage/20 shadow-sm" style={{ width: 72, height: 96 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="font-sans text-xs text-forest/40 mt-1">
              Reference photos are used when you upload them in the wizard. Edit your board to update them.
            </p>
          </DreamCard>
        )}

        {/* ── Quotes ── */}
        {allQuotes.length > 0 && (
          <DreamCard
            title="Inspirational Quotes"
            subtitle="Words that move and anchor you"
            icon={<Quote className="w-4 h-4 text-sage" />}
            isDirty={false}
          >
            <AnimatePresence>
              {(quotesExpanded ? allQuotes : allQuotes.slice(0, 3)).map((q) => (
                <motion.div
                  key={q}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start gap-2 rounded-xl border border-sage/15 bg-white/60 px-4 py-3"
                >
                  <Quote className="w-3 h-3 text-sage/40 flex-shrink-0 mt-0.5" />
                  <p className="font-display italic text-sm text-forest/80 flex-1 leading-relaxed">{q}</p>
                  <button
                    type="button"
                    onClick={() => removeQuote(q)}
                    className="text-forest/25 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                    aria-label="Remove quote"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {allQuotes.length > 3 && (
              <button
                type="button"
                onClick={() => setQuotesExpanded((v) => !v)}
                className="font-sans text-xs text-sage hover:text-forest transition-colors flex items-center gap-1"
              >
                {quotesExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show all {allQuotes.length} quotes</>}
              </button>
            )}
          </DreamCard>
        )}
      </section>

      {/* ── Goals & Action Plan ────────────────────────────────────────── */}
      <section>
        <button
          type="button"
          onClick={() => setGoalsExpanded((v) => !v)}
          className="w-full flex items-center justify-between mb-4 group"
        >
          <div>
            <h2 className="font-display text-2xl font-semibold text-forest text-left">Goals & Action Plan</h2>
            <p className="font-sans text-sm text-forest/50 mt-1 text-left">
              One goal and one daily habit per life area.
            </p>
          </div>
          <div className={cn(
            'flex items-center gap-1.5 font-sans text-xs font-medium transition-colors',
            goalsExpanded ? 'text-sage' : 'text-forest/40 group-hover:text-sage',
          )}>
            {goalsExpanded ? <><ChevronUp className="w-4 h-4" /> Collapse</> : <><ChevronDown className="w-4 h-4" /> Expand</>}
          </div>
        </button>

        <AnimatePresence>
          {goalsExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              {areas.map((area) => {
                const { label, Icon } = AREA_META[area];
                const goal = getGoal(area);
                const isOpen = openGoalAreas[area] ?? false;

                return (
                  <div key={area} className="rounded-xl border border-sage/15 bg-cream overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenGoalAreas((prev) => ({ ...prev, [area]: !prev[area] }))}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-sage-light/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-sage" />
                        </div>
                        <div className="text-left">
                          <p className="font-sans text-sm font-semibold text-forest">{label}</p>
                          {goal.objective && !isOpen && (
                            <p className="font-sans text-xs text-forest/40 mt-0.5 line-clamp-1">{goal.objective}</p>
                          )}
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-forest/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-forest/40 flex-shrink-0" />}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-sage/10 pt-4 flex flex-col gap-5">
                        {/* Goal */}
                        <div className="flex flex-col gap-2">
                          <p className="font-sans text-xs font-semibold text-forest/60 uppercase tracking-wider">My goal</p>
                          <div className="flex flex-wrap gap-1.5">
                            {GOAL_SUGGESTIONS[area].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => updateGoal(area, { objective: s })}
                                className={cn(
                                  'text-xs px-2.5 py-1 rounded-full border transition-all font-sans text-left leading-snug',
                                  goal.objective === s
                                    ? 'bg-sage text-white border-sage'
                                    : 'bg-cream text-forest/70 border-sage/20 hover:border-sage/50',
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          <input
                            value={goal.objective}
                            onChange={(e) => updateGoal(area, { objective: e.target.value })}
                            placeholder="Or write your own goal…"
                            className="w-full rounded-xl border-2 border-sage/20 bg-white/70 px-4 py-2.5 font-sans text-sm text-forest placeholder:text-forest/30 focus:border-sage focus:outline-none transition-colors"
                          />
                        </div>
                        {/* Habit */}
                        <div className="flex flex-col gap-2">
                          <p className="font-sans text-xs font-semibold text-forest/60 uppercase tracking-wider">My daily habit</p>
                          <div className="flex flex-wrap gap-1.5">
                            {HABIT_SUGGESTIONS[area].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => updateGoal(area, { habit: s })}
                                className={cn(
                                  'text-xs px-2.5 py-1 rounded-full border transition-all font-sans text-left leading-snug',
                                  goal.habit === s
                                    ? 'bg-sage text-white border-sage'
                                    : 'bg-cream text-forest/70 border-sage/20 hover:border-sage/50',
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          <input
                            value={goal.habit}
                            onChange={(e) => updateGoal(area, { habit: e.target.value })}
                            placeholder="Or write your own daily habit…"
                            className="w-full rounded-xl border-2 border-sage/20 bg-white/70 px-4 py-2.5 font-sans text-sm text-forest placeholder:text-forest/30 focus:border-sage focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-end pt-1">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => void saveBoard()}
                  disabled={isSaving}
                  className="gap-1.5"
                >
                  {isSaving ? (
                    <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> Save goals</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Prioritize ─────────────────────────────────────────────────── */}
      <PrioritizeSection board={board} />

      {/* ── Past Generations ───────────────────────────────────────────── */}
      {images.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-forest">Your Generated Images</h2>
            <p className="font-sans text-forest/55 text-sm mt-1">
              {images.length} image{images.length === 1 ? '' : 's'} — tap to download or delete
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {images.map((img) => (
              <WallpaperCard key={img.id} image={img} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DreamCard({
  title,
  subtitle,
  icon,
  isDirty,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isDirty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      'rounded-2xl border-2 bg-white/60 p-5 flex flex-col gap-4 transition-all duration-200',
      isDirty ? 'border-gold/40 shadow-sm shadow-gold/10' : 'border-sage/15',
    )}>
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1">
          <p className="font-sans text-sm font-semibold text-forest leading-tight">{title}</p>
          <p className="font-sans text-xs text-forest/45">{subtitle}</p>
        </div>
        {isDirty && (
          <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-bold uppercase tracking-wider">
            Edited
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function PrioritizeSection({ board }: { board: Board }) {
  type Priority = { want: number; believe: number };
  type ExplorerData = {
    promptStates?: Array<{ selectedIndices: number[]; edits: Record<number, string>; customText: string }>;
    priorities?: Record<string, Priority>;
  };

  const explorerData = board.explorerData as ExplorerData | null;
  const items = getExplorerItems(explorerData?.promptStates);

  const [expanded, setExpanded] = useState(false);
  const [priorities, setPriorities] = useState<Record<string, Priority>>(
    () => {
      const init = { ...(explorerData?.priorities ?? {}) };
      for (const item of items) {
        if (!init[item.text]) init[item.text] = { want: 5, believe: 5 };
      }
      return init;
    },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => {
    const sa = (priorities[a.text]?.want ?? 5) + (priorities[a.text]?.believe ?? 5);
    const sb = (priorities[b.text]?.want ?? 5) + (priorities[b.text]?.believe ?? 5);
    return sb - sa;
  });

  const setPriority = (text: string, key: keyof Priority, val: number) => {
    setPriorities((prev) => ({ ...prev, [text]: { ...(prev[text] ?? { want: 5, believe: 5 }), [key]: val } }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ explorerData: { ...explorerData, priorities } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* swallow */ } finally {
      setIsSaving(false);
    }
  };

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <div>
          <h2 className="font-display text-2xl font-semibold text-forest text-left">Prioritize Your Dreams</h2>
          <p className="font-sans text-sm text-forest/50 mt-1 text-left">
            Rank each dream by desire and belief. Top-ranked items guide your image more strongly.
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 font-sans text-xs font-medium transition-colors flex-shrink-0',
          expanded ? 'text-sage' : 'text-forest/40 group-hover:text-sage',
        )}>
          <Target className="w-4 h-4" />
          {expanded ? 'Collapse' : `${items.length} items`}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            {sorted.map((item, rank) => {
              const p = priorities[item.text] ?? { want: 5, believe: 5 };
              const wantPct = ((p.want - 1) / 9) * 100;
              const believePct = ((p.believe - 1) / 9) * 100;
              return (
                <motion.div key={item.text} layout className="bg-white/70 rounded-xl border border-sage/15 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300">
                      <span className="font-sans text-xs font-bold text-white">{rank + 1}</span>
                    </div>
                    <p className="font-sans text-sm text-forest font-medium leading-snug">{item.text}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-sans text-[11px] text-forest/50"><Heart className="h-2.5 w-2.5" />Want</span>
                        <span className="font-sans text-xs font-semibold text-forest/70">{p.want}</span>
                      </div>
                      <input
                        type="range" min="1" max="10" value={p.want}
                        onChange={(e) => setPriority(item.text, 'want', Number(e.target.value))}
                        className="dream-slider w-full"
                        aria-label={`Want: ${item.text}`}
                        aria-valuemin={1} aria-valuemax={10} aria-valuenow={p.want}
                        style={{ background: `linear-gradient(to right, var(--color-sage) ${wantPct}%, hsl(150,18%,82%) ${wantPct}%)` }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-sans text-[11px] text-forest/50"><Target className="h-2.5 w-2.5" />Believe</span>
                        <span className="font-sans text-xs font-semibold text-forest/70">{p.believe}</span>
                      </div>
                      <input
                        type="range" min="1" max="10" value={p.believe}
                        onChange={(e) => setPriority(item.text, 'believe', Number(e.target.value))}
                        className="dream-slider w-full"
                        aria-label={`Believe: ${item.text}`}
                        aria-valuemin={1} aria-valuemax={10} aria-valuenow={p.believe}
                        style={{ background: `linear-gradient(to right, var(--color-sage) ${believePct}%, hsl(150,18%,82%) ${believePct}%)` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div className="flex justify-end pt-1">
              <Button
                variant="default"
                size="sm"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="gap-1.5"
              >
                {isSaving ? (
                  <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
                ) : saved ? (
                  <><Check className="w-3.5 h-3.5" /> Saved</>
                ) : (
                  <>Save priorities</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
