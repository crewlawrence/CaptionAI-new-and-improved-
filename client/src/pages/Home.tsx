import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UploadZone from "@/components/UploadZone";
import StyleSelector, { type CaptionStyle } from "@/components/StyleSelector";
import ContextInput from "@/components/ContextInput";
import CaptionResults from "@/components/CaptionResults";
import UsageBanner from "@/components/UsageBanner";
import UpgradeModal from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { queryClient } from "@/lib/queryClient";

interface CaptionResponse {
  captions: Array<{
    imageIndex: number;
    fileName: string;
    variants: Array<{ id: string; text: string }>;
  }>;
}

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<CaptionStyle>("professional");
  const [context, setContext] = useState("");
  const [captions, setCaptions] = useState<Array<{ id: string; text: string; style: CaptionStyle; context?: string; imageSrc?: string }>>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();
  const { canGenerate, isPro, refetch } = useSubscription();

  // Handle Stripe redirect success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: "Welcome to Pro!",
        description: "Your subscription is now active. Enjoy unlimited captions!",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      window.history.replaceState({}, '', '/');
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Checkout canceled",
        description: "No worries! You can upgrade anytime.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/');
    }
  }, [location, toast, refetch]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      
      uploadedFiles.forEach((file) => {
        formData.append('images', file);
      });
      
      formData.append('style', selectedStyle);
      if (context) {
        formData.append('context', context);
      }

      const response = await fetch('/api/captions', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`Server error (${response.status})`);
        }

        if (errorData.upgradeRequired) {
          setShowUpgradeModal(true);
          throw new Error(errorData.message);
        }

        throw new Error(errorData.message || errorData.error || 'Failed to generate captions');
      }

      return response.json() as Promise<CaptionResponse>;
    },
    onSuccess: (data) => {
      const flattenedCaptions = data.captions.flatMap((imageCaption) =>
        imageCaption.variants.map((variant) => ({
          id: variant.id,
          text: variant.text,
          style: selectedStyle,
          context: context || undefined,
        }))
      );
      
      setCaptions(flattenedCaptions);
      refetch();
      
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    onError: (error) => {
      console.error('Error generating captions:', error);
      if (!error.message.includes("free caption limit")) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to generate captions. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleGenerate = () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No images",
        description: "Please upload at least one image to generate captions.",
        variant: "destructive",
      });
      return;
    }

    if (!canGenerate) {
      setShowUpgradeModal(true);
      return;
    }

    generateMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16" id="upload-section">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Usage Banner */}
          <UsageBanner onUpgradeClick={() => setShowUpgradeModal(true)} />

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4" data-testid="text-main-title">
              Upload & Customize
            </h2>
            <p className="text-muted-foreground text-lg" data-testid="text-main-subtitle">
              Upload your images, choose a style, and let AI create perfect captions
            </p>
          </div>

          <UploadZone onImagesChange={setUploadedFiles} />

          <div className="grid md:grid-cols-2 gap-6">
            <StyleSelector onStyleChange={setSelectedStyle} />
            <ContextInput onContextChange={setContext} />
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            {!canGenerate && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>You've reached your free limit. Upgrade to continue.</span>
              </div>
            )}
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={uploadedFiles.length === 0 || generateMutation.isPending || !canGenerate}
              className="rounded-full px-8 gap-2"
              data-testid="button-generate"
            >
              <Sparkles className="h-5 w-5" />
              {generateMutation.isPending ? 'Generating...' : 'Generate Captions'}
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto" id="results-section">
          <CaptionResults 
            captions={captions} 
            isLoading={generateMutation.isPending}
          />
        </div>
      </main>

      <footer className="border-t py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4" data-testid="text-footer-product">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-features">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-pricing">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-api">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4" data-testid="text-footer-company">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-about">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-blog">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-careers">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4" data-testid="text-footer-support">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-help">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-contact">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p data-testid="text-copyright">© 2024 CaptionAI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  );
}
