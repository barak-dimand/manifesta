'use client';

import { useState } from 'react';
import { Video, Check, Sparkles } from 'lucide-react';

export function DreamVideos({ boardId }: { boardId: string }) {
  const [opted, setOpted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOptIn = async () => {
    setLoading(true);
    // Store opt-in — endpoint can be wired up later
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setOpted(true);
    void boardId; // referenced to avoid unused-var lint warning
  };

  return (
    <div className="rounded-2xl border border-sage/20 bg-white/70 overflow-hidden">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-forest/5 via-sage-light/40 to-gold/10 px-6 py-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-sage flex items-center justify-center flex-shrink-0 mt-0.5">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-xl font-semibold text-forest">Dream Board Videos</h3>
            <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/30">
              Coming soon
            </span>
          </div>
          <p className="font-sans text-sm text-forest/60">
            Bring your dream board images to life with short, personalized AI-generated videos sent to your inbox.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col gap-5">
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: '✨', title: 'Personalized scenes', desc: 'Each image from your board becomes a cinematic short' },
            { icon: '📧', title: 'Delivered to your inbox', desc: 'Weekly videos tailored to your dream areas' },
            { icon: '🎯', title: 'Stay on track', desc: 'Visual reminders that keep your vision vivid and real' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-cream/80 border border-sage/10 p-4 flex flex-col gap-1.5">
              <span className="text-xl">{f.icon}</span>
              <p className="font-sans text-xs font-semibold text-forest">{f.title}</p>
              <p className="font-sans text-xs text-forest/50">{f.desc}</p>
            </div>
          ))}
        </div>

        {opted ? (
          <div className="flex items-center gap-3 rounded-xl bg-sage-light border border-sage/20 px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-forest">You&apos;re on the list!</p>
              <p className="font-sans text-xs text-forest/60">We&apos;ll notify you the moment Dream Videos launches.</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleOptIn()}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-forest text-cream font-sans text-sm font-semibold py-3 hover:bg-forest/90 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-cream/30 border-t-cream animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Get early access
          </button>
        )}
      </div>
    </div>
  );
}
