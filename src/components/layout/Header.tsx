import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "@/components/layout/MobileNav";
import { Logo } from "@/components/layout/Logo";
import { authService } from "@/services/authService";
import { adminService } from "@/services/adminService";
import { Fish, Trophy, User, LogOut, Shield } from "lucide-react";

// Dynamic import to avoid hydration issues with PWA API
const InstallButton = dynamic(
  () => import("@/components/layout/InstallButton").then((mod) => ({ default: mod.InstallButton })),
  { ssr: false }
);

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const adminStatus = await adminService.isAdmin(currentUser.id);
        setIsAdmin(adminStatus);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await authService.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push("/");
  }

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + "/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo + Install Button */}
          <div className="flex items-center gap-3">
            <Logo />
            <InstallButton />
          </div>

          {/* Desktop Navigation */}
          <div suppressHydrationWarning>
            {user ? (
              <>
                <nav className="hidden md:flex items-center gap-6">
                  <Link
                    href="/my-catches"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive("/my-catches")
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Fish className="h-4 w-4" />
                      Moje úlovky
                    </div>
                  </Link>
                  <Link
                    href="/competitions"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive("/competitions")
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Závody
                    </div>
                  </Link>
                  <Link
                    href="/profile"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive("/profile")
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profil
                    </div>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        isActive("/admin")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </div>
                    </Link>
                  )}
                </nav>

                {/* Desktop User Menu */}
                <div className="hidden md:flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">Můj účet</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/profile/add-catch")}>
                        <Fish className="mr-2 h-4 w-4" />
                        Přidat úlovek
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/competitions/create")}>
                        <Trophy className="mr-2 h-4 w-4" />
                        Vytvořit závod
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push("/admin")}>
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Panel
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Odhlásit se
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {!isLoading && (
                  <>
                    <Button variant="ghost" onClick={() => router.push("/auth/login")} size="sm">
                      Přihlásit se
                    </Button>
                    <Button onClick={() => router.push("/auth/register")} size="sm">
                      Registrovat
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div suppressHydrationWarning>
        {user && <MobileNav />}
      </div>
    </>
  );
}