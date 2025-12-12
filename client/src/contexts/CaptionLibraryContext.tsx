import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { CaptionStyle, SavedCaptionDB } from "@shared/schema";

interface SavedCaption {
  id: string;
  text: string;
  style: CaptionStyle;
  context?: string;
  imageSrc?: string;
  savedAt: string;
}

interface CaptionLibraryContextType {
  captions: SavedCaption[];
  isLoading: boolean;
  saveCaption: (text: string, style: CaptionStyle, context?: string, imageSrc?: string) => void;
  deleteCaption: (id: string) => void;
  clearAll: () => void;
  isCaptionSaved: (text: string) => boolean;
}

const CaptionLibraryContext = createContext<CaptionLibraryContextType | undefined>(undefined);

export function CaptionLibraryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: captions = [], isLoading } = useQuery<SavedCaptionDB[]>({
    queryKey: ["/api/saved-captions"],
    enabled: isAuthenticated,
  });

  const formattedCaptions: SavedCaption[] = captions.map((c) => ({
    id: c.id,
    text: c.text,
    style: c.style as CaptionStyle,
    context: c.context || undefined,
    imageSrc: c.imageSrc || undefined,
    savedAt: c.savedAt ? new Date(c.savedAt).toISOString() : new Date().toISOString(),
  }));

  const saveMutation = useMutation({
    mutationFn: async (data: { text: string; style: CaptionStyle; context?: string; imageSrc?: string }) => {
      const res = await apiRequest("POST", "/api/saved-captions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-captions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/saved-captions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-captions"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/saved-captions");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-captions"] });
    },
  });

  const saveCaption = useCallback((
    text: string,
    style: CaptionStyle,
    context?: string,
    imageSrc?: string
  ) => {
    if (formattedCaptions.some((c) => c.text === text)) {
      return;
    }
    saveMutation.mutate({ text, style, context, imageSrc });
  }, [formattedCaptions, saveMutation]);

  const deleteCaption = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const clearAll = useCallback(() => {
    clearAllMutation.mutate();
  }, [clearAllMutation]);

  const isCaptionSaved = useCallback((text: string) => {
    return formattedCaptions.some((c) => c.text === text);
  }, [formattedCaptions]);

  return (
    <CaptionLibraryContext.Provider value={{
      captions: formattedCaptions,
      isLoading,
      saveCaption,
      deleteCaption,
      clearAll,
      isCaptionSaved,
    }}>
      {children}
    </CaptionLibraryContext.Provider>
  );
}

export function useCaptionLibraryContext() {
  const context = useContext(CaptionLibraryContext);
  if (context === undefined) {
    throw new Error("useCaptionLibraryContext must be used within CaptionLibraryProvider");
  }
  return context;
}
