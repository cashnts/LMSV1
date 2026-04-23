'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, CheckCircle } from 'lucide-react';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Props = {
  courseId: string;
};

export function ClaimCertificateButton({ courseId }: Props) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleClaim() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      await apiFetch('/certificates/issue', token, {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to claim certificate');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        <CheckCircle className="size-5" />
        Certificate claimed! Check your dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClaim}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Award className="size-4" />
        {loading ? 'Claiming...' : 'Claim Certificate'}
      </Button>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
