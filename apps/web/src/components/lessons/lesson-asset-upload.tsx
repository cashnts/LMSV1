'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Label } from '@/components/ui/label';

export function LessonAssetUpload({
  lessonId,
  kind,
}: {
  lessonId: string;
  kind: 'file' | 'image' | 'video';
}) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const config = {
    file: {
      label: 'File upload',
      accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.md,.txt,text/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    image: {
      label: 'Picture upload',
      accept: 'image/*',
    },
    video: {
      label: 'Video upload',
      accept: 'video/*',
    },
  }[kind];

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Missing Supabase JWT. Configure Clerk JWT template "supabase".');
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch<{
        path: string;
        token: string;
      }>(`/lessons/${lessonId}/assets/upload`, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          kind: kind === 'file' ? 'file' : kind,
          mimeType: file.type || undefined,
        }),
      });
      if (!res?.token || !res?.path) {
        setError('No upload token returned');
        setLoading(false);
        return;
      }
      const supabase = createClient(accessToken);
      const { error: upErr } = await supabase.storage.from('lesson-assets').uploadToSignedUrl(res.path, res.token, file, {
        upsert: true,
      });
      if (upErr) {
        setError(upErr.message);
        setLoading(false);
        return;
      }
      await supabase.from('lesson_assets').update({ bytes: file.size, status: 'ready' }).eq('object_path', res.path);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
    setLoading(false);
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`file-${kind}-${lessonId}`}>{config.label}</Label>
      <input
        id={`file-${kind}-${lessonId}`}
        type="file"
        accept={config.accept}
        onChange={onFile}
        disabled={loading}
        className="text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {loading && <p className="text-xs text-neutral-500">Uploading…</p>}
    </div>
  );
}
