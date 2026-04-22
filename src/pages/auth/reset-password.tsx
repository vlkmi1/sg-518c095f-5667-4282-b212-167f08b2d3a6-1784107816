import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery token
    const checkToken = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const type = params.get("type");

        if (!accessToken || type !== "recovery") {
          setIsValidToken(false);
          setErrorMessage("Neplatný nebo vypršelý odkaz. Požádejte o nový odkaz pro obnovení hesla.");
        } else {
          setIsValidToken(true);
        }
      } catch (error) {
        setIsValidToken(false);
        setErrorMessage("Došlo k chybě při ověřování odkazu.");
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return "Heslo musí mít alespoň 6 znaků";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidToken) {
      return;
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      setStatus("error");
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setErrorMessage("Hesla se neshodují");
      setStatus("error");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setStatus("idle");

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);

    } catch (error: any) {
      console.error("Reset password error:", error);
      setStatus("error");
      setErrorMessage(error.message || "Nepodařilo se obnovit heslo. Zkuste to prosím znovu.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <>
        <SEO 
          title="Ověřování odkazu - Ukaž Rybu"
          description="Ověřování odkazu pro obnovení hesla"
        />
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <Card className="w-full max-w-md border-primary/20 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground">Ověřuji odkaz...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!isValidToken) {
    return (
      <>
        <SEO 
          title="Neplatný odkaz - Ukaž Rybu"
          description="Odkaz pro obnovení hesla není platný"
        />
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <Card className="w-full max-w-md border-destructive/20 shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="font-serif text-3xl text-destructive">
                Neplatný odkaz
              </CardTitle>
              <CardDescription>
                Odkaz pro obnovení hesla není platný nebo vypršel
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="bg-destructive/5 border-destructive/20">
                <AlertDescription>
                  <p className="text-sm text-destructive">
                    {errorMessage}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/auth/login")}
                  variant="outline"
                  className="w-full"
                >
                  Zpět na přihlášení
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Nastavení nového hesla - Ukaž Rybu"
        description="Nastavte si nové heslo pro svůj účet"
      />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <Card className="w-full max-w-md border-primary/20 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="font-serif text-3xl">
              Nové heslo
            </CardTitle>
            <CardDescription>
              Zadejte nové heslo pro svůj účet
            </CardDescription>
          </CardHeader>

          <CardContent>
            {status === "success" ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <Alert className="bg-primary/5 border-primary/20">
                  <AlertDescription>
                    <p className="font-semibold mb-2 text-center">✅ Heslo úspěšně změněno!</p>
                    <p className="text-sm text-muted-foreground text-center">
                      Nyní se můžete přihlásit s novým heslem.
                    </p>
                  </AlertDescription>
                </Alert>
                
                <div className="text-center text-sm text-muted-foreground">
                  Budete automaticky přesměrováni za 3 sekundy...
                </div>

                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full"
                  size="lg"
                >
                  Přejít na přihlášení
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === "error" && (
                  <Alert className="bg-destructive/5 border-destructive/20">
                    <AlertDescription>
                      <p className="text-sm text-destructive">
                        {errorMessage}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Nové heslo</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimálně 6 znaků"
                      required
                      minLength={6}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Potvrzení hesla</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Zadejte heslo znovu"
                      required
                      minLength={6}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || !password || !confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Nastavuji heslo...
                    </>
                  ) : (
                    "Nastavit nové heslo"
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => router.push("/auth/login")}
                    disabled={isLoading}
                  >
                    Zpět na přihlášení
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}