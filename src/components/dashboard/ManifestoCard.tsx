'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Copy, Check, Pencil, Lock, X, ChevronDown, ChevronUp,
  Briefcase, Zap, Globe, TrendingUp, Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Board } from '@/lib/db/schema';
import type { LifeArea, AestheticStyle, Goal } from '@/lib/validations/wizard';
import { buildManifestoDocument } from '@/lib/manifesto';
import { cn } from '@/lib/utils';

const ALL_AREAS: { id: LifeArea; label: string; Icon: React.ElementType }[] = [
  { id: 'career', label: 'Career & Purpose', Icon: Briefcase },
  { id: 'love', label: 'Love & Relationships', Icon: Heart },
  { id: 'health', label: 'Health & Vitality', Icon: Zap },
  { id: 'travel', label: 'Travel & Adventure', Icon: Globe },
  { id: 'wealth', label: 'Wealth & Abundance', Icon: TrendingUp },
  { id: 'creativity', label: 'Creativity & Joy', Icon: Palette },
];

const STYLE_OPTIONS: { id: AestheticStyle; name: string; gradient: string; border: string }[] = [
  { id: 'minimal', name: 'Clean & Minimal', gradient: 'from-slate-100 to-gray-50', border: 'border-slate-300' },
  { id: 'vibrant', name: 'Bold & Vibrant', gradient: 'from-purple-100 to-pink-50', border: 'border-purple-400' },
  { id: 'ethereal', name: 'Ethereal & Dreamy', gradient: 'from-sky-50 to-indigo-50', border: 'border-indigo-300' },
  { id: 'luxe', name: 'Luxe & Elevated', gradient: 'from-amber-50 to-yellow-50', border: 'border-amber-400' },
];

interface Props {
  board: Board;
  isPaid: boolean;
}

