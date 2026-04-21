'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import type { AdminSettingsResponse } from '@/lib/admin-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function InitialAdminClaimCard() {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claimAdmin() {
    setLoading(true);
    setError(null);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Missing Supabase JWT. Configure Clerk JWT template "supabase".');
      setLoading(false);
      return;
    }

    try {
      await apiFetch<AdminSettingsResponse>('/admin/bootstrap/claim', accessToken, { method: 'POST' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim admin access');
    }

    setLoading(false);
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
            <KeyRound className="h-4 w-4" />
          </span>
          Claim initial admin access
        </CardTitle>
        <CardDescription>
          No admin is configured yet. The first signed-in user can claim ownership of the admin workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-slate-500">
          This action creates the first managed admin entry for your current account. After that, you can add other
          administrators from the roster panel.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="button" onClick={claimAdmin} disabled={loading}>
          {loading ? 'Claiming…' : 'Claim admin access'}
        </Button>
      </CardContent>
    </Card>
  );
}
