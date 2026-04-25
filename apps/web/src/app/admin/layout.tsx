import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
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
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 text-center">
        <HeaderBlock eyebrow="System" title="Admin access unavailable" description="Please check your backend connection." />
        <AdminAccessCard title="Connectivity Error" details={adminSettingsError ?? undefined} />
      </main>
    );
  }

  if (adminSettings.setup.canBootstrapInitialAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <div className="w-full space-y-8 text-center">
          <HeaderBlock eyebrow="Setup" title="Welcome to your LMS" description="Claim the initial administrator account." />
          <InitialAdminClaimCard />
        </div>
      </main>
    );
  }

  if (!adminSettings.isAppAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 text-center">
        <HeaderBlock eyebrow="Restricted" title="Permission Denied" description="Administrative privileges required." />
        <Button asChild variant="outline" className="mt-8">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-[#090b11]">
      <div className="mx-auto w-full max-w-7xl px-4 pt-10 pb-24 sm:px-6">
        {/* Simple Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-brand-primary">
              Admin Panel
            </h1>
            <p className="text-sm font-medium text-slate-500 italic">Manage your platform workspace</p>
          </div>

          <Button asChild variant="ghost" className="rounded-xl font-bold text-slate-400 hover:text-brand-primary transition-colors">
            <Link href="/dashboard">
              <ChevronLeft className="mr-2 size-4" />
              Exit to App
            </Link>
          </Button>
        </div>

        {/* Sidebar Layout */}
        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="lg:w-64 shrink-0">
             <div className="sticky top-24">
                <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation</p>
                <AdminNav />
             </div>
          </aside>

          <section className="flex-1 min-w-0 min-h-[60vh] animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}

function HeaderBlock({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">{eyebrow}</p>
      <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">{title}</h1>
      <p className="max-w-2xl mx-auto text-lg text-slate-500">{description}</p>
    </div>
  );
}
