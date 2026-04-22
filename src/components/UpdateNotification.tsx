import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Download, Loader2 } from "lucide-react";
import { useRouter } from "next/router";

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Check for service worker updates
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Check for updates immediately on mount
      reg.update();

      // Check for updates every 60 seconds
      const interval = setInterval(() => {
        reg.update();
      }, 60000);

      // Listen for updates
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker available
              console.log("New version available!");
              setShowUpdate(true);
            }
          });
        }
      });

      return () => clearInterval(interval);
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("Controller changed, reloading page...");
      // Small delay to ensure new SW is fully active
      setTimeout(() => {
        window.location.reload();
      }, 100);
    });
  }, []);

  // Check for updates when route changes (e.g., after login)
  useEffect(() => {
    const handleRouteChange = () => {
      if (registration) {
        console.log("Route changed, checking for updates...");
        registration.update();
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [registration, router.events]);

  async function handleUpdate() {
    if (!registration || !registration.waiting) {
      window.location.reload();
      return;
    }

    setIsUpdating(true);

    // Tell the service worker to skip waiting
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    
    // The page will reload automatically when controller changes
    // If it doesn't reload within 2 seconds, force reload
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  function handleLater() {
    setShowUpdate(false);
    // Show again in 10 minutes
    setTimeout(() => {
      if (registration && registration.waiting) {
        setShowUpdate(true);
      }
    }, 10 * 60 * 1000);
  }

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-primary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {isUpdating ? (
              <Loader2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0 animate-spin" />
            ) : (
              <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 space-y-2">
              {isUpdating ? (
                <>
                  <p className="text-sm font-medium">
                    Aktualizuji aplikaci...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prosím počkejte, stránka se automaticky obnoví
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Nová verze je k dispozici! 🎉
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Aktualizujte aplikaci pro nejnovější funkce a opravy
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      className="gap-2"
                      disabled={isUpdating}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Aktualizovat nyní
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLater}
                      disabled={isUpdating}
                    >
                      Později
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}