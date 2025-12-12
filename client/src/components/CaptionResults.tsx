import CaptionCard from "./CaptionCard";
import { Loader2 } from "lucide-react";
import type { CaptionStyle } from "@shared/schema";

interface Caption {
  id: string;
  text: string;
  style: CaptionStyle;
  context?: string;
  imageSrc?: string;
}

interface CaptionResultsProps {
  captions: Caption[];
  isLoading?: boolean;
}

export default function CaptionResults({ captions, isLoading }: CaptionResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="icon-loading" />
        <p className="text-muted-foreground" data-testid="text-loading">
          Generating captions with AI...
        </p>
      </div>
    );
  }

  if (captions.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-12">
      <h2 className="text-3xl font-semibold mb-8 text-center" data-testid="text-results-title">
        Your AI-Generated Captions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {captions.map((caption) => (
          <CaptionCard
            key={caption.id}
            caption={caption.text}
            style={caption.style}
            context={caption.context}
            imageSrc={caption.imageSrc}
            onRegenerate={() => console.log('Regenerate', caption.id)}
          />
        ))}
      </div>
    </div>
  );
}
