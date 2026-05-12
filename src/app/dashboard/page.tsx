import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { boards, generatedWallpapers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Board, GeneratedWallpaper } from '@/lib/db/schema';
import { DreamBoardHero } from '@/components/dashboard/DreamBoardHero';
import { DeepenYourVision } from '@/components/dashboard/DeepenYourVision';
import { DreamVideos } from '@/components/dashboard/DreamVideos';
import { WallpaperCard } from '@/components/dashboard/WallpaperCard';
import { BoardCard } from '@/components/dashboard/BoardCard';
import { Sparkles, Plus } from 'lucide-react';

export const metadata = { title: 'Dashboard — Manifesta' };

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  let userBoards: Board[] = [];
  let userImages: GeneratedWallpaper[] = [];

  try {
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
  } catch {
    // DB unavailable in local dev without env
  }

  const featuredBoard = userBoards[0] ?? null;
  const otherBoards = userBoards.slice(1);

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-sage/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 group">
            <Sparkles className="w-4 h-4 text-gold transition-transform group-hover:scale-110" />
            <span className="font-display text-base font-semibold text-forest tracking-wide">Manifesta</span>
          </Link>
          <Link
            href="/create?new=1"
            className="flex items-center gap-1.5 font-sans text-sm font-semibold text-sage hover:text-forest transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Board
          </Link>
        </div>
      </header>

      <main id="main-content" className="max-w-2xl mx-auto px-4 py-10 space-y-14">

        {/* ── Featured Dream Board ──────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <h1 className="font-display text-3xl font-semibold text-forest">Your Dream Board</h1>
            <p className="font-sans text-forest/55 text-sm mt-1">
              {featuredBoard
                ? 'Your vision, always within reach.'
                : 'Create your first dream board to get started.'}
            </p>
          </div>

          {featuredBoard ? (
            <DreamBoardHero board={featuredBoard} />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-sage/20 p-12 text-center">
              <Sparkles className="w-10 h-10 text-gold/50 mx-auto mb-3" />
              <p className="font-display text-xl text-forest/50 mb-2">No dream board yet</p>
              <p className="font-sans text-sm text-forest/40 mb-6">
                Complete the wizard to create your personalized vision board.
              </p>
              <Link
                href="/create?new=1"
                className="inline-flex items-center gap-2 bg-gold text-forest font-sans text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gold/90 transition-colors"
              >
                Create My Dream Board
              </Link>
            </div>
          )}
        </section>

        {/* ── Deepen Your Vision ────────────────────────────────────── */}
        {featuredBoard && (
          <section>
            <DeepenYourVision board={featuredBoard} />
          </section>
        )}

        {/* ── Dream Videos ──────────────────────────────────────────── */}
        {featuredBoard && (
          <section>
            <DreamVideos boardId={featuredBoard.id} />
          </section>
        )}

        {/* ── Wallpapers ────────────────────────────────────────────── */}
        {userImages.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-forest">Your Wallpapers</h2>
              <p className="font-sans text-forest/55 text-sm mt-1">
                {userImages.length} wallpaper{userImages.length === 1 ? '' : 's'} saved
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {userImages.map((img) => (
                <WallpaperCard key={img.id} image={img} />
              ))}
            </div>
          </section>
        )}

        {/* ── Other Boards ──────────────────────────────────────────── */}
        {otherBoards.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-forest">Past Boards</h2>
              <p className="font-sans text-forest/55 text-sm mt-1">
                {otherBoards.length} previous board{otherBoards.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {otherBoards.map((board) => <BoardCard key={board.id} board={board} />)}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
