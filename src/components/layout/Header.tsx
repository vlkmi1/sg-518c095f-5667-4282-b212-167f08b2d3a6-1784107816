import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { LogIn, User, LogOut, Fish } from "lucide-react";

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await authService.signOut();
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-3 group"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Fish className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              Ukaž Rybu
            </h1>
            <p className="text-xs text-muted-foreground -mt-1">
              Sdílej své úlovky
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/profile")}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profil</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Odhlásit</span>
              </Button>
            </>
          ) : (
            <Button 
              size="sm"
              onClick={() => router.push("/auth/login")}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              Přihlásit
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}