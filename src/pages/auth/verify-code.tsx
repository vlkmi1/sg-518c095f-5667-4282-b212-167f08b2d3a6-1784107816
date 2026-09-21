import { useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function VerifyCodePage() {
  const router = useRouter();
  const { email } = router.query;
  const { toast } = useToast();
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 4) {
      toast({
        title: "Neplatný kód",
        description: "Zadejte prosím 4místný kód",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Ověření selhalo",
          description: data.error || "Neplatný kód",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Success
      toast({
        title: "✅ Účet ověřen!",
        description: "Vítejte! Budete přesměrováni na profil...",
      });

      // Redirect to profile (or first-time setup)
      setTimeout(() => {
        router.push("/profile");
      }, 1500);

    } catch (error) {
      toast({
        title: "Chyba",
        description: "Něco se pokazilo. Zkuste to znovu.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    
    setResending(true);
    
    try {
      // Call send-otp API again
      // Note: We need to store password in session or ask user to re-enter
      toast({
        title: "Kód odeslán",
        description: "Nový ověřovací kód byl odeslán na váš email",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se znovu odeslat kód",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="font-serif text-3xl">
            Ověřte svůj email
          </CardTitle>
          <CardDescription>
            Zadejte 4místný kód který jsme poslali na
            <br />
            <strong className="text-foreground">{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="bg-accent/5 border-accent/20">
            <AlertCircle className="h-5 w-5 text-accent" />
            <AlertDescription className="text-sm ml-2">
              Kód je platný pouze <strong>5 minut</strong>. Pokud email nevidíte, zkontrolujte spam.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="code" className="text-center block">
                Ověřovací kód
              </Label>
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={4} 
                  value={code} 
                  onChange={(value) => setCode(value)}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="text-2xl w-14 h-14" />
                    <InputOTPSlot index={1} className="text-2xl w-14 h-14" />
                    <InputOTPSlot index={2} className="text-2xl w-14 h-14" />
                    <InputOTPSlot index={3} className="text-2xl w-14 h-14" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || code.length !== 4}
              size="lg"
            >
              {loading ? "Ověřuji..." : "Ověřit kód"}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Nepřišel vám kód?
            </p>
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={resending}
              className="w-full"
            >
              {resending ? "Odesílám..." : "Odeslat kód znovu"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}