import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/auth/login" }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      
      if (!user) {
        router.push(redirectTo);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (!session) {
        router.push(redirectTo);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, redirectTo]);

  // Show nothing while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Načítám...</p>
        </div>
      </div>
    );
  }

  // Show children only if authenticated
  return isAuthenticated ? <>{children}</> : null;
}