import { Home, Trophy, User, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const router = useRouter();
  
  const isActive = (path: string) => {
    if (path === "/") {
      return router.pathname === "/";
    }
    return router.pathname.startsWith(path);
  };

  // Highlight "Přidat úlovek" if on competition detail page (user can add catch to competition)
  const isOnCompetitionDetail = router.pathname === "/competitions/[id]";
  const shouldHighlightAddCatch = isActive("/profile/add-catch") || isOnCompetitionDetail;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50">
      <nav className="flex items-center justify-around p-2">
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className={isActive("/") ? "text-primary" : "text-muted-foreground"}
          >
            <Home className="h-5 w-5" />
          </Button>
        </Link>

        <Link href="/competitions">
          <Button
            variant="ghost"
            size="icon"
            className={isActive("/competitions") ? "text-primary" : "text-muted-foreground"}
          >
            <Trophy className="h-5 w-5" />
          </Button>
        </Link>

        <Link href="/profile/add-catch">
          <Button
            variant="ghost"
            size="icon"
            className={shouldHighlightAddCatch ? "text-primary" : "text-muted-foreground"}
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </Link>

        <Link href="/profile">
          <Button
            variant="ghost"
            size="icon"
            className={isActive("/profile") ? "text-primary" : "text-muted-foreground"}
          >
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </nav>
    </div>
  );
}