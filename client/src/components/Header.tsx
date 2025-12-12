import { Sparkles, BookOpen, LogOut, User, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isPro } = useSubscription();
  
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.substring(0, 2).toUpperCase();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 hover-elevate rounded-md px-2 -ml-2 py-1 transition-colors" data-testid="link-home">
          <Sparkles className="h-6 w-6 text-primary" data-testid="icon-logo" />
          <span className="text-xl font-bold tracking-tight" data-testid="text-brand">
            CaptionAI
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button 
            variant={location === "/library" ? "secondary" : "ghost"} 
            size="sm" 
            asChild
            data-testid="button-library"
          >
            <Link href="/library" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Library
            </Link>
          </Button>
          {location !== "/" && (
            <Button variant="default" size="sm" asChild data-testid="button-generate">
              <Link href="/">Generate Captions</Link>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full" data-testid="button-user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                {isPro && (
                  <span className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                    <Crown className="h-3 w-3 text-primary-foreground" />
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {isPro && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs text-primary font-medium">
                    <Crown className="h-3 w-3" />
                    Pro Member
                  </span>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer" data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
