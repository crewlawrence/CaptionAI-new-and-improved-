/**
 * Seed script to create the Pro subscription product and price in Stripe.
 * Run this once to set up the subscription in your Stripe account.
 * 
 * Usage: npx tsx scripts/seed-stripe-products.ts
 */

import Stripe from 'stripe';

async function getStripeClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', 'development');

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings?.secret) {
    throw new Error('Stripe connection not found');
  }

  return new Stripe(connectionSettings.settings.secret);
}

async function seedProducts() {
  console.log('Connecting to Stripe...');
  const stripe = await getStripeClient();
  console.log('Connected to Stripe!');

  // Check if Pro product already exists
  console.log('Checking for existing Pro product...');
  const existingProducts = await stripe.products.list({ active: true, limit: 100 });
  const existingPro = existingProducts.data.find(p => 
    p.name.toLowerCase().includes('pro') || p.metadata?.plan === 'pro'
  );

  if (existingPro) {
    console.log(`Pro product already exists: ${existingPro.id}`);
    
    // Check for active price
    const prices = await stripe.prices.list({ product: existingPro.id, active: true });
    if (prices.data.length > 0) {
      console.log(`Pro price exists: ${prices.data[0].id}`);
      console.log('Stripe products are already set up!');
      return;
    }
  }

  // Create Pro product
  console.log('Creating Pro product...');
  const product = await stripe.products.create({
    name: 'CaptionAI Pro',
    description: 'Unlimited AI-powered caption generation for all your social media needs.',
    metadata: {
      plan: 'pro',
      features: 'unlimited_captions,all_styles,priority_processing',
    },
  });
  console.log(`Created product: ${product.id}`);

  // Create monthly price
  console.log('Creating Pro monthly price...');
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 999, // $9.99
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    lookup_key: 'pro_monthly',
    metadata: {
      plan: 'pro',
      billing_period: 'monthly',
    },
  });
  console.log(`Created price: ${price.id}`);

  console.log('\n✅ Stripe products seeded successfully!');
  console.log(`Product ID: ${product.id}`);
  console.log(`Price ID: ${price.id}`);
  console.log('Price: $9.99/month');
}

seedProducts().catch((error) => {
  console.error('Failed to seed products:', error);
  process.exit(1);
});
