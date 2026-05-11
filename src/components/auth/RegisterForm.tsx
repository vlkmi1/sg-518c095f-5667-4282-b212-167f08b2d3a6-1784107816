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
import { UserPlus, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export function RegisterForm() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if nickname is available
      const nicknameAvailable = await profileService.isNicknameAvailable(nickname);
      if (!nicknameAvailable) {
        toast({
          title: "Chyba",
          description: "Tento nick je již obsazený",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Sign up
      const { user, error: signUpError } = await authService.signUp(email, password);

      if (signUpError) {
        // Handle specific error cases with Czech messages
        let errorMessage = "Registrace se nezdařila";
        let errorDescription = signUpError.message;

        if (signUpError.message.includes("rate limit")) {
          errorMessage = "Příliš mnoho pokusů";
          errorDescription = "Počkejte prosím několik minut a zkuste to znovu. Supabase omezuje počet registrací za určitý čas.";
        } else if (signUpError.message.includes("already registered") || signUpError.message.includes("already exists")) {
          errorMessage = "Email již existuje";
          errorDescription = "Tento email je již registrován. Zkuste se přihlásit nebo použijte jiný email.";
        } else if (signUpError.message.includes("invalid email")) {
          errorMessage = "Neplatný email";
          errorDescription = "Zadejte prosím platnou emailovou adresu.";
        } else if (signUpError.message.includes("password")) {
          errorMessage = "Problém s heslem";
          errorDescription = "Heslo musí mít alespoň 6 znaků.";
        }

        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!user) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se vytvořit účet",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create profile with nickname
      const { error: profileError } = await profileService.createProfile({
        id: user.id,
        email: user.email,
        nickname: nickname,
      });

      if (profileError) {
        toast({
          title: "Chyba při vytváření profilu",
          description: profileError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Automatically sign in the user
      const { error: signInError } = await authService.signIn(email, password);
      
      if (signInError) {
        // If sign in fails, show success message but ask to login manually
        setRegistrationSuccess(true);
        setLoading(false);
        return;
      }

      // Success - user is now signed in
      toast({
        title: "✅ Registrace úspěšná!",
        description: `Vítejte, ${nickname}! Zkontrolujte prosím email a ověřte svůj účet.`,
        duration: 6000,
      });

      // Show email verification reminder
      toast({
        title: "📧 Ověřte svůj email",
        description: "Pro přidávání úlovků a vytváření závodů musíte nejprve ověřit email kliknutím na odkaz ve zprávě.",
        duration: 8000,
      });

      // Redirect to profile
      router.push("/profile");
    } catch (err) {
      toast({
        title: "Chyba",
        description: "Něco se pokazilo",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="font-serif text-3xl text-primary">
            Registrace proběhla úspěšně!
          </CardTitle>
          <CardDescription className="text-base">
            Zbývá už jen jeden krok
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-primary/5 border-primary/20">
            <Mail className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base ml-2">
              <p className="font-semibold mb-2">Zkontrolujte svou e-mailovou schránku</p>
              <p className="text-muted-foreground">
                Poslali jsme vám ověřovací e-mail na adresu <strong className="text-foreground">{email}</strong>
              </p>
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Co dělat dál?
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground ml-7">
              <li className="flex gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>Otevřete svou e-mailovou schránku</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>Najděte e-mail s předmětem "Potvrďte svou registraci"</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>Klikněte na ověřovací odkaz v e-mailu</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-primary">4.</span>
                <span>Po ověření se můžete přihlásit</span>
              </li>
            </ol>
          </div>

          <Alert className="bg-accent/5 border-accent/20">
            <AlertDescription className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Pokud e-mail nevidíte, zkontrolujte složku spam nebo nevyžádaná pošta.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => router.push("/auth/login")}
            className="w-full"
            size="lg"
          >
            Rozumím, přejít na přihlášení
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-accent/20 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-2">
          <UserPlus className="h-6 w-6 text-accent" />
        </div>
        <CardTitle className="font-serif text-3xl">Registrace</CardTitle>
        <CardDescription>Vytvořte si účet pro sdílení úlovků</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nick</Label>
            <Input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="jan123"
              required
              disabled={loading}
              pattern="[a-zA-Z0-9_-]+"
              title="Pouze písmena, čísla, podtržítka a pomlčky"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@example.com"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">Minimálně 6 znaků</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? "Registruji..." : "Zaregistrovat se"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Již máte účet?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Přihlaste se
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}