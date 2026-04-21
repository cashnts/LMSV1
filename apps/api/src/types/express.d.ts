import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
      userId?: string;
      userEmail?: string;
      supabase?: SupabaseClient;
    }
  }
}

export {};
