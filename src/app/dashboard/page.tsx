import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { boards, generatedWallpapers } from '@/lib/db/schema';
import { eq, desc, gte, and, count } from 'drizzle-orm';
import type { Board, GeneratedWallpaper } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { BoardCard } from '@/components/dashboard/BoardCard';
import { WallpaperCard } from '@/components/dashboard/WallpaperCard';

export const metadata = { title: 'Dashboard — Manifesta' };

const DAILY_LIMIT = 15;

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

        {/* ── Wallpapers ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-forest">Your Wallpapers</h1>
              <p className="font-sans text-forest/55 text-sm mt-1">
                {userImages.length === 0
                  ? 'No wallpapers yet — your first one is on its way'
                  : `${userImages.length} wallpaper${userImages.length === 1 ? '' : 's'} saved`}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-sage/20 bg-white/60 px-4 py-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(DAILY_LIMIT, 5) }).map((_, i) => (
                  <div key={i} className={cn('w-2.5 h-2.5 rounded-full', i < Math.min(usedToday, 5) ? 'bg-sage' : 'bg-sage/20')} />
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
                Your dream board wallpaper will appear here once it&apos;s crafted and delivered
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
