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
  let userRole: 'admin' | 'instructor' | 'student' = 'student';
  let needsAdminSetup = false;
  let appName = 'LMS';
  let brandColor = '#4f46e5';
  let headScripts = '';

  const supabase = createClient(await cookies());
  const { data: config } = await supabase.from('app_config').select('*').eq('id', true).maybeSingle();
  if (config?.app_name) appName = config.app_name;
  if (config?.brand_color) brandColor = config.brand_color;
  if (config?.custom_head_scripts) headScripts = config.custom_head_scripts;

  if (accessToken) {
    try {
      const adminSettings = await apiFetch<AdminSettingsResponse>('/admin/settings', accessToken);
      isAppAdmin = adminSettings.isAppAdmin;
      userRole = adminSettings.userRole;
      needsAdminSetup = adminSettings.setup.canBootstrapInitialAdmin;
    } catch {
      isAppAdmin = false;
      userRole = 'student';
      needsAdminSetup = false;
    }
  }

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root { --brand-primary: ${brandColor}; }` }} />
        {headScripts && <script dangerouslySetInnerHTML={{ __html: headScripts }} />}
      </head>
      <body className="min-h-screen antialiased">
        <ClerkProvider signInUrl="/login" signUpUrl="/sign-up">
          <div className="min-h-screen flex flex-col">
            <SiteHeader appName={appName} isAppAdmin={isAppAdmin} userRole={userRole} needsAdminSetup={needsAdminSetup} />
            <div className="flex-1">{children}</div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
