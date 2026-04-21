'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Button } from '@/components/ui/button';

export function LessonCompleteButton({
  lessonId,
  initialDone,
}: {
  lessonId: string;
  initialDone: boolean;
}) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [done, setDone] = useState(initialDone);
  const [loading, setLoading] = useState(false);

  async function complete() {
    setLoading(true);
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    try {
      await apiFetch('/progress/complete', accessToken, {
        method: 'POST',
        body: JSON.stringify({ lessonId }),
      });
      setDone(true);
      router.refresh();
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  if (done) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        Done
      </Button>
    );
  }

  return (
    <Button type="button" size="sm" onClick={complete} disabled={loading}>
      {loading ? '…' : 'Mark complete'}
    </Button>
  );
}
