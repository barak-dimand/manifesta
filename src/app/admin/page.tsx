import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdminEmail } from '@/lib/admin';
import { AdminShell } from './AdminShell';

export const metadata = { title: 'Admin — Manifesta' };

export default async function AdminPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!user || !isAdminEmail(email)) redirect('/');

  return <AdminShell />;
}
