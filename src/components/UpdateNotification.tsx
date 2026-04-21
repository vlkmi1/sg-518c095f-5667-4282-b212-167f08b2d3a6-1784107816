import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Check for service worker updates
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Check for updates every 60 seconds
      setInterval(() => {
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
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("Controller changed, reloading page...");
      window.location.reload();
    });
  }, []);

  function handleUpdate() {
    if (!registration || !registration.waiting) {
      window.location.reload();
      return;
    }

    // Tell the service worker to skip waiting
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    
    // The page will reload automatically when controller changes
  }

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-primary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">
                Nová verze je k dispozici
              </p>
              <p className="text-xs text-muted-foreground">
                Aktualizujte aplikaci pro nejnovější funkce a opravy
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  className="gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Aktualizovat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUpdate(false)}
                >
                  Později
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}