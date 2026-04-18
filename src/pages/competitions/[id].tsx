import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { competitionService } from "@/services/competitionService";
import { Trophy, Medal, Copy, Users, Calendar, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import Link from "next/link";

export default function CompetitionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [competition, setCompetition] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadCompetition(id);
    }
  }, [id]);

  async function loadCompetition(competitionId: string) {
    try {
      const { data: comp } = await competitionService.getCompetition(competitionId);
      if (!comp) {
        toast({
          title: "Chyba",
          description: "Závod nebyl nalezen.",
          variant: "destructive",
        });
        router.push("/profile");
        return;
      }
      setCompetition(comp);

      // Load leaderboard
      const board = await competitionService.getLeaderboard(competitionId);
      setLeaderboard(board);
    } catch (error) {
      console.error("Load competition error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function copyInviteLink() {
    if (!competition) return;
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
    const inviteLink = `${origin}/competitions/join/${competition.invite_code}`;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast({
        title: "Zkopírováno",
        description: "Odkaz byl zkopírován do schránky.",
      });
    });
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container py-16 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!competition) {
    return null;
  }

  const isActive = new Date(competition.end_date) > new Date();
  const hasStarted = new Date(competition.start_date) <= new Date();
  const isFinished = !isActive && hasStarted;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 sm:py-12 space-y-6">
          {/* Competition header */}
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-primary" />
                    <CardTitle className="font-serif text-3xl text-primary">
                      {competition.name}
                    </CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {!hasStarted ? "Připravuje se" : isActive ? "Probíhá" : "Ukončeno"}
                    </Badge>
                    {competition.prize_type === "beer" && <Badge variant="outline">🍺 O pivo</Badge>}
                    {competition.prize_type === "bottle" && <Badge variant="outline">🍾 O láhev</Badge>}
                    {competition.prize_type === "none" && <Badge variant="outline">O čest</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyInviteLink} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Sdílet
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Začátek:</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(competition.start_date), "d. MMMM yyyy, HH:mm", { locale: cs })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Konec:</p>
                  <p className="font-medium flex items-center gap-2">
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

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{leaderboard.length} {leaderboard.length === 1 ? "účastník" : leaderboard.length < 5 ? "účastníci" : "účastníků"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Medal className="h-6 w-6 text-primary" />
                {isFinished ? "Konečné pořadí" : "Aktuální pořadí"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg font-medium">Zatím žádné úlovky</p>
                  <p className="text-sm mt-1">Buďte první, kdo přidá úlovek do závodu!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`p-4 rounded-lg flex items-center justify-between ${
                        index === 0 && isFinished ? 'bg-amber-500/10 border-2 border-amber-500/30' :
                        index === 1 && isFinished ? 'bg-gray-300/10 border-2 border-gray-300/30' :
                        index === 2 && isFinished ? 'bg-orange-600/10 border-2 border-orange-600/30' :
                        'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                          {index === 0 && isFinished ? '🥇' :
                           index === 1 && isFinished ? '🥈' :
                           index === 2 && isFinished ? '🥉' :
                           index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{entry.nickname || "Anonym"}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.catch_count} {entry.catch_count === 1 ? "úlovek" : entry.catch_count < 5 ? "úlovky" : "úlovků"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold font-serif text-primary">
                          {entry.total_score.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">bodů</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share card */}
          <Card className="bg-muted/30">
            <CardContent className="p-6 text-center space-y-3">
              <h3 className="font-medium">Pozvěte přátele do závodu</h3>
              <div className="flex gap-2 max-w-md mx-auto">
                <code className="flex-1 p-3 bg-background rounded border text-sm font-mono">
                  {competition.invite_code}
                </code>
                <Button onClick={copyInviteLink} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Sdílejte kód nebo odkaz, aby se mohli přátelé připojit
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}