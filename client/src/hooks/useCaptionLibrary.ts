import { useState, useEffect, useCallback } from "react";
import { savedCaptionSchema, type SavedCaption, type CaptionStyle } from "@shared/schema";
import { z } from "zod";

const STORAGE_KEY = "captionAI.savedCaptions";
const MAX_CAPTIONS = 200;

const savedCaptionsArraySchema = z.array(savedCaptionSchema);

function loadCaptions(): SavedCaption[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    const validated = savedCaptionsArraySchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error("Error loading saved captions:", error);
    return [];
  }
}

function saveCaptions(captions: SavedCaption[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(captions));
  } catch (error) {
    console.error("Error saving captions to localStorage:", error);
  }
}

export function useCaptionLibrary() {
  const [captions, setCaptions] = useState<SavedCaption[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadCaptions();
    setCaptions(loaded);
    setIsLoaded(true);
  }, []);

  const saveCaption = useCallback((
    text: string,
    style: CaptionStyle,
    context?: string,
    imageSrc?: string
  ) => {
    setCaptions((prev) => {
      // Check if caption already exists (duplicate guard)
      if (prev.some((c) => c.text === text)) {
        return prev;
      }

      const newCaption: SavedCaption = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        text,
        style,
        context,
        imageSrc,
        savedAt: new Date().toISOString(),
      };

      const updated = [newCaption, ...prev];
      const trimmed = updated.slice(0, MAX_CAPTIONS);
      saveCaptions(trimmed);
      return trimmed;
    });

    return text;
  }, []);

  const deleteCaption = useCallback((id: string) => {
    setCaptions((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveCaptions(updated);
      return updated;
    });
  }, []);

  const isCaptionSaved = useCallback((text: string) => {
    return captions.some((c) => c.text === text);
  }, [captions]);

  const clearAll = useCallback(() => {
    setCaptions([]);
    saveCaptions([]);
  }, []);

  return {
    captions,
    isLoaded,
    saveCaption,
    deleteCaption,
    isCaptionSaved,
    clearAll,
  };
}
