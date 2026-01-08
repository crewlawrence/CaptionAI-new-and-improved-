import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import multer from "multer";
import sharp from "sharp";
import { captionRequestSchema, FREE_TIER_LIMIT } from "@shared/schema";
import { generateCaptionsForMultipleImages } from "./services/captionGenerator";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Auth (Google, Apple, Email magic link)
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // User is directly attached by passport deserialize
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get Stripe publishable key for frontend
  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe key:", error);
      res.status(500).json({ message: "Failed to get Stripe configuration" });
    }
  });

  // Create checkout session for Pro subscription
  app.post('/api/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stripe = await getUncachableStripeClient();

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId: user.id },
        });
        await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      // Find Pro price from Stripe
      const prices = await stripe.prices.list({
        active: true,
        lookup_keys: ['pro_monthly'],
        limit: 1,
      });

      let priceId = prices.data[0]?.id;
      
      // If no price with lookup key, search by product metadata
      if (!priceId) {
        const products = await stripe.products.list({ active: true, limit: 10 });
        const proProduct = products.data.find(p => p.name.toLowerCase().includes('pro'));
        if (proProduct) {
          const productPrices = await stripe.prices.list({ product: proProduct.id, active: true, limit: 1 });
          priceId = productPrices.data[0]?.id;
        }
      }

      if (!priceId) {
        return res.status(400).json({ message: "Pro subscription not available. Please try again later." });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/?success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/?canceled=true`,
        metadata: { userId: user.id },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Customer portal for managing subscription
  app.post('/api/portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // Get user subscription status
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check subscription status from Stripe if user has one
      if (user.stripeSubscriptionId) {
        try {
          const stripe = await getUncachableStripeClient();
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            if (user.tier !== 'pro') {
              await storage.updateUserStripeInfo(user.id, { tier: 'pro' });
            }
            return res.json({ tier: 'pro', status: subscription.status, subscription });
          } else {
            if (user.tier !== 'free') {
              await storage.updateUserStripeInfo(user.id, { tier: 'free' });
            }
          }
        } catch (stripeError) {
          console.error("Error checking subscription:", stripeError);
        }
      } else if (user.stripeCustomerId) {
        // Fallback: Check if customer has active subscription (webhook may not have fired yet)
        try {
          const stripe = await getUncachableStripeClient();
          const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            await storage.updateUserStripeInfo(user.id, {
              stripeSubscriptionId: subscription.id,
              tier: 'pro',
            });
            return res.json({ tier: 'pro', status: subscription.status, subscription });
          }
        } catch (stripeError) {
          console.error("Error checking customer subscriptions:", stripeError);
        }
      }

      // Refetch user in case we updated
      user = await storage.getUser(userId);

      res.json({ 
        tier: user?.tier || 'free',
        usageCount: user?.captionUsageCount || 0,
        usageLimit: FREE_TIER_LIMIT,
        remainingFree: Math.max(0, FREE_TIER_LIMIT - (user?.captionUsageCount || 0)),
      });
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  // Caption generation with usage tracking
  app.post('/api/captions', isAuthenticated, (req: any, res, next) => {
    upload.array('images', 5)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large', message: 'Each image must be under 5MB' });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files', message: 'Maximum 5 images allowed' });
          }
          return res.status(400).json({ error: 'Upload error', message: err.message });
        }
        if (err.message === 'Only image files are allowed') {
          return res.status(400).json({ error: 'Invalid file type', message: 'Only image files are allowed' });
        }
        return res.status(500).json({ error: 'Upload failed', message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check usage limit for free tier
      if (user.tier !== 'pro' && user.captionUsageCount >= FREE_TIER_LIMIT) {
        return res.status(403).json({
          error: 'Usage limit reached',
          message: "You've hit your free caption limit. Upgrade to Pro to keep generating captions.",
          upgradeRequired: true,
          usageCount: user.captionUsageCount,
          usageLimit: FREE_TIER_LIMIT,
        });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      const parseResult = captionRequestSchema.safeParse({
        style: req.body.style,
        context: req.body.context,
      });

      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request data', details: parseResult.error.errors });
      }

      const { style, context } = parseResult.data;

      const processedImages = await Promise.all(
        files.map(async (file) => {
          try {
            const metadata = await sharp(file.buffer).metadata();
            if (!metadata.width || !metadata.height || metadata.width < 10 || metadata.height < 10) {
              throw new Error('Image too small - minimum 10x10 pixels required');
            }
            const processedBuffer = await sharp(file.buffer).jpeg({ quality: 90 }).toBuffer();
            const base64 = processedBuffer.toString('base64');
            return { base64: `data:image/jpeg;base64,${base64}`, fileName: file.originalname };
          } catch (error) {
            console.error(`Error processing image ${file.originalname}:`, error);
            throw new Error(`Invalid or corrupted image: ${file.originalname}`);
          }
        })
      );

      const results = await generateCaptionsForMultipleImages(processedImages, style, context);

      // Increment usage count for free tier users
      if (user.tier !== 'pro') {
        await storage.incrementCaptionUsage(userId);
      }

      const response = {
        captions: results.map((result, index) => ({
          imageIndex: index,
          fileName: result.fileName,
          variants: result.captions.map((text, variantIndex) => ({
            id: `${index}-${variantIndex}`,
            text,
          })),
        })),
      };

      res.json(response);
    } catch (error) {
      console.error('Error generating captions:', error);
      res.status(502).json({ 
        error: 'Failed to generate captions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Saved captions API
  app.get('/api/saved-captions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const captions = await storage.getSavedCaptions(userId);
      res.json(captions);
    } catch (error) {
      console.error("Error fetching saved captions:", error);
      res.status(500).json({ message: "Failed to fetch saved captions" });
    }
  });

  app.post('/api/saved-captions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { text, style, context, imageSrc } = req.body;
      
      const caption = await storage.saveCaption({
        userId,
        text,
        style,
        context,
        imageSrc,
      });
      
      res.json(caption);
    } catch (error) {
      console.error("Error saving caption:", error);
      res.status(500).json({ message: "Failed to save caption" });
    }
  });

  app.delete('/api/saved-captions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await storage.deleteCaption(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting caption:", error);
      res.status(500).json({ message: "Failed to delete caption" });
    }
  });

  app.delete('/api/saved-captions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.clearAllCaptions(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing captions:", error);
      res.status(500).json({ message: "Failed to clear captions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
