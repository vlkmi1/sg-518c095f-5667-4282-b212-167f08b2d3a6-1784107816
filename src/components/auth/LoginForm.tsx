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