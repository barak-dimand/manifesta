import { neon } from '@neondatabase/serverless';

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export interface Board {
  id: string;
  user_id: string;
  email: string;
  selected_areas: string[];
  dreams: string;
  style: string;
  goals: Array<{ area: string; objective: string; habit: string; timeline?: string }>;
  manifesto: string | null;
  wallpaper_url: string | null;
  enable_timeline: boolean;
  photo_urls: string[] | null;
  explorer_data: unknown;
  created_at: string;
}

export async function getLatestBoardForUser(userId: string): Promise<Board | null> {
  const db = sql();
  const rows = await db`
    SELECT * FROM boards
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return (rows[0] as Board) ?? null;
}

export async function deleteBoard(id: string): Promise<void> {
  const db = sql();
  await db`DELETE FROM boards WHERE id = ${id}`;
}
