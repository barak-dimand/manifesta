'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Search, Plus, X, Sparkles, Heart, Brain, Rocket, Sun, Star, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WizardState } from '@/hooks/use-wizard';
import { cn } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

interface Step3Props {
  state: WizardState;
  update: (updates: Partial<WizardState>) => void;
  next: () => void;
  prev: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', Icon: Sparkles },
  { id: 'motivation', label: 'Motivation', Icon: Rocket },
  { id: 'self-love', label: 'Self-Love', Icon: Heart },
  { id: 'mindset', label: 'Mindset', Icon: Brain },
  { id: 'abundance', label: 'Abundance', Icon: Sun },
  { id: 'dreams', label: 'Dreams', Icon: Star },
];

const CURATED_QUOTES = [
  { text: 'She believed she could, so she did.', author: 'R.S. Grey', category: 'motivation' },
  { text: 'You are the architect of your own destiny.', author: 'Unknown', category: 'mindset' },
  { text: 'The universe is not outside of you. Look inside yourself; everything that you want, you already are.', author: 'Rumi', category: 'self-love' },
  { text: 'What you think, you become. What you feel, you attract. What you imagine, you create.', author: 'Buddha', category: 'mindset' },
  { text: 'Abundance is not something we acquire. It is something we tune into.', author: 'Wayne Dyer', category: 'abundance' },
  { text: 'Dream big. Start small. Act now.', author: 'Robin Sharma', category: 'dreams' },
  { text: 'You deserve the love you keep giving everyone else.', author: 'Unknown', category: 'self-love' },
  { text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt', category: 'motivation' },
  { text: 'Your vibe attracts your tribe.', author: 'Unknown', category: 'abundance' },
  { text: "Everything you've ever wanted is on the other side of fear.", author: 'George Addair', category: 'motivation' },
  { text: 'You are worthy of the life you dream about.', author: 'Unknown', category: 'self-love' },
  { text: "Stars can't shine without darkness.", author: 'D.H. Sidebottom', category: 'dreams' },
  { text: 'The energy you put out is the energy you get back.', author: 'Unknown', category: 'abundance' },
  { text: "Don't wait for opportunity. Create it.", author: 'George Bernard Shaw', category: 'motivation' },
  { text: 'Your thoughts create your reality. Choose them wisely.', author: 'Unknown', category: 'mindset' },
  { text: 'In a world where you can be anything, be kind to yourself first.', author: 'Unknown', category: 'self-love' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb', category: 'dreams' },
  { text: 'Money flows to me easily and effortlessly.', author: 'Affirmation', category: 'abundance' },
  { text: 'I am becoming the best version of myself.', author: 'Affirmation', category: 'mindset' },
  { text: 'Leap and the net will appear.', author: 'John Burroughs', category: 'dreams' },
];

export function Step3Quotes({ state, update, next }: Step3Props) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  // which curated quote is currently being edited (by original text key)
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  // which custom quote index is being edited
  const [editingCustomIdx, setEditingCustomIdx] = useState<number | null>(null);
  const [editCustomDraft, setEditCustomDraft] = useState('');
  const editCustomRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingKey !== null) editInputRef.current?.focus();
  }, [editingKey]);

  useEffect(() => {
    if (editingCustomIdx !== null) editCustomRef.current?.focus();
  }, [editingCustomIdx]);

  const selectedQuotes = state.selectedQuotes ?? [];
  const customQuotes = state.customQuotes ?? [];
  const quoteEdits = state.quoteEdits ?? {};

  const getDisplayText = (original: string) => quoteEdits[original] ?? original;

  const filteredQuotes = CURATED_QUOTES.filter((q) => {
    const matchesCategory = activeCategory === 'all' || q.category === activeCategory;
    const display = getDisplayText(q.text).toLowerCase();
    const matchesSearch =
      !searchQuery ||
      display.includes(searchQuery.toLowerCase()) ||
      q.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleQuote = (original: string) => {
    const display = getDisplayText(original);
    if (selectedQuotes.includes(display)) {
      update({ selectedQuotes: selectedQuotes.filter((q) => q !== display) });
      analytics.quoteToggled('deselected', 'curated');
    } else {
      update({ selectedQuotes: [...selectedQuotes, display] });
      analytics.quoteToggled('selected', 'curated');
    }
  };

  const startEdit = (original: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKey(original);
    setEditDraft(getDisplayText(original));
  };

  const saveEdit = (original: string) => {
    const trimmed = editDraft.trim();
    if (!trimmed) { setEditingKey(null); return; }
    const prevDisplay = getDisplayText(original);
    // Persist edits map in wizard state so it survives step navigation
    const newEdits = { ...quoteEdits };
    if (trimmed !== original) {
      newEdits[original] = trimmed;
    } else {
      delete newEdits[original];
    }
    // Update selectedQuotes if this quote was already selected
    const newSelected = selectedQuotes.includes(prevDisplay)
      ? selectedQuotes.map((q) => q === prevDisplay ? trimmed : q)
      : selectedQuotes;
    update({ quoteEdits: newEdits, selectedQuotes: newSelected });
    setEditingKey(null);
  };

  const addCustomQuote = () => {
    const trimmed = customInput.trim();
    if (trimmed && !customQuotes.includes(trimmed)) {
      update({ customQuotes: [...customQuotes, trimmed] });
      analytics.quoteToggled('selected', 'custom');
      setCustomInput('');
    }
  };

  const removeCustomQuote = (q: string) => {
    update({ customQuotes: customQuotes.filter((cq) => cq !== q) });
  };

  const startEditCustom = (idx: number) => {
    setEditingCustomIdx(idx);
    setEditCustomDraft(customQuotes[idx]);
  };

  const saveEditCustom = (idx: number) => {
    const trimmed = editCustomDraft.trim();
    if (trimmed) {
      const next = [...customQuotes];
      next[idx] = trimmed;
      update({ customQuotes: next });
    }
    setEditingCustomIdx(null);
  };

  const totalSelected = selectedQuotes.length + customQuotes.length;

  const handleNext = () => {
    analytics.step3Completed({ selectedCount: selectedQuotes.length, customCount: customQuotes.length });
    next();
  };

  return (
    <div className="flex flex-col gap-7">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-2">
          Words that move you
        </h1>
        <p className="font-sans text-forest/60 text-base">
          Choose quotes that resonate. Tap to select, tap the pencil to make them your own, or write something new.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-forest/40" />
        <input
          type="text"
          placeholder="Search quotes…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border-2 border-sage/20 bg-white/70 pl-11 pr-4 py-3 font-sans text-sm text-forest placeholder:text-forest/35 focus:border-sage focus:outline-none transition-colors"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveCategory(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-2 font-sans text-xs font-medium transition-all duration-200 border',
              activeCategory === id
                ? 'bg-sage text-white border-sage'
                : 'bg-white/70 text-forest/60 border-sage/20 hover:border-sage/50',
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Selected count */}
      <AnimatePresence>
        {totalSelected > 0 && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-sans text-xs text-sage font-semibold -mt-3"
          >
            {totalSelected} quote{totalSelected !== 1 ? 's' : ''} selected
          </motion.p>
        )}
      </AnimatePresence>

      {/* Quotes grid */}
      <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
        <AnimatePresence>
          {filteredQuotes.map((q) => {
            const display = getDisplayText(q.text);
            const isSelected = selectedQuotes.includes(display);
            const isEdited = !!quoteEdits[q.text];
            const isEditing = editingKey === q.text;

            return (
              <motion.div
                key={q.text}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => !isEditing && toggleQuote(q.text)}
                className={cn(
                  'w-full text-left rounded-xl p-4 border-2 transition-all duration-200 cursor-pointer',
                  isSelected
                    ? 'border-sage bg-sage-light/40 shadow-sm'
                    : 'border-sage/15 bg-white/60 hover:border-sage/35',
                )}
              >
                <div className="flex items-start gap-3">
                  <Quote className={cn('h-4 w-4 mt-0.5 flex-shrink-0 transition-colors', isSelected ? 'text-sage' : 'text-forest/25')} />

                  <div className="flex-1 space-y-1 min-w-0">
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => saveEdit(q.text)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') saveEdit(q.text);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                        className="w-full rounded-lg border border-sage/40 bg-white px-3 py-1.5 font-display italic text-sm text-forest focus:border-sage focus:outline-none"
                      />
                    ) : (
                      <p className="font-display italic text-sm text-forest leading-relaxed">
                        &ldquo;{display}&rdquo;
                        {isEdited && <span className="ml-1.5 font-sans not-italic text-[10px] text-sage/60">(edited)</span>}
                      </p>
                    )}
                    <p className="font-sans text-xs text-forest/50">— {q.author}</p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Edit pencil — always visible on selected, hover on unselected */}
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={(e) => startEdit(q.text, e)}
                        title="Edit quote"
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                          isSelected
                            ? 'text-sage/60 hover:text-sage hover:bg-sage-light'
                            : 'text-forest/20 hover:text-forest/50 hover:bg-sage-light/40 opacity-0 group-hover:opacity-100',
                        )}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    {isSelected && !isEditing && (
                      <div className="w-5 h-5 rounded-full bg-sage flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Custom quotes */}
      <div className="flex flex-col gap-3 border-t border-sage/10 pt-5">
        <p className="font-sans text-sm font-semibold text-forest/80 flex items-center gap-2">
          <Plus className="h-4 w-4 text-sage" />
          Write your own quote or affirmation
        </p>
        <div className="flex gap-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomQuote()}
            placeholder="Type your own quote or affirmation…"
            className="flex-1 rounded-xl border-2 border-sage/20 bg-white/70 px-4 py-3 font-sans text-sm text-forest placeholder:text-forest/35 focus:border-sage focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={addCustomQuote}
            disabled={!customInput.trim()}
            className="rounded-xl bg-sage text-white px-4 py-3 font-sans text-sm font-semibold hover:bg-sage/90 transition-colors disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {customQuotes.length > 0 && (
          <div className="flex flex-col gap-2">
            {customQuotes.map((q, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-xl border-2 border-sage bg-sage-light/40 p-3"
              >
                <Quote className="h-3.5 w-3.5 text-sage flex-shrink-0" />

                {editingCustomIdx === idx ? (
                  <input
                    ref={editCustomRef}
                    value={editCustomDraft}
                    onChange={(e) => setEditCustomDraft(e.target.value)}
                    onBlur={() => saveEditCustom(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditCustom(idx);
                      if (e.key === 'Escape') setEditingCustomIdx(null);
                    }}
                    className="flex-1 rounded-lg border border-sage/40 bg-white px-2 py-1 font-display italic text-sm text-forest focus:border-sage focus:outline-none"
                  />
                ) : (
                  <p className="font-display italic text-sm text-forest flex-1">&ldquo;{q}&rdquo;</p>
                )}

                <div className="flex items-center gap-1">
                  {editingCustomIdx !== idx && (
                    <button
                      type="button"
                      onClick={() => startEditCustom(idx)}
                      title="Edit"
                      className="text-sage/50 hover:text-sage transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeCustomQuote(q)}
                    className="text-forest/40 hover:text-forest transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <Button variant="gold" size="lg" className="w-full text-base" onClick={handleNext} data-testid="step3-next">
        Next: Your Journey →
      </Button>
    </div>
  );
}
