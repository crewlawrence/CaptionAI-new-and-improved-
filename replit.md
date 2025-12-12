# CaptionAI - AI-Powered Caption Generator

## Overview

CaptionAI is a multi-tenant SaaS web application that generates engaging social media captions for uploaded images using AI. Users sign up via social login (Google, Apple, or email magic link), get 10 free caption requests, and can upgrade to Pro ($9.99/month) for unlimited captions. The application features a modern, tech-forward design inspired by Linear, Vercel, and Stripe.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Authentication

**Portable Auth System (Passport.js)**
- Google OAuth 2.0 for social login
- Apple Sign-In (coming soon)
- Email magic link (passwordless) authentication
- No external auth provider dependency - fully portable
- Session-based authentication with PostgreSQL session store
- 7-day session TTL
- Implementation: `server/auth.ts`

**Auth Flow**
1. User opens auth modal via "Sign In" or "Get Started Free"
2. Option A: Click "Continue with Google" → Google OAuth flow
3. Option B: Enter email → Magic link sent to email → Click link to verify
4. Session created, user upserted to database
5. Logout via `/api/logout`

**Auth Endpoints**
- `GET /api/auth/google` - Initiates Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/email/request` - Request magic link email
- `GET /api/auth/email/verify` - Verify magic link token
- `GET /api/logout` - Logout user

### Subscription & Payments

**Stripe Integration**
- Managed via stripe-replit-sync for automatic webhook handling
- Products and prices synced to PostgreSQL `stripe` schema
- Customer portal for subscription management

**Pricing Model**
- Free tier: 10 caption requests lifetime
- Pro tier: $9.99/month for unlimited captions
- Usage tracked in `users.caption_usage_count`

**Stripe Files**
- `server/stripeClient.ts` - Stripe API client and sync setup
- `server/webhookHandlers.ts` - Webhook processing
- `scripts/seed-stripe-products.ts` - Product seeding script

### Frontend Architecture

**Framework & Build Tool**
- React 18+ with TypeScript
- Vite for fast development and builds
- Wouter for lightweight client-side routing

**UI Component System**
- Shadcn/ui with Radix UI primitives
- Tailwind CSS with custom design tokens
- Typography: Inter (UI), JetBrains Mono (captions)

**State Management**
- TanStack Query for server state
- React Context for shared caption library state
- React Hook Form with Zod validation

**Key Hooks**
- `useAuth()` - Authentication state and user info
- `useSubscription()` - Subscription status, usage, checkout
- `useCaptionLibraryContext()` - Saved captions management

**File Structure**
- `client/src/components/` - UI components
- `client/src/pages/` - Route pages (Home, Library, Landing)
- `client/src/hooks/` - Custom hooks (useAuth, useSubscription)
- `client/src/contexts/` - React Context providers

**Routing**
- `/` - Landing page (unauthenticated) or Home (authenticated)
- `/library` - Saved captions library

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- ES modules

**API Endpoints**
- `GET /api/auth/user` - Current user info (protected)
- `POST /api/captions` - Generate captions (protected, usage tracked)
- `GET /api/subscription` - Subscription status (protected)
- `POST /api/checkout` - Create Stripe checkout session (protected)
- `POST /api/portal` - Create Stripe customer portal session (protected)
- `GET /api/saved-captions` - List saved captions (protected)
- `POST /api/saved-captions` - Save a caption (protected)
- `DELETE /api/saved-captions/:id` - Delete a caption (protected)
- `DELETE /api/saved-captions` - Clear all captions (protected)
- `POST /api/stripe/webhook/:uuid` - Stripe webhook handler

**Image Processing**
- Multer for multipart uploads (max 5 images, 5MB each)
- Sharp for image validation and JPEG conversion
- Base64 encoding for OpenAI Vision API

### Data Storage

**PostgreSQL Database (Neon)**
- Connection via `DATABASE_URL` environment variable
- Drizzle ORM for type-safe queries

**Tables**
- `users` - User accounts with auth provider, Stripe IDs, usage count, tier
- `saved_captions` - User's saved captions (foreign key to users)
- `magic_tokens` - Email magic link tokens for passwordless auth
- `sessions` - Express sessions for auth
- `stripe.*` - Stripe data (managed by stripe-replit-sync)

**Schema Location**: `shared/schema.ts`

### External Dependencies

**AI/ML Services**
- OpenAI GPT-4o-mini for caption generation
- Vision API for image analysis
- Generates 3 caption variations per image

**Stripe**
- stripe-replit-sync for webhook processing
- Automatic data sync to PostgreSQL
- Customer portal integration

### Environment Configuration

**Required Environment Variables**
- `OPENAI_API_KEY` - OpenAI API key
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key

**Google OAuth (Required for Google login)**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Email Magic Link (Optional - console logging in dev mode)**
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_SECURE` - Use TLS (true/false)
- `EMAIL_FROM` - From address for emails

**Stripe (Portable)**
- On Replit: Automatically uses Replit Connectors if available
- External deployment: Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` environment variables

**Build & Deployment**
- Development: `npm run dev`
- Build: `npm run build`
- Production: `npm start`
- Database: `npm run db:push`
- Stripe seeding: `npx tsx scripts/seed-stripe-products.ts`

### Portability Notes

For deployment outside Replit:
1. **Google OAuth**: Create OAuth credentials in Google Cloud Console
   - Set authorized redirect URI to `https://yourdomain.com/api/auth/google/callback`
2. **Email**: Configure SMTP server (e.g., SendGrid, Postmark, Mailgun)
3. **Stripe**: Set API keys directly as environment variables
4. **Database**: Use any PostgreSQL provider (Neon, Supabase, Railway, etc.)
5. Run `npm run db:push` to initialize database schema
6. Configure Stripe webhook endpoint to `https://yourdomain.com/api/stripe/webhook/:uuid`
