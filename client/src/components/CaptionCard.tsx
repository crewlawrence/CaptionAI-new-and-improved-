import { useState } from "react";
import { Copy, Check, RefreshCw, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCaptionLibraryContext } from "@/contexts/CaptionLibraryContext";
import { useToast } from "@/hooks/use-toast";
import type { CaptionStyle } from "@shared/schema";

interface CaptionCardProps {
  caption: string;
  style?: CaptionStyle;
  context?: string;
  imageSrc?: string;
  onRegenerate?: () => void;
}

export default function CaptionCard({ caption, style, context, imageSrc, onRegenerate }: CaptionCardProps) {
  const [copied, setCopied] = useState(false);
  const { saveCaption, isCaptionSaved } = useCaptionLibraryContext();
  const { toast } = useToast();
  const isSaved = isCaptionSaved(caption);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (isSaved) return;
    
    saveCaption(caption, style || "casual", context, imageSrc);
    toast({
      title: "Saved to library",
      description: "Caption saved successfully",
    });
  };

  const handleRegenerate = () => {
    onRegenerate?.();
  };

  return (
    <Card className="overflow-hidden hover-elevate transition-all" data-testid="card-caption">
      {imageSrc && (
        <div className="aspect-video w-full bg-muted overflow-hidden">
          <img
            src={imageSrc}
            alt="Caption preview"
            className="w-full h-full object-cover"
            data-testid="image-caption-preview"
          />
        </div>
      )}
      <CardContent className="p-6">
        <p className="font-mono text-sm md:text-base leading-relaxed mb-4" data-testid="text-caption">
          {caption}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1 gap-2"
            data-testid="button-copy"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant={isSaved ? "secondary" : "outline"}
            size="sm"
            onClick={handleSave}
            disabled={isSaved}
            className="gap-2"
            data-testid="button-save"
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          {onRegenerate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRegenerate}
              data-testid="button-regenerate"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
