import { useRouter } from "next/router";
import Link from "next/link";
import { Fish, Trophy, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === "/my-catches") {
      return router.pathname === "/my-catches";
    }
    if (path === "/competitions") {
      return router.pathname === "/competitions" || router.pathname.startsWith("/competitions/");
    }
    if (path === "/profile") {
      return router.pathname === "/profile" || router.pathname.startsWith("/profile/");
    }
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="grid grid-cols-4 h-16">
        {/* My Catches */}
        <Link
          href="/my-catches"
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            isActive("/my-catches")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Fish className="h-5 w-5" />
          <span className="text-xs font-medium">Úlovky</span>
        </Link>

        {/* Competitions */}
        <Link
          href="/competitions"
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            isActive("/competitions")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Trophy className="h-5 w-5" />
          <span className="text-xs font-medium">Závody</span>
        </Link>

        {/* Add Catch - FAB style */}
        <Link
          href="/profile/add-catch"
          className="flex flex-col items-center justify-center gap-1 text-background"
        >
          <div className="absolute -top-6 h-14 w-14 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium text-muted-foreground mt-2">Přidat</span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            isActive("/profile")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-xs font-medium">Profil</span>
        </Link>
      </div>
    </nav>
  );
}