'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'tus-js-client';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Label } from '@/components/ui/label';

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const KIND_CONFIG = {
  file: {
    label: 'Upload file',
    accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.md,.txt,text/*,application/pdf',
  },
  image: {
    label: 'Upload image',
    accept: 'image/*',
  },
  video: {
    label: 'Upload video',
    accept: 'video/*',
  },
} as const;

type UploadIntent =
  | { uploadType: 'bunny-stream'; asset: { id: string }; tusEndpoint: string; authSignature: string; authExpire: number; videoId: string; libraryId: string }
  | { uploadType: 'bunny-storage'; asset: { id: string }; uploadPath: string }
  | { uploadType: 'supabase'; asset: { id: string }; signedUrl: string; path: string; token: string };

export function LessonAssetUpload({
  lessonId,
  kind,
}: {
  lessonId: string;
  kind: 'file' | 'image' | 'video';
}) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [statusLabel, setStatusLabel] = useState('');

  const config = KIND_CONFIG[kind];

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProgress(0);
    setError(null);
    setStatusLabel('Preparing…');

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Missing Supabase JWT. Configure Clerk JWT template "supabase".');
      setProgress(null);
      return;
    }

    try {
      // Step 1: Get upload intent from API
      const intent = await apiFetch<UploadIntent>(`/lessons/${lessonId}/assets/upload`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, kind, mimeType: file.type || undefined }),
      });

      if (intent.uploadType === 'bunny-stream') {
        // --- Bunny Stream: TUS direct upload ---
        setStatusLabel('Uploading to Bunny Stream…');
        await new Promise<void>((resolve, reject) => {
          const upload = new Upload(file, {
            endpoint: intent.tusEndpoint,
            retryDelays: [0, 3000, 5000, 10000],
            headers: {
              AuthorizationSignature: intent.authSignature,
              AuthorizationExpire: String(intent.authExpire),
              VideoId: intent.videoId,
              LibraryId: intent.libraryId,
            },
            metadata: { filetype: file.type, title: file.name },
            onProgress(bytesUploaded, bytesTotal) {
              setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
            },
            onSuccess() {
              resolve();
            },
            onError(err) {
              reject(new Error(err instanceof Error ? err.message : String(err)));
            },
          });
          upload.start();
        });
        // Confirm bytes via API (status stays 'processing' until Bunny transcodes)
        await apiFetch(`/lessons/assets/${intent.asset.id}`, accessToken, {
          method: 'PATCH',
          body: JSON.stringify({ bytes: file.size }),
        });

      } else if (intent.uploadType === 'bunny-storage') {
        // --- Bunny Storage: multipart POST to API proxy ---
        setStatusLabel('Uploading to Bunny CDN…');
        const form = new FormData();
        form.append('file', file);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE()}${intent.uploadPath}`);
          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`));
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(form);
        });

      } else {
        // --- Supabase: signed URL upload ---
        setStatusLabel('Uploading…');
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', intent.signedUrl);
          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
          xhr.setRequestHeader('x-upsert', 'true');

          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`));
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));

          const form = new FormData();
          form.append('cacheControl', '3600');
          form.append('', file);
          xhr.send(form);
        });

        await apiFetch(`/lessons/assets/${intent.asset.id}`, accessToken, {
          method: 'PATCH',
          body: JSON.stringify({ bytes: file.size }),
        });
      }

      setProgress(null);
      setStatusLabel('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProgress(null);
      setStatusLabel('');
    }

    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`file-${kind}-${lessonId}`}>{config.label}</Label>
      <input
        ref={inputRef}
        id={`file-${kind}-${lessonId}`}
        type="file"
        accept={config.accept}
        onChange={onFile}
        disabled={progress !== null}
        className="text-sm"
      />
      {progress !== null && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-150 dark:bg-slate-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">{statusLabel} {progress}%</p>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
