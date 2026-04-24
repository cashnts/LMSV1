'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Plus, Trash2 } from 'lucide-react';

export function CourseSettingsForm({
  courseId,
  initialTitle,
  initialDescription,
  initialPublished,
  initialThumbnailUrl,
  initialOutcomes = [],
}: {
  courseId: string;
  initialTitle: string;
  initialDescription: string;
  initialPublished: boolean;
  initialThumbnailUrl: string;
  initialOutcomes?: string[];
}) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [published, setPublished] = useState(initialPublished);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl);
  const [outcomes, setOutcomes] = useState<string[]>(initialOutcomes);
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
        body: JSON.stringify({ 
          title, 
          description, 
          published, 
          thumbnailUrl: thumbnailUrl || null,
          outcomes: outcomes.filter(o => o.trim() !== '')
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
    setLoading(false);
  }

  function addOutcome() {
    setOutcomes([...outcomes, '']);
  }

  function removeOutcome(index: number) {
    setOutcomes(outcomes.filter((_, i) => i !== index));
  }

  function updateOutcome(index: number, value: string) {
    const newOutcomes = [...outcomes];
    newOutcomes[index] = value;
    setOutcomes(newOutcomes);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="space-y-4">
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>What you'll achieve</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOutcome} className="h-8 gap-1">
              <Plus className="size-3" />
              Add point
            </Button>
          </div>
          <div className="space-y-2">
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <Input 
                  value={outcome} 
                  onChange={(e) => updateOutcome(index, e.target.value)} 
                  placeholder="e.g. Master foundational principles"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeOutcome(index)}
                  className="shrink-0 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {outcomes.length === 0 && (
              <p className="text-xs text-slate-500 italic">No outcomes added yet. Click "Add point" to start.</p>
            )}
          </div>
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
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? 'Saving…' : 'Save course settings'}
      </Button>
    </form>
  );
}
