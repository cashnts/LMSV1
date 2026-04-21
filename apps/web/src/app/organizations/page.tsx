import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getSupabaseAccessTokenFromSession } from '@/lib/supabase-access-token.server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    orgs = await apiFetch<OrgRow[]>('/organizations', accessToken);
  } catch {
    orgs = [];
  }

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Organizations</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Your organizations</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Open the organizations you belong to. New organization provisioning lives in the admin workspace.
        </p>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-xl">Memberships</CardTitle>
          <CardDescription>Access level and current subscription state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orgs.length === 0 ? (
            <p className="text-sm text-slate-500">No organizations yet.</p>
          ) : (
            orgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">{org.name}</p>
                  <p className="text-xs text-slate-500">{org.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={org.subscription_status === 'active' ? 'success' : 'secondary'}>
                    {org.subscription_status ?? 'inactive'}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/org/${org.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
