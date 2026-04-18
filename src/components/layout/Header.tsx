import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Fish, User, LogOut, Trophy } from "lucide-react";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Check current session
    authService.getCurrentUser().then(currentUser => {
      setUser(currentUser);
      if (currentUser) {
        profileService.getProfileById(currentUser.id).then(({ data }) => {
          setProfile(data);
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        profileService.getProfileById(session.user.id).then(({ data }) => {
          setProfile(data);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <Fish className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <span className="font-serif text-xl sm:text-2xl font-bold text-primary">Úlovky</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Link href="/competitions/create">
                <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
                  <Trophy className="h-4 w-4" />
                  <span className="hidden md:inline">Přidat závod</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{profile?.nickname || "Profil"}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Odhlásit</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="h-8 sm:h-9 px-3 sm:px-4 text-sm">
                  Přihlásit
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="h-8 sm:h-9 px-3 sm:px-4 text-sm">
                  Registrace
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}