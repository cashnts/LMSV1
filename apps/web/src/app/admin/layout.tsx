import Link from 'next/link';
import { AdminAccessCard } from '@/components/admin/admin-access-card';
import { InitialAdminClaimCard } from '@/components/admin/initial-admin-claim-card';
import { AdminNav } from '@/components/admin/admin-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminPageContext } from '@/lib/admin-page.server';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, adminSettings, adminSettingsError } = await getAdminPageContext();

  if (!adminSettings) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="w-full space-y-6">
          <HeaderBlock
            eyebrow="Admin"
            title="Admin workspace unavailable"
            description="The admin API did not return a usable settings payload. Check the backend and apply the latest migrations."
          />
          <AdminAccessCard
            title="Admin data unavailable"
            description="The workspace could not load admin state. Check the API, Supabase connection, and latest migration."
            details={adminSettingsError ?? undefined}
          />
        </div>
      </main>
    );
  }

  if (!adminSettings.setup.adminStorageReady) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="w-full space-y-6">
          <HeaderBlock
            eyebrow="Admin"
            title="Admin storage is not ready"
            description="Admin validation depends on the persisted admin roster table. The workspace cannot validate or manage admins until that storage is available."
          />
          <AdminAccessCard
            title="Apply admin storage migration"
            description="The admin roster table is missing or unavailable, so admin bootstrap and admin management are disabled."
            details={adminSettings.setup.adminStorageMessage ?? undefined}
          />
        </div>
      </main>
    );
  }

  if (adminSettings.setup.canBootstrapInitialAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="w-full space-y-6">
          <HeaderBlock
            eyebrow="Setup"
            title="Initialize the admin workspace"
            description="No administrator exists yet. Claim the first admin account, then manage the roster and policies from here."
          />
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <InitialAdminClaimCard />
            <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <CardHeader>
                <CardTitle className="text-xl">After setup</CardTitle>
                <CardDescription>The first claim establishes the initial managed admin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-slate-500">
                <p>You will gain access to the full admin workspace immediately.</p>
                <p>You can add more admins by email or Clerk user ID from the access section.</p>
                <p>Course creation lives inside each organization workspace, not the global admin section.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (!adminSettings.isAppAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="w-full space-y-6">
          <HeaderBlock
            eyebrow="Admin"
            title="Insufficient permission"
            description="This account is signed in, but it is not part of the current admin roster."
          />
          <AdminAccessCard
            title="Insufficient permission"
            description="Ask an existing administrator to add your email or Clerk user ID from the admin roster."
            details={`Signed in as ${user.primaryEmailAddress?.emailAddress ?? user.id}`}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Admin</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Admin panel</h1>
            <p className="text-sm leading-6 text-slate-500">Workspace access, rules, and organizations.</p>
          </div>
          <AdminNav />
          <Button asChild variant="outline" className="w-full justify-center">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}

function HeaderBlock({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{title}</h1>
      <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
