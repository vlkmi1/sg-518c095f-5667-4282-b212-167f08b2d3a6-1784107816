import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { LogIn, Mail, AlertCircle } from "lucide-react";

export function LoginForm() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if loginId is email or nickname
      const isEmail = loginId.includes("@");
      let email = loginId;

      if (!isEmail) {
        // Find user by nickname
        const { data: profile } = await profileService.getProfileByNickname(loginId);
        if (!profile) {
          toast({
            title: "Chyba přihlášení",
            description: "Uživatel s tímto nickem nebyl nalezen.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        email = profile.email || "";
      }

      // Sign in with email
      const { error } = await authService.signIn(email, password);

      if (error) {
        let errorTitle = "Chyba přihlášení";
        let errorMessage = "Nesprávný email/nick nebo heslo.";
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Nesprávný email/nick nebo heslo. Zkontrolujte prosím své přihlašovací údaje.";
        } else if (error.message.includes("Email not confirmed")) {
          errorTitle = "Email není ověřený";
          errorMessage = "Váš účet ještě nebyl aktivován. Zkontrolujte svou emailovou schránku a klikněte na ověřovací odkaz.";
        } else if (error.message.includes("email") && error.message.toLowerCase().includes("confirm")) {
          errorTitle = "Email není ověřený";
          errorMessage = "Před přihlášením musíte ověřit svůj email. Zkontrolujte svou emailovou schránku a klikněte na ověřovací odkaz.";
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Úspěšně přihlášeni",
          description: "Vítejte zpět!",
        });
        router.push("/profile");
      }
    } catch (err) {
      toast({
        title: "Chyba",
        description: "Něco se pokazilo. Zkuste to prosím znovu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "facebook") => {
    setLoading(true);
    try {
      const { error } = provider === "google" 
        ? await authService.signInWithGoogle()
        : await authService.signInWithFacebook();

      if (error) {
        toast({
          title: "Chyba přihlášení",
          description: error.message,
          variant: "destructive",
        });
      }
      // OAuth redirect happens automatically
    } catch (err) {
      toast({
        title: "Chyba",
        description: "Něco se pokazilo. Zkuste to prosím znovu.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setLoading(true);
    try {
      const { error } = await authService.resetPassword(resetEmail);
      if (error) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se odeslat odkaz pro obnovu hesla.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Email odeslán",
          description: "Zkontrolujte svou emailovou schránku a postupujte podle instrukcí.",
        });
        setShowResetPassword(false);
        setResetEmail("");
      }
    } catch (err) {
      toast({
        title: "Chyba",
        description: "Něco se pokazilo. Zkuste to prosím znovu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        {!showResetPassword ? (
          <>
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-serif text-3xl">Přihlášení</CardTitle>
            <CardDescription>Přihlaste se ke svému účtu</CardDescription>
          </>
        ) : (
          <>
            <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="font-serif text-3xl">Obnova hesla</CardTitle>
            <CardDescription>Zašleme vám odkaz pro obnovení</CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {!showResetPassword ? (
          <>
            <Alert className="mb-4 bg-primary/5 border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Po registraci je nutné nejprve <strong>ověřit email</strong> kliknutím na odkaz v e-mailu. Teprve poté se můžete přihlásit.
              </AlertDescription>
            </Alert>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthSignIn("google")}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Pokračovat s Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthSignIn("facebook")}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Pokračovat s Facebook
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Nebo přes email
                </span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginId">Email nebo Nick</Label>
                <Input
                  id="loginId"
                  type="text"
                  placeholder="vas@email.cz nebo nick"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm text-primary"
                onClick={() => setShowResetPassword(true)}
              >
                Zapomenuté heslo?
              </Button>
              <Button type="submit" className="w-full" disabled={loading} size="lg">
                {loading ? "Přihlašování..." : "Přihlásit se"}
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Nemáte účet?{" "}
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Zaregistrujte se
                </Link>
              </p>
            </form>
          </>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Váš Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="vas@email.cz"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Zašleme vám odkaz pro obnovu hesla.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowResetPassword(false)}
                disabled={loading}
              >
                Zpět
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Odesílání..." : "Odeslat odkaz"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}