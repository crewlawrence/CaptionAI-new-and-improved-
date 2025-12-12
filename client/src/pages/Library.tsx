import { useCaptionLibraryContext } from "@/contexts/CaptionLibraryContext";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Check, BookOpen, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Library() {
  const { captions, deleteCaption, clearAll, isLoading } = useCaptionLibraryContext();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Caption copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    deleteCaption(id);
    toast({
      title: "Deleted",
      description: "Caption removed from library",
    });
  };

  const handleClearAll = () => {
    clearAll();
    toast({
      title: "Cleared",
      description: "All captions removed from library",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 md:px-6 py-12">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-library-title">Your Caption Library</h1>
              <p className="text-muted-foreground" data-testid="text-library-count">
                {captions.length} saved caption{captions.length !== 1 ? 's' : ''}
              </p>
            </div>
            {captions.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive"
                data-testid="button-clear-all"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {captions.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2" data-testid="text-empty-title">No saved captions yet</h2>
              <p className="text-muted-foreground mb-6" data-testid="text-empty-description">
                Generate captions and save your favorites here
              </p>
              <Button asChild data-testid="button-start-generating">
                <a href="/">Start Generating</a>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {captions.map((caption) => (
                <Card key={caption.id} className="group" data-testid={`card-caption-${caption.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm whitespace-pre-wrap break-words mb-3" data-testid={`text-caption-${caption.id}`}>
                          {caption.text}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="capitalize" data-testid={`badge-style-${caption.id}`}>
                            {caption.style}
                          </Badge>
                          <span data-testid={`text-date-${caption.id}`}>
                            {formatDistanceToNow(new Date(caption.savedAt), { addSuffix: true })}
                          </span>
                          {caption.context && (
                            <span className="truncate max-w-[200px]" title={caption.context}>
                              Context: {caption.context}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(caption.text, caption.id)}
                          data-testid={`button-copy-${caption.id}`}
                        >
                          {copiedId === caption.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(caption.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${caption.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
