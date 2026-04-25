import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { SupabaseService } from '../supabase/supabase.service';

export type AuthedRequest = {
  accessToken: string;
  userId: string;
  email?: string;
  supabase: ReturnType<SupabaseService['createUserClient']>;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const accessToken = auth.slice(7);
    const supabase = this.supabaseService.createUserClient(accessToken);

    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    const jwtKey = this.config.get<string>('CLERK_JWT_KEY');
    if (!secretKey && !jwtKey) {
      throw new UnauthorizedException('Missing CLERK_SECRET_KEY or CLERK_JWT_KEY');
    }

    let payload: Awaited<ReturnType<typeof verifyToken>>;
    try {
      payload = await verifyToken(accessToken, {
        ...(secretKey ? { secretKey } : {}),
        ...(jwtKey ? { jwtKey } : {}),
      });
    } catch {
      throw new UnauthorizedException('Invalid session');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid session');
    }

    // Check if user is suspended or needs info sync
    const serviceClient = this.supabaseService.createServiceClient();
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('suspended_at, email, username')
      .eq('id', payload.sub)
      .maybeSingle();

    if (profile?.suspended_at) {
      throw new ForbiddenException('Your account has been suspended.');
    }

    // Auto-sync profile if it doesn't exist or is missing email/username
    if (!profile || !profile.email) {
      const firstName = typeof payload.first_name === 'string' ? payload.first_name : '';
      const lastName = typeof payload.last_name === 'string' ? payload.last_name : '';
      const fullName = `${firstName} ${lastName}`.trim();
      const avatarUrl = typeof payload.image_url === 'string' ? payload.image_url : 
                        typeof payload.profile_image_url === 'string' ? payload.profile_image_url : null;
      const username = typeof payload.username === 'string' ? payload.username : null;
      const email = typeof payload.email === 'string' ? payload.email : 
                    typeof payload.email_address === 'string' ? payload.email_address : null;

      await serviceClient.from('profiles').upsert({
        id: payload.sub,
        email,
        username,
        full_name: fullName || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    req.accessToken = accessToken;
    req.userId = payload.sub;
    req.userEmail =
      typeof payload.email === 'string'
        ? payload.email
        : typeof payload.email_address === 'string'
          ? payload.email_address
          : undefined;
    req.supabase = supabase;
    return true;
  }
}
