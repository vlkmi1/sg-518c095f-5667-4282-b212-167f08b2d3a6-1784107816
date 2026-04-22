import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { competitionService } from "@/services/competitionService";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Users, Calendar, Fish, User, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { CompetitionCountdown } from "@/components/competitions/CompetitionCountdown";

export default function CompetitionWatchPage() {
  const router = useRouter();
  const { id } = router.query;

  const [competition, setCompetition] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [catches, setCatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);

  const isCompetitionEnded = competition && new Date(competition.end_date) < new Date();
  const isCompetitionOngoing = competition && 
    new Date(competition.start_date) <= new Date() && 
    new Date(competition.end_date) >= new Date();

  useEffect(() => {
    if (id) {
      loadCompetitionData();
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    console.log("=== SETTING UP REALTIME SUBSCRIPTIONS ===");
    console.log("Competition ID:", id);

    // Subscribe to catches changes
    const catchesChannel = supabase
      .channel(`watch-competition-${id}-catches`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "catches",
          filter: `competition_id=eq.${id}`,
        },
        (payload) => {
          console.log("✅ Real-time catch update received:", payload);
          loadCompetitionCatches();
        }
      )
      .subscribe((status) => {
        console.log("Catches channel status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Catches channel subscribed successfully");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Catches channel error");
        } else if (status === "TIMED_OUT") {
          console.error("❌ Catches channel timed out");
        }
      });

    // Subscribe to participants changes
    const participantsChannel = supabase
      .channel(`watch-competition-${id}-participants`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competition_participants",
          filter: `competition_id=eq.${id}`,
        },
        (payload) => {
          console.log("✅ Real-time participant update received:", payload);
          loadCompetitionParticipants();
        }
      )
      .subscribe((status) => {
        console.log("Participants channel status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Participants channel subscribed successfully");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Participants channel error");
        } else if (status === "TIMED_OUT") {
          console.error("❌ Participants channel timed out");
        }
      });

    return () => {
      console.log("=== CLEANING UP REALTIME SUBSCRIPTIONS ===");
      supabase.removeChannel(catchesChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [id]);

  async function loadCompetitionData() {
    setIsLoading(true);
    try {
      const { data: comp, error: compError } = await competitionService.getCompetition(id as string);

      if (compError || !comp) {
        throw new Error("Závod nenalezen");
      }

      setCompetition(comp);
      await loadCompetitionParticipants();
      await loadCompetitionCatches();
    } catch (error: any) {
      console.error("Load competition data error:", error);
      router.push("/competitions");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCompetitionCatches() {
    const { data: catchData } = await competitionService.getCompetitionCatches(id as string);
    setCatches(catchData || []);
  }

  async function loadCompetitionParticipants() {
    const participantsData = await competitionService.getCompetitionParticipants(id as string);
    setParticipants(participantsData || []);
  }

  function getLeaderboard() {
    if (!participants.length) return [];

    const participantsWithScores = participants.map((participant) => {
      const participantCatches = catches.filter(
        (c) => c.user_id === participant.user_id
      );

      let score = 0;

      if (competition.scoring_type === "points") {
        const fishPointsConfig = competition.fish_points || {};
        score = participantCatches.reduce((sum, c) => {
          const points = fishPointsConfig[c.species] || 1;
          return sum + points;
        }, 0);
      } else {
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
  const recentCatches = [...catches]
    .sort((a, b) => new Date(b.caught_at).getTime() - new Date(a.caught_at).getTime())
    .slice(0, 10);

  return (
    <>
      <SEO
        title={`${competition.name} - Živé sledování`}
        description={`Sledujte živě rybářský závod ${competition.name} | ${competition.description || ""}`}
      />
      <div className="min-h-screen bg-background">
        <main className="container py-8 space-y-6">
          {/* Header with spectator indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>Režim diváka - Živé sledování závodu</span>
          </div>

          {/* Competition Header */}
          <Card>
            <Collapsible open={isHeaderOpen} onOpenChange={setIsHeaderOpen}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-serif text-3xl mb-2">
                      {competition.name}
                    </CardTitle>
                    
                    {/* Countdown - Always visible */}
                    <div className="mt-3">
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
                  </div>
                  
                  <CollapsibleTrigger asChild>
                    <button className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors">
                      {isHeaderOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {competition.description && (
                    <p className="text-muted-foreground">{competition.description}</p>
                  )}
                  
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
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Recent Catches */}
          {recentCatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Fish className="h-5 w-5 text-primary" />
                  Nedávné úlovky
                  <Badge variant="outline" className="ml-auto">
                    Live
                  </Badge>
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
                              {participant?.profiles?.nickname || catchData.profiles?.nickname || "Neznámý"}
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
                          
                          <div className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                            {format(new Date(catchData.caught_at || catchData.created_at), "d. M. yyyy HH:mm", { locale: cs })}
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
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                {isCompetitionEnded ? "🏁 Konečné pořadí" : "📊 Průběžné pořadí"}
                <Badge variant="outline" className="ml-auto">
                  Live
                </Badge>
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