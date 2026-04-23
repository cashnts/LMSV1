'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

type Comment = {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  author_name: string;
  created_at: string;
};

type Props = {
  lessonId: string;
};

export function LessonComments({ lessonId }: Props) {
  const { user } = useUser();
  const { getAccessToken } = useSupabaseAccessToken();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function loadComments() {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const data = await apiFetch<Comment[]>(`/comments?lessonId=${lessonId}`, token);
        setComments(data);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        setLoading(false);
      }
    }

    loadComments();
    intervalId = setInterval(loadComments, 15000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const authorName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User';

      const comment = await apiFetch<Comment>('/comments', token, {
        method: 'POST',
        body: JSON.stringify({ lessonId, content: newComment.trim(), authorName }),
      });
      
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      await apiFetch(`/comments/${id}`, token, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  }

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
        <MessageSquare className="size-4" />
        Discussions ({comments.length})
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-slate-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-500">No discussions yet. Start one!</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {comment.user_id === user?.id ? 'You' : (comment.author_name || 'User')}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">{comment.content}</p>
                  </div>
                  {comment.user_id === user?.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ask a question or share a thought..."
          className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:focus-visible:ring-slate-400"
        />
        <Button type="submit" disabled={submitting || !newComment.trim()} size="sm" className="h-9">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
