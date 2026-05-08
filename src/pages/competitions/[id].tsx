import { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Users, Calendar, Share2, Fish, User, Trash2, Loader2, ArrowLeft, ExternalLink, Copy, X, Check, Eye } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import { AddCompetitionCatch } from "@/components/competitions/AddCompetitionCatch";
import { CompetitionCountdown } from "@/components/competitions/CompetitionCountdown";
import { CompetitionTimeline } from "@/components/competitions/CompetitionTimeline";

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
  const [isTerminating, setIsTerminating] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const isCreator = currentUserId && competition?.creator_id === currentUserId;
  
  const isCompetitionEnded = competition && new Date(competition.end_date) < new Date();
  const isCompetitionOngoing = competition && 
    new Date(competition.start_date) <= new Date() && 
    new Date(competition.end_date) >= new Date();
    
  const canDelete = isCreator && competition && new Date(competition.start_date) > new Date();
  const canTerminate = isCreator && competition && isCompetitionOngoing;
  const canDeleteTerminated = isCreator && competition?.terminated_early === true;

  useEffect(() => {
    if (id) {
      loadCompetitionData();
      checkUserStatus();
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    // Subscribe to catches changes
    const catchesChannel = supabase
      .channel(`competition-${id}-catches`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "catches",
          filter: `competition_id=eq.${id}`,
        },
        (payload) => {
          console.log("Real-time catch update:", payload);
          
          // Reload catches when any change happens
          loadCompetitionCatches();
        }
      )
      .subscribe();

    // Subscribe to participants changes
    const participantsChannel = supabase
      .channel(`competition-${id}-participants`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competition_participants",
          filter: `competition_id=eq.${id}`,
        },
        (payload) => {
          console.log("Real-time participant update:", payload);
          
          // Reload participants when any change happens
          loadCompetitionParticipants();
        }
      )
      .subscribe();

    // Subscribe to join requests changes (for creator)
    const requestsChannel = supabase
      .channel(`competition-${id}-requests`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competition_join_requests",
          filter: `competition_id=eq.${id}`,
        },
        (payload) => {
          console.log("Real-time join request update:", payload);
          
          // Reload pending requests
          loadPendingRequests();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(catchesChannel);
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [id, competition?.creator_id, currentUserId]);

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

      console.log("=== COMPETITION LOADED ===");
      console.log("Competition ID:", comp.id);
      console.log("Competition name:", comp.name);
      console.log("Competition:", comp);
      setCompetition(comp);

      // Load participants
      await loadCompetitionParticipants();

      // Load catches
      await loadCompetitionCatches();

      // Check if current user is participant
      const user = await authService.getCurrentUser();
      if (user) {
        const participantsData = await competitionService.getCompetitionParticipants(id as string);
        const isParticipant = participantsData?.some((p: any) => p.user_id === user.id);
        console.log("Current user ID:", user.id);
        console.log("Is user participant:", isParticipant);
        setIsUserParticipant(isParticipant);

        // Load pending requests if user is creator
        if (comp.creator_id === user.id) {
          await loadPendingRequests();
        }
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

  async function loadCompetitionCatches() {
    console.log("=== LOADING CATCHES ===");
    console.log("Looking for catches with competition_id:", id);
    const { data: catchData, error: catchError } = await competitionService.getCompetitionCatches(id as string);
    
    console.log("=== CATCHES LOADED ===");
    console.log("Catches error:", catchError);
    console.log("Catches count:", catchData?.length || 0);
    console.log("Catches data:", catchData);
    
    if (catchError) {
      console.error("Error loading catches:", catchError);
    }
    
    setCatches(catchData || []);
  }

  async function loadCompetitionParticipants() {
    const participantsData = await competitionService.getCompetitionParticipants(id as string);
    console.log("=== PARTICIPANTS LOADED ===");
    console.log("Participants count:", participantsData?.length || 0);
    console.log("Participants:", participantsData);
    setParticipants(participantsData || []);
  }

  async function loadPendingRequests() {
    if (!currentUserId || !competition?.creator_id || competition.creator_id !== currentUserId) {
      return;
    }
    
    const requests = await competitionService.getPendingRequests(id as string);
    console.log("Pending requests:", requests);
    setPendingRequests(requests || []);
  }

  async function handleApproveRequest(requestId: string, userId: string) {
    try {
      const { error } = await competitionService.approveJoinRequest(
        requestId,
        competition.id,
        userId
      );

      if (error) throw error;

      toast({
        title: "✅ Žádost schválena",
        description: "Uživatel byl přidán mezi účastníky",
      });

      // Reload data
      await loadCompetitionData();
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      const { error } = await competitionService.rejectJoinRequest(requestId);

      if (error) throw error;

      toast({
        title: "Žádost zamítnuta",
        description: "Žádost o připojení byla zamítnuta",
      });

      // Reload data
      await loadCompetitionData();
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleDeleteCompetition() {
    if (!competition) return;

    const confirmed = confirm(
      `Opravdu chcete smazat závod "${competition.name}"? Tato akce je nevratná.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const { success, error } = await competitionService.deleteCompetition(competition.id);

      if (error || !success) {
        throw new Error("Nepodařilo se smazat závod");
      }

      toast({
        title: "✅ Závod smazán",
        description: "Závod byl úspěšně odstraněn",
      });

      router.push("/competitions");
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleTerminateCompetition() {
    if (!competition) return;

    const confirmed = confirm(
      `⚠️ VAROVÁNÍ: Předčasné ukončení závodu "${competition.name}"\n\n` +
      `Tato akce:\n` +
      `• Ukončí závod okamžitě\n` +
      `• ODSTRANÍ VŠECHNY ÚLOVKY ze závodu\n` +
      `• Umožní následné smazání závodu\n\n` +
      `Tato akce je NEVRATNÁ. Pokračovat?`
    );

    if (!confirmed) return;

    setIsTerminating(true);
    try {
      const { success, error } = await competitionService.terminateCompetition(competition.id);

      if (error || !success) {
        throw new Error("Nepodařilo se ukončit závod");
      }

      toast({
        title: "✅ Závod ukončen",
        description: "Závod byl předčasně ukončen a všechny úlovky byly odstraněny",
      });

      // Reload competition data to show updated state
      await loadCompetitionData();
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTerminating(false);
    }
  }

  async function handleShare() {
    if (!competition) return;

    const joinCode = competition.join_code || competition.invite_code;
    
    // Use production domain or current origin
    const baseUrl = process.env.NODE_ENV === "production" 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
    
    const shareUrl = `${baseUrl}/competitions/${competition.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: competition.name,
          text: `Připoj se k závodu "${competition.name}"!\n\nKód závodu je: ${joinCode}\n\nZadej kód v aplikaci Ukaž Rybu v záložce Závody → Přidat se k závodu`,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    } else {
      const shareText = `Připoj se k závodu "${competition.name}"!\n\nKód závodu je: ${joinCode}\n\n${shareUrl}`;
      navigator.clipboard.writeText(shareText);
      toast({
        title: "✅ Text zkopírován",
        description: "Informace o závodu byly zkopírovány do schránky",
      });
    }
  }

  async function handleShareSpectatorLink() {
    if (!competition) return;

    // Use production domain or current origin
    const baseUrl = process.env.NODE_ENV === "production" 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
    
    const spectatorUrl = `${baseUrl}/competitions/watch/${competition.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sleduj závod: ${competition.name}`,
          text: `Sleduj živě rybářský závod "${competition.name}"!\n\nProbíhá od ${format(new Date(competition.start_date), "d. M. yyyy", { locale: cs })} do ${format(new Date(competition.end_date), "d. M. yyyy", { locale: cs })}`,
          url: spectatorUrl,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    } else {
      navigator.clipboard.writeText(spectatorUrl);
      toast({
        title: "✅ Odkaz zkopírován",
        description: "Odkaz pro diváky byl zkopírován do schránky",
      });
    }
  }

  function getLeaderboard() {
    if (!participants.length) return [];

    const minWeight = competition.min_weight_kg || 0;

    const participantsWithScores = participants.map((participant) => {
      const participantCatches = catches.filter(
        (c) => c.user_id === participant.user_id &&
               (minWeight === 0 || (c.weight_kg || 0) >= minWeight)
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

  function getTopSpecies() {
    const speciesCount = new Map<string, number>();
    
    catches.forEach((catchData) => {
      const species = catchData.species;
      speciesCount.set(species, (speciesCount.get(species) || 0) + 1);
    });

    return Array.from(speciesCount.entries())
      .map(([species, count]) => ({ species, count }))
      .sort((a, b) => b.count - a.count);
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

  // Get recent catches sorted by newest first
  const recentCatches = [...catches]
    .sort((a, b) => new Date(b.caught_at).getTime() - new Date(a.caught_at).getTime())
    .slice(0, 10);

  return (
    <>
      <SEO
        title={competition.name}
        description={`Kód závodu je: ${competition.join_code || competition.invite_code} | ${competition.description || "Rybářský závod na Ukaž Rybu"}`}
      />
      <div className="min-h-screen bg-background">
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
                  <Button 
                    variant="outline" 
                    onClick={handleShareSpectatorLink} 
                    className="gap-2 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Odkaz pro diváky</span>
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
                    <p className="font-medium" suppressHydrationWarning>
                      {format(new Date(competition.start_date), "d. MMM yyyy", { locale: cs })}
                    </p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {format(new Date(competition.start_date), "HH:mm", { locale: cs })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-xs text-muted-foreground">Konec:</p>
                    <p className="font-medium" suppressHydrationWarning>
                      {format(new Date(competition.end_date), "d. MMM yyyy", { locale: cs })}
                    </p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
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

              {/* Countdown Timer */}
              <div className="pt-4">
                <CompetitionCountdown
                  startDate={competition.start_date}
                  endDate={competition.end_date}
                  terminatedEarly={competition.terminated_early}
                  totalCatches={catches.length}
                  totalParticipants={participants.length}
                  topThree={leaderboard.slice(0, 3).map(p => ({
                    nickname: p.profiles?.nickname || "Rybář",
                    avatar_url: p.profiles?.avatar_url,
                    score: p.score,
                    catchCount: p.catchCount
                  }))}
                  allParticipants={leaderboard.map((p, index) => ({
                    nickname: p.profiles?.nickname || "Rybář",
                    avatar_url: p.profiles?.avatar_url,
                    score: p.score,
                    catchCount: p.catchCount,
                    rank: index + 1
                  }))}
                  topSpecies={getTopSpecies()}
                  scoringType={competition.scoring_type}
                />
              </div>

              {/* Add Catch Button - Only for participants during competition */}
              {isUserParticipant && isCompetitionOngoing && (
                <div id="add-catch-section" className="pt-4 border-t transition-all duration-300 scroll-mt-20">
                  <AddCompetitionCatch
                    competitionId={competition.id}
                    scoringType={competition.scoring_type}
                    measurementType={competition.measurement_type}
                    fishPoints={competition.fish_points || undefined}
                    onSuccess={loadCompetitionData}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{participants.length} účastníků</span>
              </div>

              {/* Competition status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {new Date(competition.start_date) > new Date() && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                    Čeká na start
                  </Badge>
                )}
                {isCompetitionOngoing && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                    Probíhá
                  </Badge>
                )}
                {isCompetitionEnded && !competition.terminated_early && (
                  <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-200">
                    Ukončen
                  </Badge>
                )}
                {competition.terminated_early && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                    Předčasně ukončen
                  </Badge>
                )}
              </div>

              {/* Creator Actions */}
              {isCreator && (
                <div className="pt-4 border-t space-y-2">
                  {/* Delete competition (before start) */}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteCompetition}
                      disabled={isDeleting}
                      className="w-full gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mažu...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Smazat závod
                        </>
                      )}
                    </Button>
                  )}

                  {/* Terminate competition early (during competition) */}
                  {canTerminate && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleTerminateCompetition}
                      disabled={isTerminating}
                      className="w-full gap-2"
                    >
                      {isTerminating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Ukončuji...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Ukončit závod předčasně
                        </>
                      )}
                    </Button>
                  )}

                  {/* Delete terminated competition */}
                  {canDeleteTerminated && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteCompetition}
                      disabled={isDeleting}
                      className="w-full gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mažu...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Odstranit závod
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Catches */}
          {recentCatches.length > 0 && (
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="font-serif text-lg sm:text-xl">
                  Nedávné úlovky
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {recentCatches.map((catchData) => {
                    const participant = participants.find((p) => p.user_id === catchData.user_id);
                    const score = calculateCatchScore(catchData);
                    
                    return (
                      <div
                        key={catchData.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* Photo */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          <img
                            src={catchData.photo_url}
                            alt={catchData.species}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                            <span className="font-medium text-sm sm:text-base truncate">
                              {participant?.profiles?.nickname || catchData.profiles?.nickname || "Neznámý"}
                            </span>
                            <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0 sm:px-2 sm:py-0.5">
                              {catchData.species}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                            {catchData.length_cm && (
                              <span className="text-[11px] sm:text-sm">📏 {catchData.length_cm} cm</span>
                            )}
                            {catchData.weight_kg && (
                              <span className="text-[11px] sm:text-sm">⚖️ {catchData.weight_kg} kg</span>
                            )}
                          </div>
                          
                          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1" suppressHydrationWarning>
                            {format(new Date(catchData.caught_at || catchData.created_at), "d. M. yyyy HH:mm", { locale: cs })}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg sm:text-2xl font-bold text-primary">
                            {score.toFixed(competition.scoring_type === "measurements" ? 1 : 0)}
                          </div>
                          <div className="text-[9px] sm:text-xs text-muted-foreground">
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

          {/* Timeline */}
          <CompetitionTimeline
            catches={catches}
            participants={participants}
            scoringType={competition.scoring_type}
            measurementType={competition.measurement_type}
            fishPoints={competition.fish_points}
            minWeightKg={competition.min_weight_kg}
          />

          {/* Pending Join Requests - only visible to creator */}
          {isCreator && pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Čekající závodníci ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.profiles?.nickname || "Anonym"}
                          </p>
                          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            Požádal {format(new Date(request.created_at), "d. M. yyyy HH:mm", { locale: cs })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveRequest(request.id, request.user_id)}
                          className="gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Schválit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                          className="gap-1"
                        >
                          <X className="h-4 w-4" />
                          Zamítnout
                        </Button>
                      </div>
                    </div>
                  ))}
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