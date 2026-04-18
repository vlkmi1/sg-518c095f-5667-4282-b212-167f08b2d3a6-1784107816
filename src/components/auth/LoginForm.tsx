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
            title: "Chyba",
            description: "Uživatel s tímto nickem nebyl nalezen",
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
        toast({
          title: "Chyba při přihlášení",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Úspěšně přihlášen",
          description: "Vítejte zpět!",
        });
        router.push("/profile");
      }
    } catch (err) {
      toast({
        title: "Chyba",
        description: "Něco se pokazilo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Přihlášení</CardTitle>
        <CardDescription>Přihlaste se pomocí nicku nebo emailu</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loginId">Nick nebo email</Label>
            <Input
              id="loginId"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="jan123 nebo jan@example.com"
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Přihlašuji..." : "Přihlásit se"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Nemáte účet?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Zaregistrujte se
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}