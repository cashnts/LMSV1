'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateLessonForm({ courseId, orgId }: { courseId: string; orgId: string }) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [title, setTitle] = useState('');
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
      const lesson = await apiFetch<{ id: string }>('/lessons', accessToken, {
        method: 'POST',
        body: JSON.stringify({ courseId, title, contentMd: '', sortOrder: 0 }),
      });
      setTitle('');
      router.refresh();
      if (lesson?.id) {
        router.push(`/org/${orgId}/courses/${courseId}/lessons/${lesson.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap gap-2 items-end">
      <div className="space-y-2 flex-1 min-w-[200px]">
        <Label htmlFor="ltitle">New lesson</Label>
        <Input id="ltitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title" required />
      </div>
      {error && <p className="text-sm text-red-600 w-full">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? '…' : 'Add'}
      </Button>
    </form>
  );
}
