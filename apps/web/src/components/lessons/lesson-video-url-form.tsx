'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LessonVideoUrlForm({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Missing Supabase JWT. Configure Clerk JWT template "supabase".');
      await apiFetch(`/lessons/${lessonId}/assets/url`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ url, title: title || undefined }),
      });
      setUrl('');
      setTitle('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add video URL');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`vurl-url-${lessonId}`}>Bunny.net video URL</Label>
        <Input
          id={`vurl-url-${lessonId}`}
          type="url"
          placeholder="https://iframe.mediadelivery.net/embed/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`vurl-title-${lessonId}`}>Title (optional)</Label>
        <Input
          id={`vurl-title-${lessonId}`}
          type="text"
          placeholder="e.g. Introduction video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" size="sm" disabled={loading || !url}>
        {loading ? 'Adding…' : 'Add video'}
      </Button>
    </form>
  );
}
