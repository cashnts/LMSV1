'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function LessonEditorForm({
  lessonId,
  initialTitle,
  initialMd,
}: {
  lessonId: string;
  initialTitle: string;
  initialMd: string;
}) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [title, setTitle] = useState(initialTitle);
  const [contentMd, setContentMd] = useState(initialMd);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
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
      await apiFetch(`/lessons/${lessonId}`, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ title, contentMd }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lt">Title</Label>
        <Input id="lt" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lm">Markdown</Label>
        <Textarea
          id="lm"
          value={contentMd}
          onChange={(e) => setContentMd(e.target.value)}
          rows={8}
          className="font-mono text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save lesson'}
      </Button>
    </form>
  );
}
