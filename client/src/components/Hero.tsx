import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/AI_tech_hero_background_505e3454.png";

export default function Hero() {
  const handleGetStarted = () => {
    const uploadSection = document.getElementById("upload-section");
    uploadSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
      
      <div className="relative z-10 container mx-auto px-4 md:px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-foreground" data-testid="text-hero-title">
          AI-Powered Caption
          <br />
          Generation
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed" data-testid="text-hero-subtitle">
          Upload your images and let AI create engaging, professional captions in seconds. 
          Choose your style, add context, and get multiple options instantly.
        </p>
        <Button 
          size="lg" 
          className="rounded-full px-8 gap-2"
          onClick={handleGetStarted}
          data-testid="button-hero-cta"
        >
          Generate Captions
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
