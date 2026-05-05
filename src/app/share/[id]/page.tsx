import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getDb } from '@/lib/db';
import { boards, generatedWallpapers } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [board] = await getDb().select().from(boards).where(eq(boards.id, id)).limit(1);
  if (!board) return { title: 'Dream Board — Manifesta' };
  const areas = board.selectedAreas.slice(0, 2).join(' & ');
  return {
    title: `${board.name ?? areas} — Manifesta Dream Board`,
    description: 'A personalized AI vision board, crafted to manifest a dream life.',
  };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [board] = await getDb().select().from(boards).where(eq(boards.id, id)).limit(1);
  if (!board) notFound();

  // Grab the most recent wallpaper for this board
  const [wallpaper] = await getDb()
    .select()
    .from(generatedWallpapers)
    .where(and(eq(generatedWallpapers.boardId, board.id)))
    .orderBy(desc(generatedWallpapers.createdAt))
    .limit(1);

  const imageUrl = wallpaper?.imageUrl ?? board.wallpaperUrl ?? null;
  const displayName = board.name ?? board.selectedAreas.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(' · ');

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-sage/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles className="w-4 h-4 text-gold transition-transform group-hover:scale-110" />
            <span className="font-display text-base font-semibold text-forest tracking-wide">Manifesta</span>
          </Link>
          <Link
            href="/create?new=1"
            className="font-sans text-sm font-semibold text-sage hover:text-forest transition-colors"
          >
            Create Yours — Free →
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start py-12 px-4">
        <div className="w-full max-w-sm flex flex-col gap-6">
          {/* Board name + areas */}
          <div className="text-center">
            <p className="font-sans text-xs font-semibold text-sage uppercase tracking-widest mb-2">Dream Board</p>
            <h1 className="font-display text-2xl font-semibold text-forest">{displayName}</h1>
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {board.selectedAreas.map((area) => (
                <span key={area} className="px-2.5 py-0.5 rounded-full bg-sage-light text-sage text-xs font-sans font-medium capitalize">
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Wallpaper */}
          {imageUrl ? (
            <div className="rounded-2xl overflow-hidden shadow-xl border border-sage/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Dream board wallpaper"
                className="w-full object-cover"
                style={{ aspectRatio: '9/16', maxHeight: 560 }}
              />
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-sage/25 bg-sage-light/20 flex flex-col items-center justify-center gap-3 py-16 px-8 text-center">
              <Sparkles className="w-8 h-8 text-gold/60" />
              <p className="font-display text-lg text-forest/60">Dream board being crafted…</p>
              <p className="font-sans text-xs text-forest/40">Arriving within 24 hours</p>
            </div>
          )}

          {/* Style pill */}
          {board.style && (
            <p className="text-center font-sans text-xs text-forest/40 capitalize">{board.style} aesthetic</p>
          )}

          {/* CTA */}
          <div className="rounded-2xl bg-gold/10 border border-gold/25 p-5 text-center flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <p className="font-display text-base font-semibold text-forest">Create your own dream board</p>
            </div>
            <p className="font-sans text-xs text-forest/60">
              Free, personalized, and delivered to your inbox within 24 hours.
            </p>
            <Link
              href="/create?new=1"
              className="inline-flex items-center justify-center gap-2 bg-gold text-forest font-sans text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gold/90 transition-colors"
            >
              Start My Dream Board →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
