'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Button } from '@/components/ui/button';

export function EnrollCourseButton({
  courseId,
  enrolled,
}: {
  courseId: string;
  enrolled: boolean;
}) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enroll() {
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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    }

    setLoading(false);
  }

  return (
    <div className="space-y-2 w-full">
      <Button className="w-full" type="button" onClick={enroll} disabled={loading || enrolled}>
        {enrolled ? 'Enrolled' : loading ? 'Enrolling…' : 'Enroll now'}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
