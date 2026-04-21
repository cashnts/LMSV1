'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uploadThumbnailAction } from '@/app/actions/upload-action';
import { ImageIcon, Link as LinkIcon, Upload } from 'lucide-react';

type CreateCourseFormProps = {
  orgId: string;
  canCreate: boolean;
  isAppAdmin: boolean;
};

export function CreateCourseForm({ orgId, canCreate }: CreateCourseFormProps) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'link'>('upload');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!canCreate) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        <p className="mb-4 font-medium text-slate-900 dark:text-slate-100">Course creation locked</p>
        <p className="mb-4">Only app administrators can add courses right now based on the organization&apos;s policy.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">Open admin panel</Link>
        </Button>
      </div>
    );
  }

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
    
    let finalThumbnailUrl = thumbnailUrl;

    try {
      if (thumbnailMode === 'upload' && thumbnailFile) {
        const formData = new FormData();
        formData.append('file', thumbnailFile);
        const uploadedUrl = await uploadThumbnailAction(formData);
        if (uploadedUrl) {
          finalThumbnailUrl = uploadedUrl;
        }
      }

      await apiFetch('/courses', accessToken, {
        method: 'POST',
        body: JSON.stringify({ 
          orgId, 
          title, 
          description, 
          published: false, 
          thumbnailUrl: finalThumbnailUrl || undefined 
        }),
      });
      setTitle('');
      setDescription('');
      setThumbnailUrl('');
      setThumbnailFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">Course title</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="e.g. Introduction to React"
          required 
          className="bg-white dark:bg-slate-950"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="desc" className="text-slate-700 dark:text-slate-300">Course description</Label>
        <Textarea 
          id="desc" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows={3} 
          placeholder="Briefly describe what students will learn..."
          className="resize-none bg-white dark:bg-slate-950"
        />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-700 dark:text-slate-300">Thumbnail</Label>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setThumbnailMode('upload')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                thumbnailMode === 'upload' 
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="size-3.5" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setThumbnailMode('link')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                thumbnailMode === 'link' 
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <LinkIcon className="size-3.5" />
              Link
            </button>
          </div>
        </div>

        {thumbnailMode === 'upload' ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <ImageIcon className="size-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-slate-900 focus-within:outline-none focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-2 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300">
                  <span>Upload a file</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {thumbnailFile ? thumbnailFile.name : 'PNG, JPG, GIF up to 10MB'}
              </p>
            </div>
          </div>
        ) : (
          <Input
            id="thumbnail"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://example.com/course-cover.jpg"
            className="bg-white dark:bg-slate-950"
          />
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      
      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full rounded-lg">
          {loading ? 'Creating course…' : 'Create course'}
        </Button>
      </div>
    </form>
  );
}
