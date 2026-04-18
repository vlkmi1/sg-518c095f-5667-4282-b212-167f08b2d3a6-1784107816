import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { authService } from "@/services/authService";

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const user = await authService.getCurrentUser();
    setIsAuthenticated(!!user);
  }

  return (
    <ThemeProvider>
      <div className={isAuthenticated ? "pb-16 md:pb-0" : ""}>
        <Component {...pageProps} />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
