import { getStripeClient, getStripeWebhookSecret } from './stripeClient';
import { storage } from './storage';
import Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const stripe = await getStripeClient();
    const webhookSecret = getStripeWebhookSecret();
    
    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch (err: any) {
        throw new Error(`Webhook signature verification failed: ${err.message}`);
      }
    } else {
      // In development without webhook secret, parse directly (less secure)
      console.warn('STRIPE_WEBHOOK_SECRET not set - skipping signature verification');
      event = JSON.parse(payload.toString()) as Stripe.Event;
    }

    // Handle subscription events
    await WebhookHandlers.handleSubscriptionEvents(event);
  }

  static async handleSubscriptionEvents(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.subscription && session.customer) {
          const customerId = typeof session.customer === 'string' 
            ? session.customer 
            : session.customer.id;
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;

          // Find user by customer ID and update their subscription
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user) {
            await storage.updateUserStripeInfo(user.id, {
              stripeSubscriptionId: subscriptionId,
              tier: 'pro',
            });
            console.log(`User ${user.id} upgraded to Pro via checkout`);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const user = await storage.getUserByStripeCustomerId(customerId);
        if (user) {
          const isActive = subscription.status === 'active' || subscription.status === 'trialing';
          await storage.updateUserStripeInfo(user.id, {
            stripeSubscriptionId: subscription.id,
            tier: isActive ? 'pro' : 'free',
          });
          console.log(`User ${user.id} subscription updated: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const user = await storage.getUserByStripeCustomerId(customerId);
        if (user) {
          await storage.updateUserStripeInfo(user.id, {
            tier: 'free',
          });
          console.log(`User ${user.id} subscription canceled`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        if (customerId) {
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user) {
            console.log(`Payment failed for user ${user.id}`);
          }
        }
        break;
      }
    }
  }
}
