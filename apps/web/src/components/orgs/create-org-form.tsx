'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type CreateOrgFormProps = {
  canCreate: boolean;
  title?: string;
  description?: string;
  lockedMessage?: string;
};

export function CreateOrgForm({
  canCreate,
  title = 'New organization',
  description = 'Creates a school and makes you the owner.',
  lockedMessage = 'Organization creation is limited to app administrators right now.',
}: CreateOrgFormProps) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!canCreate) {
    return (
      <Card className="border-dashed border-neutral-300 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/50">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{lockedMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
          <p>Open the admin panel to change creation rules or create the organization with an app admin account.</p>
          <Button asChild variant="outline">
            <Link href="/admin">Open admin panel</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Missing Supabase JWT. Add Clerk JWT template "supabase" (see README).');
      setLoading(false);
      return;
    }
    try {
      await apiFetch('/organizations', accessToken, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setName('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
    setLoading(false);
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Academy"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
