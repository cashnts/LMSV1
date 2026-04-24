import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { Badge } from '@/components/ui/badge';

type OrgRow = {
  id: string;
  name: string;
  subscription_status: string | null;
  created_at: string;
  role: string;
};

export const dynamic = 'force-dynamic';

export default async function OrganizationsPage() {
  const accessToken = await getSupabaseAccessTokenFromSession();
  if (!accessToken) return null;

  let orgs: OrgRow[] = [];
  try {
    orgs = await apiFetch<OrgRow[]>('/organization', accessToken);
  } catch {
    orgs = [];
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pt-10 pb-20">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          Organizations
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Manage and access your organization workspaces.
        </p>
      </div>

      <div className="grid gap-4">
        {orgs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500">No organizations found.</p>
          </div>
        ) : (
          orgs.map((org) => (
            <Link
              key={org.id}
              href={`/org/${org.id}`}
              className="group flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center gap-5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-900 dark:text-slate-400 dark:group-hover:bg-indigo-950/30">
                  <Building2 className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {org.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500 capitalize">{org.role}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <Badge 
                      variant={org.subscription_status === 'active' ? 'success' : 'secondary'}
                      className="h-5 px-1.5 text-[10px]"
                    >
                      {org.subscription_status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              <ArrowRight className="size-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-500" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
