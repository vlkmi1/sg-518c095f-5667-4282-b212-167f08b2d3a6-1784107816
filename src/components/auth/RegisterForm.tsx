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
        toast({
          title: "Chyba při registraci",
          description: signUpError.message,
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

      toast({
        title: "Registrace úspěšná",
        description: "Zkontrolujte svůj email a potvrďte registraci",
      });

      router.push("/auth/login");
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
        <CardTitle className="font-serif text-2xl">Registrace</CardTitle>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registruji..." : "Zaregistrovat se"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Již máte účet?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Přihlaste se
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}