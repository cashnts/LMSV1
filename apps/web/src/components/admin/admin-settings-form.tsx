'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import type { CourseCreationMode, OrganizationCreationMode } from '@/lib/admin-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type Props = {
  organizationCreationMode: OrganizationCreationMode;
  courseCreationMode: CourseCreationMode;
};

export function AdminSettingsForm({ organizationCreationMode, courseCreationMode }: Props) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [orgMode, setOrgMode] = useState<OrganizationCreationMode>(organizationCreationMode);
  const [courseMode, setCourseMode] = useState<CourseCreationMode>(courseCreationMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Missing Supabase JWT. Configure Clerk JWT template "supabase".');
      setLoading(false);
      return;
    }

    try {
      await apiFetch('/admin/settings', accessToken, {
        method: 'PATCH',
        body: JSON.stringify({
          organizationCreationMode: orgMode,
          courseCreationMode: courseMode,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save admin settings');
    }

    setLoading(false);
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="text-xl">Creation controls</CardTitle>
        <CardDescription>Choose whether app admins own provisioning or whether staff can self-serve.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org-mode">Organization creation</Label>
            <select
              id="org-mode"
              value={orgMode}
              onChange={(event) => setOrgMode(event.target.value as OrganizationCreationMode)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-0 focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="app_admin">App admins only</option>
              <option value="authenticated">Any signed-in user</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-mode">Course creation</Label>
            <select
              id="course-mode"
              value={courseMode}
              onChange={(event) => setCourseMode(event.target.value as CourseCreationMode)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-0 focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="app_admin">App admins only</option>
              <option value="org_staff">Organization staff</option>
            </select>
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
            {error ? <p className="text-sm text-red-600">{error}</p> : <span className="text-sm text-slate-500">Changes apply immediately.</span>}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
