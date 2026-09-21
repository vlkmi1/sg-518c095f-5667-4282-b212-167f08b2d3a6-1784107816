import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { UserPlus, AlertCircle } from "lucide-react";

export function RegisterForm() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send OTP code
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nickname, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Chyba registrace",
          description: data.error || "Nepodařilo se odeslat ověřovací kód",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Success - redirect to verification page
      toast({
        title: "✅ Kód odeslán!",
        description: "Zkontrolujte svůj email a zadejte 4místný kód",
      });

      // Show code in development
      if (data.code && process.env.NODE_ENV === "development") {
        toast({
          title: "🔑 Vývojový režim",
          description: `Váš kód: ${data.code}`,
          duration: 10000,
        });
      }

      // Redirect to verification page
      router.push(`/auth/verify-code?email=${encodeURIComponent(email)}`);

    } catch (err) {
      toast({
        title: "Chyba",
        description: "Něco se pokazilo. Zkuste to znovu.",
        variant: "destructive",
      });
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
          title: "Chyba registrace",
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
        {/* Info Alert - What happens after registration */}
        <Alert className="mb-6 bg-primary/5 border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Po kliknutí na <strong>"Pokračovat"</strong> obdržíte <strong>4místný ověřovací kód</strong> na email. 
            Zadejte ho pro dokončení registrace.
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
            {loading ? "Odesílám kód..." : "Pokračovat"}
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