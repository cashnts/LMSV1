'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
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
      setError('Missing Supabase JWT.');
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
           <Plus className="size-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add New Lesson</h3>
      </div>
      
      <form onSubmit={onSubmit} className="relative">
        <Input 
          id="ltitle" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="What should learners study next?" 
          required 
          className="h-14 pr-24 rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm"
        />
        <div className="absolute right-1.5 top-1.5 bottom-1.5">
          <Button 
            type="submit" 
            disabled={loading || !title.trim()} 
            className="h-full rounded-xl bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {loading ? '...' : 'Create'}
          </Button>
        </div>
      </form>
      
      {error && <p className="text-xs font-medium text-red-600 ml-1">{error}</p>}
      
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 ml-1">
        New lessons are added to the end of the curriculum by default.
      </p>
    </div>
  );
}
