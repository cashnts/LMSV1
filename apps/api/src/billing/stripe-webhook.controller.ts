import { Controller, Headers, Post, Req, RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('billing/stripe')
export class StripeWebhookController {
  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  private async getStripeInstance() {
    const admin = this.supabase.createServiceClient();
    const { data } = await admin
      .from('app_config')
      .select('stripe_secret_key, stripe_webhook_secret')
      .eq('id', true)
      .maybeSingle();

    const secretKey = data?.stripe_secret_key || this.config.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = data?.stripe_webhook_secret || this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!secretKey) return null;

    return {
      stripe: new Stripe(secretKey),
      webhookSecret,
    };
  }

  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const stripeConfig = await this.getStripeInstance();
    if (!stripeConfig || !stripeConfig.webhookSecret || !signature) {
      return { received: true, skipped: true };
    }

    const { stripe, webhookSecret } = stripeConfig;
    const raw = req.rawBody ?? req.body;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
    } catch {
      return { received: false, error: 'invalid signature' };
    }
    const admin = this.supabase.createServiceClient();
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string | null;
      const orgId = session.metadata?.org_id;
      if (customerId && orgId) {
        await admin
          .from('organizations')
          .update({ stripe_customer_id: customerId, subscription_status: 'active' })
          .eq('id', orgId);
      }
    }
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = sub.status;
      await admin
        .from('organizations')
        .update({
          subscription_status: status === 'active' ? 'active' : 'inactive',
        })
        .eq('stripe_customer_id', customerId);
    }
    return { received: true };
  }
}
