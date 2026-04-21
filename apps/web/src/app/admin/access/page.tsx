import { getAdminPageContext } from '@/lib/admin-page.server';
import { AdminRosterManager } from '@/components/admin/admin-roster-manager';

export const dynamic = 'force-dynamic';

export default async function AdminAccessPage() {
  const { adminSettings } = await getAdminPageContext();
  if (!adminSettings) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Access</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Admin access</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Add or remove administrators. Environment-defined bootstrap admins remain visible but cannot be removed here.
        </p>
      </div>
      <AdminRosterManager admins={adminSettings.adminRoster} />
    </div>
  );
}
