'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function EnrollByIdForm() {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [courseId, setCourseId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Missing Supabase JWT. Configure Clerk JWT template "supabase".');
      setLoading(false);
      return;
    }
    try {
      await apiFetch('/enrollments', accessToken, {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
      setCourseId('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="relative flex w-full max-w-md items-center gap-2">
      <Input
        id="cid"
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        placeholder="Enter course ID to join"
        required
        className="h-10 border-white/20 bg-white/5 text-white placeholder:text-slate-400 focus-visible:ring-white/30 dark:border-white/20 dark:bg-white/5 dark:text-white"
      />
      <Button type="submit" disabled={loading} className="h-10 bg-white px-6 font-medium text-slate-950 hover:bg-slate-100 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
        {loading ? '…' : 'Join'}
      </Button>
      {error && <p className="absolute -bottom-6 text-sm text-red-300">{error}</p>}
    </form>
  );
}
