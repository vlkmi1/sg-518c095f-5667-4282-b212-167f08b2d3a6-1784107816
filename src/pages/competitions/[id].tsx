import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/layout/Header";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { authService } from "@/services/authService";
import { adminService } from "@/services/adminService";
import { competitionService } from "@/services/competitionService";
import { catchService } from "@/services/catchService";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Users, Calendar, Share2, Fish, User, Trash2, Loader2 } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";

export default function CompetitionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();

  const [competition, setCompetition] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [catches, setCatches] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadCompetitionData();
    }
  }, [id]);

  async function loadCompetitionData() {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const adminStatus = await adminService.isAdmin(user.id);
        setIsAdmin(adminStatus);
      }

      const { data: compData, error: compError } =
        await competitionService.getCompetition(id as string);

      if (compError || !compData) {
        throw new Error("Závod nebyl nalezen");
      }

      setCompetition(compData);

      const participantsData = await competitionService.getCompetitionParticipants(
        id as string
      );
      setParticipants(participantsData || []);

      const catchesData = await competitionService.getCompetitionCatches(id as string);
      setCatches(catchesData || []);
    } catch (error: any) {
      console.error("Load competition error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se načíst závod",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteCompetition() {
    if (!competition || !currentUser) return;

    setIsDeleting(true);

    try {
      await competitionService.deleteCompetition(competition.id);

      toast({
        title: "🗑️ Závod odstraněn",
        description: `Závod "${competition.name}" byl trvale smazán`,
      });

      router.push("/competitions");
    } catch (error: any) {
      console.error("Delete competition error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odstranit závod",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleShare() {
    if (!competition) return;

    const shareUrl = `${window.location.origin}/competitions/join/${competition.join_code || competition.invite_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: competition.name,
          text: `Připoj se k závodu "${competition.name}"!`,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "✅ Odkaz zkopírován",
        description: "Odkaz na závod byl zkopírován do schránky",
      });
    }
  }

  function getLeaderboard() {
    if (!participants.length) return [];

    const participantsWithScores = participants.map((participant) => {
      const participantCatches = catches.filter(
        (c) => c.user_id === participant.user_id
      );

      let score = 0;

      if (competition.scoring_type === "points") {
        score = participantCatches.length;
      } else {
        score = participantCatches.reduce((sum, c) => {
          const lengthScore = c.length_cm || 0;
          const weightScore = (c.weight_kg || 0) * 10;
          return sum + lengthScore + weightScore;
        }, 0);
      }

      return {
        ...participant,
        score,
        catchCount: participantCatches.length,
      };
    });

    return participantsWithScores.sort((a, b) => b.score - a.score);
  }

  if (isLoading) {
    return (
      <>
        <SEO title="Načítání..." />
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container py-8">
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </>
    );
  }

  if (!competition) {
    return (
      <>
        <SEO title="Závod nenalezen" />
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container py-8">
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-xl font-medium text-muted-foreground">
                  Závod nenalezen
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </>
    );
  }

  const leaderboard = getLeaderboard();
  const hasStarted = isBefore(startOfDay(new Date(competition.start_date)), startOfDay(new Date()));
  const hasEnded = isBefore(startOfDay(new Date(competition.end_date)), startOfDay(new Date()));
  const isCreator = currentUser?.id === competition.created_by;
  const canDelete = (isCreator || isAdmin) && !hasStarted;

  return (
    <>
      <SEO
        title={competition.name}
        description={competition.description || "Rybářský závod na Ukaž Rybu"}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 space-y-6">
          {/* Competition Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="font-serif text-3xl mb-2">
                    {competition.name}
                  </CardTitle>
                  {competition.description && (
                    <p className="text-muted-foreground">{competition.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Sdílet</span>
                  </Button>
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="gap-2"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Odstranit</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Opravdu odstranit závod?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tato akce je nevratná. Závod bude trvale odstraněn včetně
                            všech účastníků a výsledků.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Zrušit</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteCompetition}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Odstranit závod
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(competition.start_date), "d. MMM", { locale: cs })} -{" "}
                      {format(new Date(competition.end_date), "d. MMM yyyy", { locale: cs })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hasEnded ? "Ukončen" : hasStarted ? "Probíhá" : "Nadcházející"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{participants.length} účastníků</p>
                    <p className="text-xs text-muted-foreground">Celkem závodníků</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Fish className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{catches.length} úlovků</p>
                    <p className="text-xs text-muted-foreground">
                      {competition.scoring_type === "points" ? "Bodování" : "Podle rozměrů"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Kód závodu:</span>
                <Badge variant="outline" className="font-mono text-base px-3 py-1">
                  {competition.join_code || competition.invite_code}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Pořadí závodníků
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Zatím nejsou žádní účastníci</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((participant, index) => (
                    <div
                      key={participant.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        index === 0
                          ? "bg-yellow-500/10 border border-yellow-500/20"
                          : index === 1
                          ? "bg-gray-400/10 border border-gray-400/20"
                          : index === 2
                          ? "bg-amber-700/10 border border-amber-700/20"
                          : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold w-8 text-center">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participant.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.profiles?.nickname || "Rybář"}</p>
                          <p className="text-sm text-muted-foreground">
                            {participant.catchCount} {participant.catchCount === 1 ? "úlovek" : "úlovky"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{participant.score}</p>
                        <p className="text-xs text-muted-foreground">
                          {competition.scoring_type === "points" ? "bodů" : "skóre"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Catches */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Fish className="h-5 w-5 text-primary" />
                Nedávné úlovky
              </CardTitle>
            </CardHeader>
            <CardContent>
              {catches.length === 0 ? (
                <div className="text-center py-8">
                  <Fish className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Zatím žádné úlovky</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catches.slice(0, 6).map((catchItem) => (
                    <Card key={catchItem.id} className="overflow-hidden">
                      {catchItem.photo_url && (
                        <div className="aspect-video relative">
                          <img
                            src={catchItem.photo_url}
                            alt={catchItem.species}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-serif font-semibold text-lg">
                          {catchItem.species}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {catchItem.profiles?.nickname || "Neznámý rybář"}
                        </p>
                        {(catchItem.length_cm || catchItem.weight_kg) && (
                          <p className="text-sm text-muted-foreground">
                            {catchItem.length_cm && `📏 ${catchItem.length_cm} cm`}
                            {catchItem.length_cm && catchItem.weight_kg && " • "}
                            {catchItem.weight_kg && `⚖️ ${catchItem.weight_kg} kg`}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(catchItem.caught_at), "d. MMM yyyy HH:mm", {
                            locale: cs,
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}