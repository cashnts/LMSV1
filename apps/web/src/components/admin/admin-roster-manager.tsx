'use client';

import { useState } from 'react';
import { ShieldPlus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AdminRosterMember } from '@/lib/admin-settings';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  admins: AdminRosterMember[];
};

export function AdminRosterManager({ admins }: Props) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function createAdmin(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Missing Supabase JWT. Configure Clerk JWT template "supabase".');
      setSaving(false);
      return;
    }

    try {
      await apiFetch('/admin/admins', accessToken, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim() || undefined,
          userId: userId.trim() || undefined,
        }),
      });
      setEmail('');
      setUserId('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin');
    }

    setSaving(false);
  }

  async function removeAdmin(id: number) {
    setRemovingId(id);
    setError(null);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Missing Supabase JWT. Configure Clerk JWT template "supabase".');
      setRemovingId(null);
      return;
    }

    try {
      await apiFetch(`/admin/admins/${id}`, accessToken, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    }

    setRemovingId(null);
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Admin roster</CardTitle>
            <CardDescription className="mt-1">Add or remove administrators. Environment-defined admins stay locked.</CardDescription>
          </div>
          <Badge variant="secondary">
            {admins.length} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={createAdmin} className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Add administrator</h3>
            <p className="text-sm text-slate-500">Email is recommended. User ID works if you already know the Clerk identity.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@school.edu"
              className="bg-white dark:bg-slate-950"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-user-id">Clerk user ID</Label>
            <Input
              id="admin-user-id"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="user_2abc123xyz"
              className="bg-white dark:bg-slate-950"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={saving} className="w-full">
            <ShieldPlus className="h-4 w-4" />
            {saving ? 'Granting access…' : 'Grant admin access'}
          </Button>
        </form>

        <div className="space-y-3">
          {admins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-800">
              No administrators found.
            </div>
          ) : (
            admins.map((admin) => (
              <div
                key={`${admin.source}-${admin.id ?? admin.email ?? admin.userId}`}
                className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950 dark:text-slate-50">
                      {admin.email ?? admin.userId ?? 'Unknown identity'}
                    </p>
                    <Badge variant={admin.source === 'managed' ? 'success' : 'secondary'}>
                      {admin.source === 'managed' ? 'Managed' : 'Bootstrap'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    {admin.email && <p>Email: {admin.email}</p>}
                    {admin.userId && <p>User ID: {admin.userId}</p>}
                    {admin.createdAt && <p>Added {new Date(admin.createdAt).toLocaleString()}</p>}
                    {(admin.addedByEmail || admin.addedByUserId) && (
                      <p>Added by {admin.addedByEmail ?? admin.addedByUserId}</p>
                    )}
                  </div>
                </div>

                {admin.removable && admin.id !== null ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={removingId === admin.id}
                    onClick={() => removeAdmin(admin.id!)}
                    className="text-red-700 dark:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    {removingId === admin.id ? 'Removing…' : 'Remove'}
                  </Button>
                ) : (
                  <p className="text-xs font-medium text-slate-400">Locked</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
