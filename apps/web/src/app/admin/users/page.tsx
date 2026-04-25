import { UserManager } from '@/components/admin/user-roles-manager';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">User Management</h1>
        <p className="text-slate-500">Manage user accounts, roles, and security status.</p>
      </div>
      <UserManager />
    </div>
  );
}
