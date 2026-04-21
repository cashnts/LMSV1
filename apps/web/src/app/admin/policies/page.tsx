import { getAdminPageContext } from '@/lib/admin-page.server';
import { AdminSettingsForm } from '@/components/admin/admin-settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminPoliciesPage() {
  const { adminSettings } = await getAdminPageContext();
  if (!adminSettings) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Policies</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Creation policies</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Control who can create organizations and where course creation is allowed.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminSettingsForm
          organizationCreationMode={adminSettings.creationSettings.organizationCreationMode}
          courseCreationMode={adminSettings.creationSettings.courseCreationMode}
        />
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-xl">Policy notes</CardTitle>
            <CardDescription>How these rules affect the product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-500">
            <p>Organization creation determines whether setup is centralized or self-serve.</p>
            <p>Course creation controls whether catalog management stays with admins or can be handled by organization staff.</p>
            <p>Course creation itself still happens inside organization workspaces, not from the global admin section.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
