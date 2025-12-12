import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Zap, Shield, Image, Mail, Loader2 } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@assets/generated_images/AI_tech_hero_background_505e3454.png";

export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleEmailLogin = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast({
          title: "Check your email",
          description: "We sent you a magic link to sign in",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send magic link",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openAuthModal = () => {
    setShowAuthModal(true);
    setEmailSent(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold" data-testid="text-brand">CaptionAI</span>
          </div>
          <Button onClick={openAuthModal} data-testid="button-login-header">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        
        <div className="relative z-10 container mx-auto px-6 py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              AI-Powered Caption Generation
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
              Generate Perfect Captions
              <br />
              <span className="text-primary">In Seconds</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              Upload your images and let AI create engaging social media captions 
              in any style. Professional, funny, inspirational — you choose.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={openAuthModal} className="text-lg px-8" data-testid="button-get-started">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" onClick={openAuthModal} className="text-lg px-8 backdrop-blur-sm" data-testid="button-sign-in">
                Sign In
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              10 free captions - No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <h2 className="text-3xl font-bold text-center mb-16">Powerful Features</h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Generate multiple caption options in seconds, not hours.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Image className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multiple Styles</h3>
            <p className="text-muted-foreground">
              Professional, funny, casual, inspirational — match your brand voice.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Save Favorites</h3>
            <p className="text-muted-foreground">
              Build your caption library and never lose a great caption again.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-center text-muted-foreground mb-16">Start free, upgrade when you need more</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="border border-border rounded-2xl p-8">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <p className="text-4xl font-bold mb-4">$0</p>
            <ul className="space-y-3 mb-8 text-muted-foreground">
              <li>10 caption requests</li>
              <li>All caption styles</li>
              <li>Save to library</li>
              <li>Multi-image upload</li>
            </ul>
            <Button variant="outline" className="w-full" onClick={openAuthModal} data-testid="button-free-plan">
              Get Started
            </Button>
          </div>
          
          <div className="border-2 border-primary rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              Popular
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-4xl font-bold mb-4">$9.99<span className="text-lg font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-3 mb-8 text-muted-foreground">
              <li>Unlimited captions</li>
              <li>All caption styles</li>
              <li>Unlimited library</li>
              <li>Priority processing</li>
            </ul>
            <Button className="w-full" onClick={openAuthModal} data-testid="button-pro-plan">
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>2024 CaptionAI. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Welcome to CaptionAI</DialogTitle>
            <DialogDescription className="text-center">
              Sign in to start generating captions
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            {!emailSent ? (
              <>
                {/* Google Login */}
                <Button 
                  variant="outline" 
                  className="w-full h-12 gap-3"
                  onClick={handleGoogleLogin}
                  data-testid="button-google-login"
                >
                  <SiGoogle className="h-5 w-5" />
                  Continue with Google
                </Button>

                {/* Apple Login - Placeholder for future */}
                <Button 
                  variant="outline" 
                  className="w-full h-12 gap-3"
                  disabled
                  data-testid="button-apple-login"
                >
                  <SiApple className="h-5 w-5" />
                  Continue with Apple
                  <span className="text-xs text-muted-foreground">(Coming soon)</span>
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Email Magic Link */}
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                    data-testid="input-email"
                  />
                  <Button 
                    className="w-full h-12 gap-3"
                    onClick={handleEmailLogin}
                    disabled={isLoading}
                    data-testid="button-email-login"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    {isLoading ? "Sending..." : "Continue with Email"}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-2">
                  No password required. We'll send you a magic link.
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Check your email</h3>
                <p className="text-muted-foreground mb-6">
                  We sent a magic link to<br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setEmailSent(false)}
                  data-testid="button-try-different-email"
                >
                  Use a different email
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
