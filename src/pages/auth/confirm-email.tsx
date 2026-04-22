import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function ConfirmEmail() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get token from URL hash
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get("access_token");
        const type = params.get("type") as "signup" | "recovery" | "email_change" | undefined;

        if (!token) {
          setStatus("error");
          setErrorMessage("Chybí ověřovací token. Zkontrolujte, zda jste použili správný odkaz z emailu.");
          return;
        }

        // Confirm email with token
        const { error } = await authService.confirmEmail(token, type || "signup");

        if (error) {
          setStatus("error");
          setErrorMessage(error.message || "Nepodařilo se ověřit email. Zkuste to prosím znovu nebo kontaktujte podporu.");
        } else {
          setStatus("success");
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/auth/login");
          }, 3000);
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("Došlo k neočekávané chybě. Zkuste to prosím znovu.");
      }
    };

    confirmEmail();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardHeader className="text-center space-y-4">
          {status === "loading" && (
            <>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <CardTitle className="font-serif text-3xl">
                Ověřování emailu...
              </CardTitle>
              <CardDescription>
                Počkejte prosím, zpracováváme váš požadavek
              </CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-serif text-3xl text-primary">
                Email ověřen úspěšně!
              </CardTitle>
              <CardDescription>
                Váš účet byl aktivován
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="font-serif text-3xl text-destructive">
                Ověření selhalo
              </CardTitle>
              <CardDescription>
                Nepodařilo se ověřit váš email
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "success" && (
            <>
              <Alert className="bg-primary/5 border-primary/20">
                <AlertDescription>
                  <p className="font-semibold mb-2">🎉 Váš účet je nyní aktivní!</p>
                  <p className="text-sm text-muted-foreground">
                    Můžete se přihlásit a začít používat všechny funkce aplikace.
                  </p>
                </AlertDescription>
              </Alert>
              
              <div className="text-center text-sm text-muted-foreground">
                Budete automaticky přesměrováni na přihlášení za 3 sekundy...
              </div>

              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full"
                size="lg"
              >
                Přejít na přihlášení
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <Alert className="bg-destructive/5 border-destructive/20">
                <AlertDescription>
                  <p className="text-sm text-destructive mb-2">
                    {errorMessage}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/auth/register")}
                  variant="outline"
                  className="w-full"
                >
                  Zkusit registraci znovu
                </Button>
                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full"
                >
                  Přejít na přihlášení
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}