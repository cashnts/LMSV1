import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'standardwebhooks';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('clerk')
export class ClerkWebhookController {
  constructor(
    private readonly config: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
    @Headers('svix-id') id: string,
    @Headers('svix-timestamp') timestamp: string,
    @Headers('svix-signature') signature: string,
  ) {
    const secret = this.config.get<string>('CLERK_WEBHOOK_SECRET');
    if (!secret) {
      console.warn('CLERK_WEBHOOK_SECRET not configured, skipping verification');
    }

    const payload = req.body;
    const body = JSON.stringify(payload);

    if (secret) {
      const wh = new Webhook(secret);
      try {
        wh.verify(body, {
          'svix-id': id,
          'svix-timestamp': timestamp,
          'svix-signature': signature,
        });
      } catch (err) {
        throw new BadRequestException('Invalid signature');
      }
    }

    const event = payload;
    const { data, type } = event;

    const supabase = this.supabaseService.createServiceClient();

    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const userId = data.id;
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const avatarUrl = data.image_url || '';
        const username = data.username || null;
        const email = data.email_addresses?.[0]?.email_address || null;

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email,
            username,
            full_name: fullName || null,
            avatar_url: avatarUrl || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (error) {
          console.error('Error syncing user to Supabase:', error);
          throw new InternalServerErrorException(error.message);
        }
        break;
      }

      case 'user.deleted': {
        const userId = data.id;
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) {
          console.error('Error deleting user from Supabase:', error);
          throw new InternalServerErrorException(error.message);
        }
        break;
      }

      default:
        return { success: true, ignored: true };
    }

    return { success: true };
  }
}