export function ManifestoCard({ board, isPaid }: Props) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showLockHint, setShowLockHint] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit state
  const [dreams, setDreams] = useState(board.dreams);
  const [areas, setAreas] = useState<LifeArea[]>(board.selectedAreas as LifeArea[]);
  const [style, setStyle] = useState<AestheticStyle>(board.style as AestheticStyle);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>(board.selectedQuotes ?? []);
  const [customQuotes, setCustomQuotes] = useState<string[]>(board.customQuotes ?? []);
  const [goals, setGoals] = useState<Goal[]>((board.goals as Goal[]) ?? []);
  const [newQuote, setNewQuote] = useState('');
  const [openGoalArea, setOpenGoalArea] = useState<LifeArea | null>(null);

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
    setDreams(board.dreams);
    setAreas(board.selectedAreas as LifeArea[]);
    setStyle(board.style as AestheticStyle);
    setSelectedQuotes(board.selectedQuotes ?? []);
    setCustomQuotes(board.customQuotes ?? []);
    setGoals((board.goals as Goal[]) ?? []);
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

  const allQuotes = [...selectedQuotes, ...customQuotes];

  return (
    <div className="rounded-2xl border border-white/40 bg-white/80 backdrop-blur-md shadow-lg overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-0">
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
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 font-sans text-xs text-forest/50 hover:text-forest transition-colors px-3 py-1.5 rounded-lg hover:bg-sage-light/40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {!isEditing && (
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
          )}
        </div>
      </div>

      {/* Lock hint for free users */}
      <AnimatePresence>
        {showLockHint && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-xs font-sans text-forest/70"
          >
            Inline editing is available on paid plans. Upgrade to keep refining your dream.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 py-5 flex flex-col gap-6"
          >
            {/* Dream Description */}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-semibold text-forest/60 uppercase tracking-wider">Dream Description</p>
              <textarea
                value={dreams}
                onChange={(e) => setDreams(e.target.value.slice(0, 1500))}
                rows={5}
                className="w-full rounded-xl border-2 border-sage/20 bg-white/70 px-4 py-3 font-sans text-sm text-forest placeholder:text-forest/30 focus:border-sage focus:outline-none transition-colors resize-none leading-relaxed"
                placeholder="Describe your dream life in as much detail as possible..."
              />
              <span className="font-sans text-[11px] text-forest/35 self-end">{dreams.length}/1500</span>
            </div>

            {/* Life Areas */}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-semibold text-forest/60 uppercase tracking-wider">Life Areas</p>
              <div className="flex flex-wrap gap-2">
                {ALL_AREAS.map(({ id, label, Icon }) => {
                  const selected = areas.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleArea(id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-sans font-medium transition-all',
                        selected
                          ? 'bg-sage border-sage text-white shadow-sm'
                          : 'bg-cream border-sage/20 text-forest hover:border-sage/50',
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                      {selected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style */}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-semibold text-forest/60 uppercase tracking-wider">Visual Style</p>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((opt) => {
                  const selected = style === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStyle(opt.id)}
                      className={cn(
                        'relative rounded-xl border-2 px-4 py-3 text-left bg-gradient-to-br transition-all',
                        opt.gradient,
                        selected ? `${opt.border} shadow-sm` : 'border-transparent hover:border-sage/30',
                      )}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-sage flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <p className="font-sans text-xs font-semibold text-forest">{opt.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quotes */}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-semibold text-forest/60 uppercase tracking-wider">Quotes & Affirmations</p>
              {allQuotes.map((q) => (
                <div key={q} className="flex items-start gap-2 rounded-xl border border-sage/15 bg-white/50 px-3 py-2.5">
                  <p className="font-display italic text-sm text-forest/70 flex-1 leading-relaxed">{q}</p>
                  <button type="button" onClick={() => removeQuote(q)} className="text-forest/25 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addQuote()}
                  placeholder="Add a quote or affirmation..."
                  className="flex-1 rounded-xl border-2 border-sage/20 bg-white/70 px-3 py-2 font-sans text-sm text-forest placeholder:text-forest/30 focus:border-sage focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={addQuote}
                  disabled={!newQuote.trim()}
                  className="px-3 py-2 rounded-xl bg-sage text-white font-sans text-sm font-medium disabled:opacity-40 hover:bg-sage/90 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Goals */}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-semibold text-forest/60 uppercase tracking-wider">Goals & Habits</p>
              {areas.map((area) => {
                const areaInfo = ALL_AREAS.find((a) => a.id === area);
                if (!areaInfo) return null;
                const { label, Icon } = areaInfo;
                const goal = getGoal(area);
                const isOpen = openGoalArea === area;
                return (
                  <div key={area} className="rounded-xl border border-sage/15 bg-cream overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenGoalArea(isOpen ? null : area)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-sage-light/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-sage" />
                        <span className="font-sans text-xs font-semibold text-forest">{label}</span>
                        {goal.objective && !isOpen && (
                          <span className="font-sans text-xs text-forest/40 line-clamp-1 max-w-[120px]">{goal.objective}</span>
                        )}
                      </div>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-forest/40" /> : <ChevronDown className="w-3.5 h-3.5 text-forest/40" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-2 border-t border-sage/10 flex flex-col gap-3">
                        <input
                          value={goal.objective}
                          onChange={(e) => updateGoal(area, { objective: e.target.value })}
                          placeholder="My goal..."
                          className="w-full rounded-lg border border-sage/20 bg-white/70 px-3 py-2 font-sans text-sm text-forest placeholder:text-forest/30 focus:border-sage focus:outline-none transition-colors"
                        />
                        <input
                          value={goal.habit}
                          onChange={(e) => updateGoal(area, { habit: e.target.value })}
                          placeholder="My daily habit..."
                          className="w-full rounded-lg border border-sage/20 bg-white/70 px-3 py-2 font-sans text-sm text-forest placeholder:text-forest/30 focus:border-sage focus:outline-none transition-colors"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Save / Cancel */}
            {saveError && (
              <p className="font-sans text-xs text-red-500">{saveError}</p>
            )}
            <div className="flex gap-3 pt-1">
              <Button
                variant="gold"
                className="flex-1 gap-1.5"
                onClick={() => void handleSave()}
                disabled={isSaving || areas.length === 0}
              >
                {isSaving ? (
                  <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving...</>
                ) : (
                  <><Check className="w-3.5 h-3.5" /> Save Changes</>
                )}
              </Button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl border border-sage/20 font-sans text-sm text-forest/60 hover:text-forest hover:border-sage/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="read"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 py-5"
          >
            <pre className="font-sans text-sm text-forest/80 whitespace-pre-wrap leading-relaxed">
              {manifestoText || 'No manifesto yet. Complete the wizard to generate your dream manifesto.'}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
