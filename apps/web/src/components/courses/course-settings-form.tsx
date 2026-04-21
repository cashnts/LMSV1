'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function CourseSettingsForm({
  courseId,
  initialTitle,
  initialDescription,
  initialPublished,
  initialThumbnailUrl,
}: {
  courseId: string;
  initialTitle: string;
  initialDescription: string;
  initialPublished: boolean;
  initialThumbnailUrl: string;
}) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [published, setPublished] = useState(initialPublished);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl);
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
      await apiFetch(`/courses/${courseId}`, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ title, description, published, thumbnailUrl: thumbnailUrl || null }),
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
        <Label htmlFor="ctitle">Title</Label>
        <Input id="ctitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cdesc">Description</Label>
        <Textarea id="cdesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cthumb">Thumbnail URL</Label>
        <Input
          id="cthumb"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://example.com/course-cover.jpg"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded border-neutral-300"
        />
        Published (visible to learners who enroll)
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save course'}
      </Button>
    </form>
  );
}
