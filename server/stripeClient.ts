import Stripe from 'stripe';

let cachedCredentials: { publishableKey: string; secretKey: string } | null = null;
let stripeClient: Stripe | null = null;

async function getCredentials() {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  // Use standard environment variables (fully portable)
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
    cachedCredentials = {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
    };
    return cachedCredentials;
  }

  // Fallback: Try Replit Connectors if available (for Replit deployments)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (hostname) {
    const xReplitToken = process.env.REPL_IDENTITY
      ? 'repl ' + process.env.REPL_IDENTITY
      : process.env.WEB_REPL_RENEWAL
        ? 'depl ' + process.env.WEB_REPL_RENEWAL
        : null;

    if (xReplitToken) {
      const connectorName = 'stripe';
      const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
      const targetEnvironment = isProduction ? 'production' : 'development';

      const url = new URL(`https://${hostname}/api/v2/connection`);
      url.searchParams.set('include_secrets', 'true');
      url.searchParams.set('connector_names', connectorName);
      url.searchParams.set('environment', targetEnvironment);

      try {
        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        });

        const data = await response.json();
        const connectionSettings = data.items?.[0];

        if (connectionSettings?.settings?.publishable && connectionSettings?.settings?.secret) {
          cachedCredentials = {
            publishableKey: connectionSettings.settings.publishable,
            secretKey: connectionSettings.settings.secret,
          };
          return cachedCredentials;
        }
      } catch (error) {
        console.warn('Failed to fetch Replit Stripe connector:', error);
      }
    }
  }

  throw new Error(
    'Stripe credentials not found. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables.'
  );
}

export async function getStripeClient(): Promise<Stripe> {
  if (!stripeClient) {
    const { secretKey } = await getCredentials();
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey);
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = await getCredentials();
  return secretKey;
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET;
}
