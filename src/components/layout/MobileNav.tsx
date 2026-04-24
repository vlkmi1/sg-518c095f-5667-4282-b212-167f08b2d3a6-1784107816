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

  const isOnCompetitionDetail = router.pathname === "/competitions/[id]";
  const shouldHighlightAddCatch = isActive("/profile/add-catch") || isOnCompetitionDetail;

  // Handle + button click - scroll to add catch form if on competition detail
  function handleAddCatchClick(e: React.MouseEvent) {
    if (isOnCompetitionDetail) {
      e.preventDefault();
      const addCatchSection = document.getElementById("add-catch-section");
      if (addCatchSection) {
        addCatchSection.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add highlight animation
        addCatchSection.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          addCatchSection.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 2000);
      }
    }
  }

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
      label: "Přidat",
      isActive: shouldHighlightAddCatch,
      highlight: true,
      onClick: handleAddCatchClick,
    },
    {
      href: "/profile",
      icon: User,
      label: "Profil",
      isActive: isActive("/profile"),
    },
  ];

  return (
    <div 
      data-mobile-nav
      data-pwa-nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
      }}
      className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.1)] pb-safe"
    >
      <nav className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          if (item.onClick && isOnCompetitionDetail) {
            return (
              <button
                key={item.href}
                onClick={item.onClick}
                className="flex-1"
              >
                <div
                  className={cn(
                    "flex items-center justify-center py-3 rounded-xl transition-all",
                    item.isActive && "bg-primary/15",
                    item.highlight && item.isActive && "bg-primary/20"
                  )}
                >
                  <Icon
                    className={cn(
                      "transition-colors",
                      item.isActive ? "h-7 w-7 text-primary" : "h-6 w-6 text-muted-foreground"
                    )}
                  />
                </div>
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  "flex items-center justify-center py-3 rounded-xl transition-all",
                  item.isActive && "bg-primary/15",
                  item.highlight && item.isActive && "bg-primary/20"
                )}
              >
                <Icon
                  className={cn(
                    "transition-colors",
                    item.isActive ? "h-7 w-7 text-primary" : "h-6 w-6 text-muted-foreground"
                  )}
                />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}