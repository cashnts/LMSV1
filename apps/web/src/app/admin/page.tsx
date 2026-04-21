import { apiFetch } from '@/lib/api';
import type { AdminOrganization } from '@/lib/admin-settings';
import { getAdminPageContext } from '@/lib/admin-page.server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const { accessToken, adminSettings } = await getAdminPageContext();
  if (!adminSettings) return null;

  let orgs: AdminOrganization[] = [];
  try {
    orgs = await apiFetch<AdminOrganization[]>('/admin/organizations', accessToken);
  } catch {
    orgs = [];
  }

  const activeSubscriptions = orgs.filter((org) => org.subscription_status === 'active').length;
  const managedAdmins = adminSettings.adminRoster.filter((admin) => admin.source === 'managed').length;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Overview</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Workspace administration</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Use admin pages to manage who has control, what creation policies are active, and which organizations are operating in the workspace.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Admins" value={adminSettings.adminRoster.length} hint={`${managedAdmins} managed`} />
        <StatCard label="Organizations" value={orgs.length} hint={`${activeSubscriptions} active`} />
        <StatCard
          label="Organization policy"
          value={adminSettings.creationSettings.organizationCreationMode === 'authenticated' ? 'Open' : 'Restricted'}
          hint="Who can create organizations"
        />
        <StatCard
          label="Course policy"
          value={adminSettings.creationSettings.courseCreationMode === 'org_staff' ? 'Delegated' : 'Restricted'}
          hint="Where courses are created"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-xl">Access model</CardTitle>
            <CardDescription>How admins are recognized in this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-500">
            <p>Managed admins are stored in the workspace and can be changed from the access page.</p>
            <p>Bootstrap admins defined in environment variables remain valid and appear as locked entries.</p>
            <p>The first admin can bootstrap the workspace only when no admin exists and admin storage is ready.</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-xl">Content model</CardTitle>
            <CardDescription>Where organizations and courses are created.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-500">
            <p>Organizations are provisioned from the admin organizations page.</p>
            <p>Courses are created inside each organization workspace, not from the global admin section.</p>
            <p>If course policy is delegated, organization staff can create courses without global admin access.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Organization snapshot</CardTitle>
              <CardDescription>Quick visibility into the current workspace footprint.</CardDescription>
            </div>
            <Badge variant="secondary">{orgs.length} records</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {orgs.length === 0 ? (
            <p className="text-sm text-slate-500">No organizations found.</p>
          ) : (
            orgs.slice(0, 5).map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">{org.name}</p>
                  <p className="text-xs text-slate-500">{new Date(org.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={org.subscription_status === 'active' ? 'success' : 'secondary'}>
                  {org.subscription_status ?? 'inactive'}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}
