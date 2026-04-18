import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authService } from "@/services/authService";
import { Fish, Trophy, User, LogOut, Menu } from "lucide-react";

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await authService.signOut();
    setUser(null);
    router.push("/");
  }

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + "/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
          <Fish className="h-6 w-6" />
          Ukaž Rybu
        </Link>

        {/* Desktop Navigation */}
        {user ? (
          <>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/") && router.pathname === "/"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Fish className="h-4 w-4" />
                  Úlovky
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
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Odhlásit se
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => router.push("/")}>
                    <Fish className="mr-2 h-4 w-4" />
                    Úlovky
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/competitions")}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Závody
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile/add-catch")}>
                    Přidat úlovek
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/competitions/create")}>
                    Vytvořit závod
                  </DropdownMenuItem>
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
                <Button variant="ghost" onClick={() => router.push("/auth/login")}>
                  Přihlásit se
                </Button>
                <Button onClick={() => router.push("/auth/register")}>
                  Registrovat
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}