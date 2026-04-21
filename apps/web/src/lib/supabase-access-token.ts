'use client';

import { useAuth } from '@clerk/nextjs';
import { CLERK_SUPABASE_JWT_TEMPLATE } from '@/lib/auth.constants';

/**
 * Returns a Supabase-compatible JWT for PostgREST / Nest (RLS uses `auth.uid()`).
 * Requires Clerk ↔ Supabase integration (JWT template "supabase").
 */
export function useSupabaseAccessToken() {
  const { getToken, isLoaded } = useAuth();
  return {
    isLoaded,
    getAccessToken: () => getToken({ template: CLERK_SUPABASE_JWT_TEMPLATE }),
  };
}
