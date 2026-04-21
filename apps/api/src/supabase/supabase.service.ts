import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  constructor(private readonly config: ConfigService) {}

  getUrl(): string {
    const url =
      this.config.get<string>('SUPABASE_URL') ?? this.config.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    if (!url) throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required');
    return url;
  }

  /** Publishable / anon key — used with end-user JWT so RLS applies. */
  getAnonKey(): string {
    const key =
      this.config.get<string>('SUPABASE_PUBLISHABLE_KEY') ??
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
      this.config.get<string>('SUPABASE_ANON_KEY') ??
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!key) {
      throw new Error(
        'SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or SUPABASE_ANON_KEY is required',
      );
    }
    return key;
  }

  /** Service role — webhooks / admin only. */
  getServiceRoleKey(): string | undefined {
    return this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  }

  createUserClient(accessToken: string): SupabaseClient {
    return createClient(this.getUrl(), this.getAnonKey(), {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  createServiceClient(): SupabaseClient {
    const key = this.getServiceRoleKey();
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for this operation');
    return createClient(this.getUrl(), key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}
