import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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
        let errorMessage = "Neplatný email nebo heslo.";
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Nesprávný email/nick nebo heslo.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Potvrďte prosím svůj email.";
        }
        
        toast({
          title: "Chyba přihlášení",
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-3xl text-center">Přihlášení</CardTitle>
        <CardDescription className="text-center">
          {!showResetPassword ? "Přihlaste se ke svému účtu" : "Obnova zapomenutého hesla"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showResetPassword ? (
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Přihlašování..." : "Přihlásit se"}
            </Button>
            <div className="text-center text-sm mt-4">
              <span className="text-muted-foreground">Nemáte účet? </span>
              <Link href="/auth/register" className="text-primary hover:underline">
                Zaregistrujte se
              </Link>
            </div>
          </form>
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