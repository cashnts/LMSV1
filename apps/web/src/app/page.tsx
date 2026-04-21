import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import type { AdminSettingsResponse } from '@/lib/admin-settings';

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    const accessToken = await getSupabaseAccessTokenFromSession();
    if (accessToken) {
      try {
        const adminSettings = await apiFetch<AdminSettingsResponse>('/admin/settings', accessToken);
        if (adminSettings.setup.canBootstrapInitialAdmin) {
          redirect('/admin');
        }
      } catch {
        // Fall back to dashboard when admin status cannot be resolved.
      }
    }
    redirect('/dashboard');
  }
  redirect('/login');
}
