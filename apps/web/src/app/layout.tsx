import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { SiteHeader } from '@/components/layout/site-header';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import type { AdminSettingsResponse } from '@/lib/admin-settings';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from('app_config').select('app_name').eq('id', true).maybeSingle();
  return {
    title: data?.app_name || 'LMS',
    description: 'Learning management',
  };
}

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentUser();
  const accessToken = user ? await getSupabaseAccessTokenFromSession() : null;
  let isAppAdmin = false;
  let needsAdminSetup = false;
  let appName = 'LMS';

  const supabase = createClient(await cookies());
  const { data } = await supabase.from('app_config').select('app_name').eq('id', true).maybeSingle();
  if (data?.app_name) {
    appName = data.app_name;
  }

  if (accessToken) {
    try {
      const adminSettings = await apiFetch<AdminSettingsResponse>('/admin/settings', accessToken);
      isAppAdmin = adminSettings.isAppAdmin;
      needsAdminSetup = adminSettings.setup.canBootstrapInitialAdmin;
      if (adminSettings.creationSettings?.appName) {
        appName = adminSettings.creationSettings.appName;
      }
    } catch {
      isAppAdmin = false;
      needsAdminSetup = false;
    }
  }

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ClerkProvider signInUrl="/login" signUpUrl="/sign-up">
          <div className="min-h-screen flex flex-col">
            <SiteHeader appName={appName} isAppAdmin={isAppAdmin} needsAdminSetup={needsAdminSetup} />
            <div className="flex-1">{children}</div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
