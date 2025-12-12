import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface UsageBannerProps {
  onUpgradeClick: () => void;
}

export default function UsageBanner({ onUpgradeClick }: UsageBannerProps) {
  const { isPro, usageCount, usageLimit, remainingFree, openPortal, isOpeningPortal } = useSubscription();

  if (isPro) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Pro Member</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => openPortal()}
          disabled={isOpeningPortal}
          data-testid="button-manage-subscription"
        >
          Manage Subscription
        </Button>
      </div>
    );
  }

  const usagePercentage = (usageCount / usageLimit) * 100;
  const isNearLimit = remainingFree <= 3;
  const isAtLimit = remainingFree === 0;

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 py-3 rounded-lg border ${
      isAtLimit ? 'bg-destructive/10 border-destructive/20' : 
      isNearLimit ? 'bg-yellow-500/10 border-yellow-500/20' : 
      'bg-muted/50 border-border'
    }`} data-testid="banner-usage">
      <div className="flex-1 space-y-2 w-full sm:w-auto">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isAtLimit ? (
              <span className="text-destructive">Free limit reached</span>
            ) : (
              <>Caption usage: {usageCount}/{usageLimit}</>
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {remainingFree} remaining
          </span>
        </div>
        <Progress value={usagePercentage} className="h-2" />
      </div>
      
      {(isNearLimit || isAtLimit) && (
        <Button 
          size="sm" 
          onClick={onUpgradeClick}
          variant={isAtLimit ? "default" : "outline"}
          data-testid="button-upgrade-banner"
        >
          <Sparkles className="h-4 w-4 mr-1" />
          Upgrade to Pro
        </Button>
      )}
    </div>
  );
}
