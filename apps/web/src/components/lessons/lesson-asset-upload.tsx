'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'tus-js-client';
import { UploadCloud, FileText, Image as ImageIcon, Video, XCircle, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { cn } from '@/lib/utils';

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

type UploadIntent =
  | { uploadType: 'bunny-stream'; asset: { id: string }; tusEndpoint: string; authSignature: string; authExpire: number; videoId: string; libraryId: string }
  | { uploadType: 'bunny-storage'; asset: { id: string }; uploadPath: string }
  | { uploadType: 'supabase'; asset: { id: string }; signedUrl: string; path: string; token: string };

export function LessonAssetUpload({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [statusLabel, setStatusLabel] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  async function handleUpload(file: File) {
    setProgress(0);
    setError(null);
    setStatusLabel('Preparing…');

    // Determine kind based on mime type
    let kind: 'video' | 'image' | 'file' = 'file';
    if (file.type.startsWith('video/')) kind = 'video';
    else if (file.type.startsWith('image/')) kind = 'image';

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Authentication required.');
      setProgress(null);
      return;
    }

    try {
      const intent = await apiFetch<UploadIntent>(`/lessons/${lessonId}/assets/upload`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, kind, mimeType: file.type || undefined }),
      });

      if (intent.uploadType === 'bunny-stream') {
        setStatusLabel('Uploading video…');
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
        await apiFetch(`/lessons/assets/${intent.asset.id}`, accessToken, {
          method: 'PATCH',
          body: JSON.stringify({ bytes: file.size }),
        });

      } else if (intent.uploadType === 'bunny-storage') {
        setStatusLabel(`Uploading ${kind}…`);
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
            else reject(new Error(`Upload failed (${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(form);
        });

      } else {
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
            else reject(new Error(`Upload failed (${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error('Network error'));

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

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (progress === null) setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (progress !== null) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => progress === null && inputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-10 transition-all duration-300",
          isDragging 
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5" 
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900/50",
          progress !== null && "pointer-events-none opacity-80"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          className="hidden"
        />



        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {progress !== null ? statusLabel : "Add course materials"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {progress !== null ? "Please wait for completion..." : "Drag and drop video, images, or documents here"}
          </p>
        </div>

        {progress !== null && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-white/60 backdrop-blur-[2px] dark:bg-slate-950/60">
            <div className="w-full max-w-[70%] space-y-4 px-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-indigo-600">
                <span>{statusLabel}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600 dark:bg-red-900/20">
            <XCircle className="size-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
