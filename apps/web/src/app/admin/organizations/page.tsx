import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { AdminOrganization } from '@/lib/admin-settings';
import { getAdminPageContext } from '@/lib/admin-page.server';
import { CreateOrgForm } from '@/components/orgs/create-org-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizationsPage() {
  const { accessToken } = await getAdminPageContext();

  let orgs: AdminOrganization[] = [];
  try {
    orgs = await apiFetch<AdminOrganization[]>('/admin/organizations', accessToken);
  } catch {
    orgs = [];
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Organizations</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Organizations</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Provision organizations here, then open each workspace to manage its courses.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <CreateOrgForm
          canCreate
          title="Create organization"
          description="Provision a new organization and assign the current admin as its initial owner."
        />
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Organization registry</CardTitle>
                <CardDescription>Open an organization to manage its catalog and settings.</CardDescription>
              </div>
              <Badge variant="secondary">{orgs.length} records</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {orgs.length === 0 ? (
              <p className="text-sm text-slate-500">No organizations found.</p>
            ) : (
              orgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{org.name}</p>
                    <p className="text-xs text-slate-500">{new Date(org.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={org.subscription_status === 'active' ? 'success' : 'secondary'}>
                      {org.subscription_status ?? 'inactive'}
                    </Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/org/${org.id}`}>Open workspace</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
