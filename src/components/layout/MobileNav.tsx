import { Home, Trophy, User, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";

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

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Domů",
      isActive: isActive("/"),
    },
    {
      href: "/competitions",
      icon: Trophy,
      label: "Závody",
      isActive: isActive("/competitions"),
    },
    {
      href: "/profile/add-catch",
      icon: PlusCircle,
      label: "Přidat úlovek",
      isActive: shouldHighlightAddCatch,
      highlight: true, // Special highlight for add catch
    },
    {
      href: "/profile",
      icon: User,
      label: "Profil",
      isActive: isActive("/profile"),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50 shadow-lg">
      <nav className="flex items-center justify-around px-2 py-3 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all",
                  item.isActive && "bg-primary/10",
                  item.highlight && item.isActive && "bg-primary/15"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    item.isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    item.isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}