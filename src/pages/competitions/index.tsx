import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { competitionService } from "@/services/competitionService";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Plus, Users, Calendar } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cs } from "date-fns/locale";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function CompetitionsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadCompetitions();
  }, []);

  async function loadCompetitions() {
    setIsLoading(true);
    try {
      const { data, error } = await competitionService.getCompetitions();

      if (error) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se načíst závody",
          variant: "destructive",
        });
        return;
      }

      console.log("Competitions loaded:", data);

      // Load participant counts and winners for each competition
      const competitionsWithCounts = await Promise.all(
        (data || []).map(async (comp: any) => {
          const participants = await competitionService.getCompetitionParticipants(comp.id);
          
          // For past competitions, load the winner
          let winner = null;
          if (new Date(comp.end_date) < new Date()) {
            const leaderboard = await competitionService.getLeaderboard(comp.id);
            if (leaderboard && leaderboard.length > 0) {
              winner = leaderboard[0];
              
              // Load winner's profile data for avatar
              if (winner.user_id) {
                const { data: profileData } = await supabase
                  .from("profiles")
                  .select("avatar_url")
                  .eq("id", winner.user_id)
                  .maybeSingle();
                
                if (profileData) {
                  winner.avatar_url = profileData.avatar_url;
                }
              }
            }
          }
          
          return {
            ...comp,
            participant_count: participants?.length || 0,
            winner,
          };
        })
      );

      console.log("Competitions with participant counts:", competitionsWithCounts);
      setCompetitions(competitionsWithCounts);
    } catch (error) {
      console.error("Error loading competitions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter logic
  const now = new Date();
  const activeComps = competitions.filter(
    (c) => new Date(c.start_date) <= now && new Date(c.end_date) >= now
  );
  const upcomingComps = competitions.filter((c) => new Date(c.start_date) > now);
  const pastComps = competitions.filter((c) => new Date(c.end_date) < now);

  const currentList =
    activeTab === "active"
      ? activeComps
      : activeTab === "upcoming"
      ? upcomingComps
      : pastComps;

  const totalPages = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const activePage = activeComps.slice(startIndex, endIndex);
  const upcomingPage = upcomingComps.slice(startIndex, endIndex);
  const pastPage = pastComps.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Format competition date range
  function formatCompetitionDate(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isSameDay(start, end)) {
      // Same day format: "Neděle 19.4. - 13:00-20:00"
      return `${format(start, "EEEE d.M.", { locale: cs })} - ${format(start, "HH:mm")}-${format(end, "HH:mm")}`;
    } else {
      // Different days format: "19. Apr 13:00 - 20. Apr 20:00"
      return `${format(start, "d. MMM HH:mm", { locale: cs })} - ${format(end, "d. MMM yyyy HH:mm", { locale: cs })}`;
    }
  }

  // Format winner score based on competition type
  function formatWinnerScore(comp: any): string {
    if (!comp.winner) return "";
    
    const score = comp.winner.total_score;
    
    if (comp.scoring_type === "points") {
      return `${score} bodů`;
    }
    
    // Measurement-based
    if (comp.measurement_type === "length") {
      return `${score} cm`;
    } else if (comp.measurement_type === "weight") {
      return `${score} kg`;
    } else if (comp.measurement_type === "count") {
      return `${score} ks`;
    } else {
      // combined
      return `${score} bodů`;
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <SEO title="Závody" />
        <div className="min-h-screen bg-background">
          <main className="container py-8">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SEO title="Závody" />
      <div className="min-h-screen bg-background">
        <main className="container py-8 space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Aktivní ({activeComps.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Nadcházející ({upcomingComps.length})</TabsTrigger>
              <TabsTrigger value="past">Ukončené ({pastComps.length})</TabsTrigger>
            </TabsList>

            {/* Active Competitions */}
            <TabsContent value="active" className="space-y-4">
              {activePage.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Žádné aktivní závody</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePage.map((comp) => (
                    <Card
                      key={comp.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow border-primary/30"
                      onClick={() => router.push(`/competitions/${comp.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="font-serif text-lg">{comp.name}</CardTitle>
                          <Badge className="bg-green-600">Probíhá</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium" suppressHydrationWarning>
                              {formatCompetitionDate(comp.start_date, comp.end_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{comp.participant_count || 0} účastníků</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">
                            {comp.scoring_type === "points" ? "🏆 Bodování" : "📏 Míry"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Upcoming Competitions */}
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingPage.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Žádné nadcházející závody</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingPage.map((comp) => (
                    <Card
                      key={comp.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/competitions/${comp.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="font-serif text-lg">{comp.name}</CardTitle>
                          <Badge variant="secondary">Nadcházející</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium" suppressHydrationWarning>
                              {formatCompetitionDate(comp.start_date, comp.end_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{comp.participant_count || 0} účastníků</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">
                            {comp.scoring_type === "points" ? "🏆 Bodování" : "📏 Míry"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Past Competitions */}
            <TabsContent value="past" className="space-y-4">
              {pastPage.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Žádné ukončené závody</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastPage.map((comp) => (
                    <Card
                      key={comp.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow opacity-75"
                      onClick={() => router.push(`/competitions/${comp.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="font-serif text-lg">{comp.name}</CardTitle>
                          <Badge variant="outline">Ukončen</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium" suppressHydrationWarning>
                              {formatCompetitionDate(comp.start_date, comp.end_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{comp.participant_count || 0} účastníků</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">
                            {comp.scoring_type === "points" ? "🏆 Bodování" : "📏 Míry"}
                          </Badge>
                        </div>
                        
                        {/* Winner Badge */}
                        {comp.winner && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={comp.winner.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {comp.winner.nickname?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {comp.winner.nickname}
                            </span>
                            <Badge variant="default" className="ml-auto">
                              {formatWinnerScore(comp)}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Předchozí
                </Button>
                <span className="text-sm text-muted-foreground">
                  Strana {currentPage} z {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Další
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}