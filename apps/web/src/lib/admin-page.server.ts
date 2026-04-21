import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import type { AdminSettingsResponse } from '@/lib/admin-settings';

export async function getAdminPageContext() {
  const user = await currentUser();
  if (!user) redirect('/login');

  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) redirect('/login');

  let adminSettings: AdminSettingsResponse | null = null;
  let adminSettingsError: string | null = null;
  try {
    adminSettings = await apiFetch<AdminSettingsResponse>('/admin/settings', accessToken);
  } catch (error) {
    adminSettings = null;
    adminSettingsError = error instanceof Error ? error.message : 'Unable to load admin settings.';
  }

  return {
    user,
    accessToken,
    adminSettings,
    adminSettingsError,
  };
}
