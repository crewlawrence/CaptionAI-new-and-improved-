import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ContextInputProps {
  onContextChange?: (context: string) => void;
}

export default function ContextInput({ onContextChange }: ContextInputProps) {
  const [context, setContext] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContext(value);
    onContextChange?.(value);
    console.log('Context updated:', value.length, 'characters');
  };

  return (
    <div className="w-full">
      <Label htmlFor="context-input" className="mb-3" data-testid="label-context">
        Add Context (Optional)
      </Label>
      <Textarea
        id="context-input"
        placeholder="Add context to help AI understand your images better... (e.g., location, event, mood, audience)"
        value={context}
        onChange={handleChange}
        className="min-h-[120px] rounded-xl resize-none"
        data-testid="input-context"
      />
      <p className="text-xs text-muted-foreground mt-2" data-testid="text-context-hint">
        Tell the AI about your images to get more relevant captions
      </p>
    </div>
  );
}
