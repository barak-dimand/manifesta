import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Download, Pencil } from 'lucide-react';
import { getDb } from '@/lib/db';
import { boards, generatedWallpapers } from '@/lib/db/schema';
import { eq, desc, gte, and, count } from 'drizzle-orm';
import type { Board, GeneratedWallpaper } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Dashboard — Manifesta' };

const DAILY_LIMIT = 3;

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  let userBoards: Board[] = [];
  let userImages: GeneratedWallpaper[] = [];
  let usedToday = 0;

  try {
    const since = new Date(Date.now() - 86_400_000);
    [userBoards, userImages] = await Promise.all([
      getDb()
        .select()
        .from(boards)
        .where(eq(boards.userId, userId))
        .orderBy(desc(boards.createdAt)),
      getDb()
        .select()
        .from(generatedWallpapers)
        .where(eq(generatedWallpapers.userId, userId))
        .orderBy(desc(generatedWallpapers.createdAt))
        .limit(50),
    ]);

    const [row] = await getDb()
      .select({ value: count() })
      .from(generatedWallpapers)
      .where(and(eq(generatedWallpapers.userId, userId), gte(generatedWallpapers.createdAt, since)));
    usedToday = row?.value ?? 0;
  } catch {
    // DB unavailable in local dev without env
  }

  const remaining = Math.max(0, DAILY_LIMIT - usedToday);

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-sage/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display text-base font-semibold text-forest tracking-wide hover:text-sage transition-colors">
            Manifesta
          </Link>
          <Link href="/create?new=1" className="font-sans text-sm font-semibold text-sage hover:text-forest transition-colors">
            + New Board
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-14">

        {/* ── Wallpapers gallery ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-forest">Your Wallpapers</h1>
              <p className="font-sans text-forest/55 text-sm mt-1">
                {userImages.length === 0
                  ? 'No wallpapers yet — generate one from your board'
                  : `${userImages.length} wallpaper${userImages.length === 1 ? '' : 's'} saved`}
              </p>
            </div>
            {/* Daily usage */}
            <div className="flex items-center gap-2 rounded-xl border border-sage/20 bg-white/60 px-4 py-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                  <div key={i} className={cn('w-2.5 h-2.5 rounded-full', i < usedToday ? 'bg-sage' : 'bg-sage/20')} />
                ))}
              </div>
              <span className="font-sans text-xs text-forest/60">
                {remaining > 0
                  ? `${remaining} generation${remaining === 1 ? '' : 's'} left today`
                  : 'Daily limit reached — resets tomorrow'}
              </span>
            </div>
          </div>

          {userImages.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-sage/20 p-12 text-center">
              <p className="font-display text-xl text-forest/50 mb-2">No wallpapers yet</p>
              <p className="font-sans text-sm text-forest/40 mb-6">
                Complete the wizard and generate your first AI vision board wallpaper
              </p>
              <Link
                href="/create?new=1"
                className="inline-flex items-center gap-2 bg-gold text-forest font-sans text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gold/90 transition-colors"
              >
                Create My Dream Board
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {userImages.map((img) => (
                <WallpaperCard key={img.id} image={img} />
              ))}
            </div>
          )}
        </section>

        {/* ── Dream Boards ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-forest">Dream Boards</h2>
              <p className="font-sans text-forest/55 text-sm mt-1">
                {userBoards.length === 0
                  ? 'No boards yet'
                  : `${userBoards.length} board${userBoards.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          {userBoards.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-sage/20 p-12 text-center">
              <p className="font-display text-xl text-forest/50 mb-2">Nothing here yet</p>
              <p className="font-sans text-sm text-forest/40 mb-6">
                Complete the wizard to create your first dream board
              </p>
              <Link
                href="/create?new=1"
                className="inline-flex items-center gap-2 bg-gold text-forest font-sans text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gold/90 transition-colors"
              >
                Create My Dream Board
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {userBoards.map((board) => <BoardCard key={board.id} board={board} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ── Wallpaper card ─────────────────────────────────────────────────────────

function WallpaperCard({ image }: { image: GeneratedWallpaper }) {
  const date = image.createdAt
    ? new Date(image.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const isPersonalized = image.mode === 'image-to-image';

  return (
    <div className="rounded-2xl border border-sage/20 bg-white/70 overflow-hidden hover:border-sage/40 hover:shadow-md transition-all flex flex-col group">
      {/* Image */}
      <div className="relative overflow-hidden bg-sage-light/20" style={{ aspectRatio: '9/16', maxHeight: 320 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.imageUrl}
          alt="Generated wallpaper"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Mode badge */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
            isPersonalized ? 'bg-purple-900/80 text-purple-200' : 'bg-forest/70 text-white',
          )}>
            {isPersonalized ? 'Personalized' : 'AI Generated'}
          </span>
        </div>
        {/* Download on hover */}
        <div className="absolute inset-0 bg-forest/0 group-hover:bg-forest/10 transition-colors" />
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={image.imageUrl}
            download="manifesta-wallpaper.png"
            className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
            title="Download wallpaper"
          >
            <Download className="w-3.5 h-3.5 text-forest" />
          </a>
        </div>
      </div>

      {/* Context */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Manifesto */}
        {image.manifesto && (
          <blockquote className="font-display italic text-forest text-sm leading-relaxed line-clamp-3">
            {image.manifesto}
          </blockquote>
        )}

        {/* Dream life */}
        {image.dreams && (
          <p className="font-sans text-xs text-forest/60 leading-relaxed line-clamp-2">
            {image.dreams}
          </p>
        )}

        {/* Life areas */}
        {image.areas && image.areas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {image.areas.map((a) => (
              <span key={a} className="px-2 py-0.5 rounded-full bg-sage-light text-sage text-[10px] font-sans font-medium capitalize">
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-sage/10">
          {date && <span className="font-sans text-xs text-forest/40">{date}</span>}
          {image.style && (
            <span className="font-sans text-xs text-forest/40 capitalize">{image.style} style</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Board card ─────────────────────────────────────────────────────────────

function BoardCard({ board }: { board: Board }) {
  const date = board.createdAt
    ? new Date(board.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="rounded-2xl border border-sage/20 bg-white/70 overflow-hidden hover:border-sage/40 hover:shadow-sm transition-all flex flex-col">
      {board.wallpaperUrl && (
        <div className="h-40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={board.wallpaperUrl} alt="Dream board wallpaper" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex flex-wrap gap-1.5">
          {board.selectedAreas.map((area) => (
            <span key={area} className="px-2.5 py-0.5 rounded-full bg-sage-light text-sage text-xs font-sans font-medium capitalize">
              {area}
            </span>
          ))}
        </div>
        {board.manifesto && (
          <p className="font-display italic text-forest text-sm leading-relaxed line-clamp-3">
            {board.manifesto}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-sage/10">
          {date && <span className="font-sans text-xs text-forest/40">{date}</span>}
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-sans text-xs text-forest/40 capitalize">{board.style}</span>
            <Link
              href={`/create?boardId=${board.id}`}
              className="flex items-center gap-1 font-sans text-xs font-medium text-sage hover:text-forest transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
