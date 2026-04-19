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
import { Trophy, Users, Calendar, Share2, Fish, User, Trash2, Loader2, ArrowLeft, ExternalLink, Copy } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import { AddCompetitionCatch } from "@/components/competitions/AddCompetitionCatch";

export default function CompetitionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();

  const [competition, setCompetition] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [catches, setCatches] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUserParticipant, setIsUserParticipant] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreator = currentUserId && competition?.created_by === currentUserId;
  const canDelete = isCreator && competition && new Date(competition.start_date) > new Date();

  useEffect(() => {
    if (id) {
      loadCompetitionData();
      checkUserStatus();
    }
  }, [id]);

  async function checkUserStatus() {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }

  async function loadCompetitionData() {
    setIsLoading(true);
    try {
      const { data: comp, error: compError } = await competitionService.getCompetition(id as string);

      if (compError || !comp) {
        throw new Error("Závod nenalezen");
      }

      console.log("Competition loaded:", comp);
      setCompetition(comp);

      // Load participants
      const participantsData = await competitionService.getCompetitionParticipants(id as string);
      console.log("Participants loaded:", participantsData);
      setParticipants(participantsData || []);

      // Load catches
      const { data: catchData } = await competitionService.getCompetitionCatches(id as string);
      console.log("Competition catches loaded:", catchData);
      console.log("Number of catches:", catchData?.length || 0);
      setCatches(catchData || []);

      // Check if current user is participant
      const user = await authService.getCurrentUser();
      if (user && participantsData) {
        const isParticipant = participantsData.some((p: any) => p.user_id === user.id);
        console.log("Is user participant:", isParticipant);
        setIsUserParticipant(isParticipant);
      }
    } catch (error: any) {
      console.error("Load competition data error:", error);
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
      router.push("/competitions");
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
        // Use fish points configuration
        const fishPointsConfig = competition.fish_points || {};
        score = participantCatches.reduce((sum, c) => {
          const points = fishPointsConfig[c.species] || 1;
          return sum + points;
        }, 0);
      } else {
        // Measurements scoring
        const measurementType = competition.measurement_type || "both";
        
        const catchScores = participantCatches.map((c) => {
          let catchScore = 0;
          
          if (measurementType === "weight") {
            catchScore = c.weight_kg || 0;
          } else if (measurementType === "length") {
            catchScore = c.length_cm || 0;
          } else {
            const lengthScore = c.length_cm || 0;
            const weightScore = (c.weight_kg || 0) * 10;
            catchScore = lengthScore + weightScore;
          }
          
          return catchScore;
        });

        catchScores.sort((a, b) => b - a);

        const topCount = competition.top_catches_count;
        const scoresToCount = topCount && topCount > 0 
          ? catchScores.slice(0, topCount)
          : catchScores;

        score = scoresToCount.reduce((sum, s) => sum + s, 0);
      }

      return {
        ...participant,
        score,
        catchCount: participantCatches.length,
      };
    });

    return participantsWithScores.sort((a, b) => b.score - a.score);
  }

  function calculateCatchScore(catchData: any): number {
    if (!competition) return 0;

    if (competition.scoring_type === "points") {
      const fishPoints = competition.fish_points || {};
      return fishPoints[catchData.species] || 1;
    } else {
      const measurementType = competition.measurement_type || "both";
      
      if (measurementType === "weight") {
        return catchData.weight_kg || 0;
      } else if (measurementType === "length") {
        return catchData.length_cm || 0;
      } else {
        const lengthScore = catchData.length_cm || 0;
        const weightScore = (catchData.weight_kg || 0) * 10;
        return lengthScore + weightScore;
      }
    }
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
  const isCompetitionEnded = competition && new Date(competition.end_date) < new Date();
  const isCompetitionOngoing = competition && 
    new Date(competition.start_date) <= new Date() && 
    new Date(competition.end_date) >= new Date();

  // Get recent catches sorted by newest first
  const recentCatches = [...catches]
    .sort((a, b) => new Date(b.caught_at).getTime() - new Date(a.caught_at).getTime())
    .slice(0, 10);

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
                    <p className="font-medium text-xs text-muted-foreground">Začátek:</p>
                    <p className="font-medium">
                      {format(new Date(competition.start_date), "d. MMM yyyy", { locale: cs })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(competition.start_date), "HH:mm", { locale: cs })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-xs text-muted-foreground">Konec:</p>
                    <p className="font-medium">
                      {format(new Date(competition.end_date), "d. MMM yyyy", { locale: cs })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(competition.end_date), "HH:mm", { locale: cs })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{participants.length} účastníků</p>
                    <p className="text-xs text-muted-foreground">
                      {isCompetitionEnded ? "Ukončen" : isCompetitionOngoing ? "Probíhá" : "Nadcházející"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Kód závodu:</span>
                  <Badge variant="outline" className="font-mono text-base px-3 py-1">
                    {competition.join_code || competition.invite_code}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Fish className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {catches.length} {catches.length === 1 ? "úlovek" : "úlovků"}
                  </span>
                </div>
                <div>
                  {competition.scoring_type === "points" ? (
                    <Badge variant="secondary" className="gap-1">
                      🏆 Bodování podle druhu
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      📏 {
                        competition.measurement_type === "weight" ? "Váha" :
                        competition.measurement_type === "length" ? "Délka" :
                        "Délka + váha"
                      }
                      {competition.top_catches_count && ` (top ${competition.top_catches_count})`}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Show scoring rules */}
              {competition.scoring_type === "points" && competition.fish_points && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Bodování druhů:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(competition.fish_points).map(([species, points]) => (
                      <Badge key={species} variant="outline" className="text-xs">
                        {species}: {points as number} {(points as number) === 1 ? "bod" : "body"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Catch Button - Only for participants during competition */}
              {isUserParticipant && isCompetitionOngoing && (
                <div className="pt-4 border-t">
                  <AddCompetitionCatch
                    competitionId={competition.id}
                    scoringType={competition.scoring_type}
                    measurementType={competition.measurement_type}
                    onSuccess={loadCompetitionData}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Catches */}
          {recentCatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">
                  Nedávné úlovky
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCatches.map((catchData) => {
                    const participant = participants.find((p) => p.user_id === catchData.user_id);
                    const score = calculateCatchScore(catchData);
                    
                    return (
                      <div
                        key={catchData.id}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* Photo */}
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <img
                            src={catchData.photo_url}
                            alt={catchData.species}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {participant?.profiles?.nick || "Neznámý"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {catchData.species}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {catchData.length_cm && (
                              <span>📏 {catchData.length_cm} cm</span>
                            )}
                            {catchData.weight_kg && (
                              <span>⚖️ {catchData.weight_kg} kg</span>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(catchData.caught_at), "d. M. yyyy HH:mm", { locale: cs })}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-primary">
                            {score.toFixed(competition.scoring_type === "measurements" ? 1 : 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {competition.scoring_type === "points" ? "bodů" : "bodů"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">
                {isCompetitionEnded ? "🏁 Konečné pořadí" : "📊 Průběžné pořadí"}
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
        </main>
      </div>
    </>
  );
}