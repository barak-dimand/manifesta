import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { boards, generatedWallpapers } from '@/lib/db/schema';
import { eq, desc, count, and, gte } from 'drizzle-orm';
import type { Board, GeneratedWallpaper } from '@/lib/db/schema';
import { ManifestoCard } from '@/components/dashboard/ManifestoCard';
import { DreamSummaryGrid } from '@/components/dashboard/DreamSummaryGrid';
import { DiscoverSection } from '@/components/dashboard/DiscoverSection';
import { WallpaperCard } from '@/components/dashboard/WallpaperCard';
import { BoardCard } from '@/components/dashboard/BoardCard';
import { Sparkles, Plus } from 'lucide-react';

export const metadata = { title: 'Dashboard — Manifesta' };

const DAILY_LIMIT = 15;
const PAID_OFFERS = ['dream-card', 'meditations', 'life-coach'];

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [user] = await Promise.all([currentUser()]);

  let userBoards: Board[] = [];
  let userImages: GeneratedWallpaper[] = [];
  let remaining = DAILY_LIMIT;

  try {
    const since = new Date(Date.now() - 86_400_000);
    const [boardsResult, imagesResult, [{ value: usedToday }]] = await Promise.all([
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
      getDb()
        .select({ value: count() })
        .from(generatedWallpapers)
        .where(and(
          eq(generatedWallpapers.userId, userId),
          gte(generatedWallpapers.createdAt, since),
        )),
    ]);
    userBoards = boardsResult;
    userImages = imagesResult;
    remaining = Math.max(0, DAILY_LIMIT - usedToday);
  } catch {
    // DB unavailable in local dev without env
  }

  const featuredBoard = userBoards[0] ?? null;
  const otherBoards = userBoards.slice(1);

  const isPaid =
    (featuredBoard?.selectedOffers as string[] | null)?.some((o) =>
      PAID_OFFERS.includes(o),
    ) ?? false;

  const firstName = user?.firstName ?? 'dreamer';
  const email = user?.emailAddresses[0]?.emailAddress ?? '';

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-sage/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-sans text-sm text-forest/60 hover:text-forest transition-colors"
          >
            <span className="text-base">←</span>
            Home
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-sage/20 text-xs font-sans font-medium text-forest/60">
            <Sparkles className="w-3 h-3 text-gold" />
            {isPaid ? 'Dreamer (Pro)' : 'Dreamer (Free)'}
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-2xl mx-auto px-4 py-10">

        {featuredBoard ? (
          <div className="flex flex-col gap-10">

            {/* ── Hero ──────────────────────────────────────────────── */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sage-light/60 border border-sage/20 text-xs font-sans font-semibold text-sage uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Your Dream Board
              </div>
              <h1 className="font-display text-4xl font-semibold text-forest mt-1">
                Welcome back, {firstName} ✦
              </h1>
              {email && (
                <p className="font-sans text-sm text-forest/45">
                  Daily reminders going to{' '}
                  <span className="font-medium text-forest/60">{email}</span>
                </p>
              )}
            </div>

            {/* ── My Manifesto ─────────────────────────────────────── */}
            <ManifestoCard board={featuredBoard} isPaid={isPaid} />

            {/* ── Summary Grid ─────────────────────────────────────── */}
            <DreamSummaryGrid board={featuredBoard} />

            {/* ── Discover ─────────────────────────────────────────── */}
            <DiscoverSection board={featuredBoard} />

            {/* ── Dream Board Images ───────────────────────────────── */}
            {userImages.length > 0 && (
              <section className="flex flex-col gap-5">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-forest">Dream Board Images</h2>
                  <p className="font-sans text-xs text-forest/45 mt-1">
                    {remaining > 0
                      ? `${remaining} generation${remaining === 1 ? '' : 's'} remaining today`
                      : 'Daily limit reached — resets tomorrow'}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {userImages.map((img) => (
                    <WallpaperCard key={img.id} image={img} />
                  ))}
                </div>
              </section>
            )}

            {/* ── No images yet ────────────────────────────────────── */}
            {userImages.length === 0 && (
              <section className="rounded-2xl border-2 border-dashed border-sage/20 px-8 py-10 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-gold/50" />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-forest/60">
                    Your dream board image is on its way
                  </p>
                  <p className="font-sans text-sm text-forest/40 mt-1">
                    We&apos;ll email your AI-generated wallpaper within 5 days.
                  </p>
                </div>
              </section>
            )}

            {/* ── Past Boards ──────────────────────────────────────── */}
            {otherBoards.length > 0 && (
              <section className="flex flex-col gap-5">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-forest">Past Boards</h2>
                  <p className="font-sans text-xs text-forest/45 mt-1">
                    {otherBoards.length} previous board{otherBoards.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {otherBoards.map((board) => (
                    <BoardCard key={board.id} board={board} />
                  ))}
                </div>
              </section>
            )}

          </div>
        ) : (
          /* ── Empty state ──────────────────────────────────────────── */
          <div className="flex flex-col items-center text-center gap-8 pt-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-gold/50" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold text-forest mb-2">
                  Welcome, {firstName}
                </h1>
                <p className="font-sans text-sm text-forest/50">
                  Create your first dream board to get started.
                </p>
              </div>
            </div>
            <Link
              href="/create?new=1"
              className="flex items-center gap-2 bg-gold text-forest font-sans text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-gold/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create My Dream Board
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
