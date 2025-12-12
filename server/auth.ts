import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { storage } from "./storage";

const MAGIC_LINK_EXPIRY_MINUTES = 15;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function getEmailTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Fallback to console logging in development
  return {
    sendMail: async (options: any) => {
      console.log("========== MAGIC LINK EMAIL ==========");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Link: ${options.text?.match(/https?:\/\/[^\s]+/)?.[0] || "See HTML"}`);
      console.log("=======================================");
      return { messageId: "dev-" + Date.now() };
    },
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const existingUser = email ? await storage.getUserByEmail(email) : null;

            if (existingUser) {
              // Update existing user with Google info and return updated user
              const updatedUser = await storage.upsertUser({
                id: existingUser.id,
                email,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                profileImageUrl: profile.photos?.[0]?.value,
                authProvider: "google",
                providerUserId: profile.id,
                emailVerified: true,
              });
              return done(null, updatedUser);
            }

            // Create new user
            const newUser = await storage.upsertUser({
              email,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value,
              authProvider: "google",
              providerUserId: profile.id,
              emailVerified: true,
            });
            done(null, newUser);
          } catch (error) {
            done(error as Error, undefined);
          }
        }
      )
    );

    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", {
        successRedirect: "/",
        failureRedirect: "/?error=auth_failed",
      })
    );
  }

  // Email Magic Link Routes
  app.post("/api/auth/email/request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email required" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Rate limiting: check recent tokens for this email
      const recentTokens = await storage.getRecentMagicTokens(normalizedEmail, 5);
      if (recentTokens.length >= 3) {
        return res.status(429).json({ 
          error: "Too many requests. Please wait a few minutes." 
        });
      }

      // Generate token
      const token = generateToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

      await storage.createMagicToken({
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      });

      // Build magic link
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const magicLink = `${baseUrl}/api/auth/email/verify?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

      // Send email
      const transporter = await getEmailTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "CaptionAI <noreply@captionai.app>",
        to: normalizedEmail,
        subject: "Sign in to CaptionAI",
        text: `Click this link to sign in to CaptionAI:\n\n${magicLink}\n\nThis link expires in ${MAGIC_LINK_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Sign in to CaptionAI</h2>
            <p>Click the button below to sign in:</p>
            <a href="${magicLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Sign In</a>
            <p style="color: #666; font-size: 14px;">This link expires in ${MAGIC_LINK_EXPIRY_MINUTES} minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });

      res.json({ success: true, message: "Check your email for a sign-in link" });
    } catch (error) {
      console.error("Error sending magic link:", error);
      res.status(500).json({ error: "Failed to send magic link" });
    }
  });

  app.get("/api/auth/email/verify", async (req, res) => {
    try {
      const { token, email } = req.query;

      if (!token || !email || typeof token !== "string" || typeof email !== "string") {
        return res.redirect("/?error=invalid_token");
      }

      const normalizedEmail = email.toLowerCase().trim();
      const tokenHash = hashToken(token);

      // Verify token
      const magicToken = await storage.verifyMagicToken(normalizedEmail, tokenHash);
      
      if (!magicToken) {
        return res.redirect("/?error=invalid_or_expired_token");
      }

      // Consume token
      await storage.consumeMagicToken(magicToken.id);

      // Find or create user
      let existingUser = await storage.getUserByEmail(normalizedEmail);
      let user;
      
      if (!existingUser) {
        user = await storage.upsertUser({
          email: normalizedEmail,
          authProvider: "email",
          emailVerified: true,
        });
      } else {
        // Update email verified status and get updated user
        user = await storage.upsertUser({
          id: existingUser.id,
          email: normalizedEmail,
          authProvider: existingUser.authProvider || "email",
          emailVerified: true,
        });
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/?error=login_failed");
        }
        res.redirect("/");
      });
    } catch (error) {
      console.error("Error verifying magic link:", error);
      res.redirect("/?error=verification_failed");
    }
  });

  // Logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
