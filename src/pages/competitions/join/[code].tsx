import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { competitionService } from "@/services/competitionService";
import { authService } from "@/services/authService";
import { Trophy, Calendar, Users, CheckCircle, Loader2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export default function JoinCompetitionPage() {
  const router = useRouter();
  const { code } = router.query;
  const { toast } = useToast();
  const [competition, setCompetition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (code && typeof code === "string") {
      loadCompetition(code);
    }
  }, [code]);

  async function loadCompetition(inviteCode: string) {
    try {
      const { data, error } = await competitionService.getCompetitionByInviteCode(inviteCode);
      
      if (error || !data) {
        toast({
          title: "Chyba",
          description: "Závod s tímto kódem neexistuje.",
          variant: "destructive",
        });
        router.push("/profile");
        return;
      }

      setCompetition(data);
    } catch (error) {
      console.error("Load competition error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin() {
    if (!competition) return;
    
    setIsJoining(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        toast({
          title: "Přihlášení nutné",
          description: "Pro připojení k závodu se musíte přihlásit",
        });
        router.push("/auth/login");
        return;
      }

      // Check if competition is public - if so, submit join request
      if (competition.is_public) {
        // Check if user already has pending request
        const hasPending = await competitionService.hasPendingRequest(competition.id, user.id);
        
        if (hasPending) {
          toast({
            title: "Žádost již odeslána",
            description: "Vyčkejte na schválení zakladatelem závodu",
          });
          router.push(`/competitions/${competition.id}`);
          return;
        }

        // Submit join request
        const { error } = await competitionService.submitJoinRequest(competition.id, user.id);
        
        if (error) throw error;

        toast({
          title: "✅ Žádost odeslána",
          description: "Vyčkejte na schválení zakladatelem závodu",
        });
      } else {
        // Private competition - join directly
        await competitionService.joinCompetition(competition.id, user.id);

        toast({
          title: "✅ Připojeno!",
          description: "Úspěšně jste se připojili k závodu",
        });
      }

      router.push(`/competitions/${competition.id}`);
    } catch (error: any) {
      console.error("Join competition error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se připojit k závodu.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Načítání závodu...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!competition) {
    return null;
  }

  const isActive = new Date(competition.end_date) > new Date();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <main className="container py-8 sm:py-12">
          <Card className="max-w-2xl mx-auto border-primary/20 shadow-md">
            <CardContent className="space-y-6 pt-4">
              {/* Competition details */}
              <div className="space-y-4">
                <div className="text-center pb-4 border-b">
                  <h2 className="text-2xl font-serif font-semibold mb-2">{competition.name}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Probíhá" : "Ukončeno"}
                    </Badge>
                    {competition.is_public ? (
                      <Badge variant="outline">🌐 Veřejný</Badge>
                    ) : (
                      <Badge variant="outline">🔒 Soukromý</Badge>
                    )}
                    {competition.prize_type === "beer" && <Badge variant="outline">🍺 O pivo</Badge>}
                    {competition.prize_type === "bottle" && <Badge variant="outline">🍾 O láhev</Badge>}
                    {competition.prize_type === "none" && <Badge variant="outline">O čest</Badge>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Začátek:</p>
                    <p className="font-medium flex items-center gap-2" suppressHydrationWarning>
                      <Calendar className="h-4 w-4" />
                      {format(new Date(competition.start_date), "d. MMMM yyyy, HH:mm", { locale: cs })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Konec:</p>
                    <p className="font-medium flex items-center gap-2" suppressHydrationWarning>
                      <Calendar className="h-4 w-4" />
                      {format(new Date(competition.end_date), "d. MMMM yyyy, HH:mm", { locale: cs })}
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">Pravidla:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Hodnotí se: {
                      competition.scoring_type === "length" ? "Délka ryby (cm)" :
                      competition.scoring_type === "weight" ? "Váha ryby (kg)" :
                      "Součet délky + váhy"
                    }</li>
                    <li>• Započítávají se: {
                      competition.top_catches_count 
                        ? `Jen ${competition.top_catches_count} nejlepších úlovků`
                        : "Všechny úlovky"
                    }</li>
                    <li>• Schvalování: {
                      competition.auto_approve ? "Automatické" : "Zakladatel schvaluje"
                    }</li>
                  </ul>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {hasJoined ? (
                  <>
                    <Button 
                      className="flex-1 h-12" 
                      onClick={() => router.push(`/competitions/${competition.id}`)}
                    >
                      <Trophy className="h-5 w-5 mr-2" />
                      Přejít na závod
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12"
                      onClick={() => router.push("/profile")}
                    >
                      Zpět na profil
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      className="flex-1 h-12" 
                      onClick={handleJoin}
                      disabled={isJoining || !isActive}
                    >
                      {isJoining ? (
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {competition.is_public ? "Odesílám žádost..." : "Připojuji..."}</>
                      ) : (
                        <><Users className="h-5 w-5 mr-2" /> {competition.is_public ? "Poslat žádost o připojení" : "Připojit se k závodu"}</>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12"
                      onClick={() => router.push("/profile")}
                    >
                      Zrušit
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}