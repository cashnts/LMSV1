import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
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
