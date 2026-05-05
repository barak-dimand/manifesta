import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const ADMIN_EMAILS = new Set([
  'barakdimand6@gmail.com',
  'bdimandailife@gmail.com',
]);

export async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !isAdminEmail(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { userId: user.id };
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email);
}
