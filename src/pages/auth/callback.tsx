import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "@/services/profileService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "needs_nickname" | "error">("loading");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  async function handleOAuthCallback() {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setStatus("error");
        return;
      }

      const user = session.user;
      setUserId(user.id);
      setUserEmail(user.email || null);

      // Check if profile exists
      const { data: existingProfile } = await profileService.getProfileById(user.id);

      if (existingProfile && existingProfile.nickname) {
        // Profile exists with nickname - redirect to profile
        setStatus("success");
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      } else {
        // Profile doesn't exist or missing nickname - need to set one
        setStatus("needs_nickname");
      }
    } catch (error) {
      console.error("OAuth callback error:", error);
      setStatus("error");
    }
  }

  async function handleNicknameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !nickname) return;

    setSubmitting(true);

    try {
      // Check if nickname is available
      const nicknameAvailable = await profileService.isNicknameAvailable(nickname);
      if (!nicknameAvailable) {
        toast({
          title: "Nick obsazený",
          description: "Tento nick již používá jiný uživatel. Zkuste jiný.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Create or update profile with nickname
      const { error } = await profileService.createProfile({
        id: userId,
        email: userEmail,
        nickname: nickname,
      });

      if (error) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se nastavit nick. Zkuste to znovu.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Success
      toast({
        title: "✅ Registrace dokončena",
        description: `Vítejte, ${nickname}!`,
      });

      setStatus("success");
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (error) {
      console.error("Nickname submit error:", error);
      toast({
        title: "Chyba",
        description: "Něco se pokazilo. Zkuste to znovu.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <CardTitle>Přihlašování...</CardTitle>
            <CardDescription>Počkejte prosím</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "needs_nickname") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Zvolte si nick</CardTitle>
            <CardDescription>Pro dokončení registrace potřebujeme váš přezdívku</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNicknameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Nick</Label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="jan123"
                  required
                  disabled={submitting}
                  pattern="[a-zA-Z0-9_-]+"
                  title="Pouze písmena, čísla, podtržítka a pomlčky"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Pouze písmena, čísla, podtržítka a pomlčky
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={submitting} size="lg">
                {submitting ? "Ukládám..." : "Pokračovat"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-primary">Úspěšně přihlášeni</CardTitle>
            <CardDescription>Přesměrování na profil...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Chyba přihlášení</CardTitle>
          <CardDescription>Něco se pokazilo při přihlášení</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/auth/login">Zpět na přihlášení</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}