import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FREE_TIER_LIMIT } from "@shared/schema";

interface SubscriptionStatus {
  tier: "free" | "pro";
  usageCount: number;
  usageLimit: number;
  remainingFree: number;
  status?: string;
  subscription?: any;
}

export function useSubscription() {
  const { data, isLoading, error, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription"],
    retry: false,
    staleTime: 30 * 1000,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkout");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/portal");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const isPro = data?.tier === "pro";
  const canGenerate = isPro || (data?.usageCount ?? 0) < FREE_TIER_LIMIT;
  const usageCount = data?.usageCount ?? 0;
  const remainingFree = data?.remainingFree ?? FREE_TIER_LIMIT;

  return {
    subscription: data,
    isLoading,
    error,
    refetch,
    isPro,
    canGenerate,
    usageCount,
    remainingFree,
    usageLimit: FREE_TIER_LIMIT,
    checkout: checkoutMutation.mutate,
    isCheckingOut: checkoutMutation.isPending,
    openPortal: portalMutation.mutate,
    isOpeningPortal: portalMutation.isPending,
  };
}
