import { useRouter } from "next/router";
import Link from "next/link";
import { Fish, Trophy, User, Plus, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { adminService } from "@/services/adminService";

export function MobileNav() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const adminStatus = await adminService.isAdmin(user.id);
        setIsAdmin(adminStatus);
      }
    } catch (error) {
      console.error("Check admin error:", error);
    }
  }

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + "/");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="container max-w-full px-0">
        <div className="grid grid-cols-4 h-16">
          {/* My Catches */}
          <Link
            href="/my-catches"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive("/my-catches")
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Fish className="h-5 w-5" />
            <span className="text-xs font-medium">Úlovky</span>
          </Link>

          {/* Competitions */}
          <Link
            href="/competitions"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive("/competitions")
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="text-xs font-medium">Závody</span>
          </Link>

          {/* Add Catch FAB */}
          <Link
            href="/profile/add-catch"
            className="flex flex-col items-center justify-center relative"
          >
            <div className="absolute -top-6 bg-primary rounded-full p-3 shadow-lg hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground mt-6">Přidat</span>
          </Link>

          {/* Profile or Admin */}
          {isAdmin ? (
            <Link
              href="/admin"
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive("/admin")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Shield className="h-5 w-5" />
              <span className="text-xs font-medium">Admin</span>
            </Link>
          ) : (
            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive("/profile")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <User className="h-5 w-5" />
              <span className="text-xs font-medium">Profil</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}