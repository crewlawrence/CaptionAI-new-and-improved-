import { useState } from "react";
import { Briefcase, Smile, Laugh, Minus, Sparkles, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CaptionStyle = 
  | "professional" 
  | "friendly" 
  | "funny" 
  | "minimalist" 
  | "inspirational" 
  | "casual";

interface StyleOption {
  value: CaptionStyle;
  label: string;
  icon: React.ReactNode;
}

const styleOptions: StyleOption[] = [
  { value: "professional", label: "Professional", icon: <Briefcase className="h-4 w-4" /> },
  { value: "friendly", label: "Friendly", icon: <Smile className="h-4 w-4" /> },
  { value: "funny", label: "Funny", icon: <Laugh className="h-4 w-4" /> },
  { value: "minimalist", label: "Minimalist", icon: <Minus className="h-4 w-4" /> },
  { value: "inspirational", label: "Inspirational", icon: <Sparkles className="h-4 w-4" /> },
  { value: "casual", label: "Casual", icon: <Coffee className="h-4 w-4" /> },
];

interface StyleSelectorProps {
  onStyleChange?: (style: CaptionStyle) => void;
}

export default function StyleSelector({ onStyleChange }: StyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<CaptionStyle>("professional");

  const handleStyleClick = (style: CaptionStyle) => {
    setSelectedStyle(style);
    onStyleChange?.(style);
    console.log('Style selected:', style);
  };

  return (
    <div className="w-full">
      <label className="text-sm font-medium mb-3 block" data-testid="label-style">
        Caption Style
      </label>
      <div className="flex flex-wrap gap-3">
        {styleOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedStyle === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleStyleClick(option.value)}
            className="rounded-full gap-2"
            data-testid={`button-style-${option.value}`}
          >
            {option.icon}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
