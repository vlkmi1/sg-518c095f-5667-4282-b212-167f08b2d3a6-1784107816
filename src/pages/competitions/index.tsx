import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/layout/Header";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { competitionService } from "@/services/competitionService";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Plus, Users, Calendar, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export default function CompetitionsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      setUser(currentUser);

      const comps = await competitionService.getUserCompetitions(currentUser.id);
      setCompetitions(comps || []);
    } catch (error) {
      console.error("Error loading competitions:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst závody",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinCompetition() {
    if (!joinCode.trim()) {
      toast({
        title: "Chybí kód",
        description: "Zadejte kód závodu",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);

    try {
      const { data: competition, error } = await competitionService.getCompetitionByCode(
        joinCode.toUpperCase().trim()
      );

      if (error || !competition) {
        throw new Error("Závod s tímto kódem nebyl nalezen");
      }

      await competitionService.joinCompetition(competition.id, user.id);

      toast({
        title: "✅ Přidán do závodu!",
        description: `Úspěšně jste se přidali do závodu "${competition.name}"`,
      });

      setJoinDialogOpen(false);
      setJoinCode("");

      router.push(`/competitions/${competition.id}`);
    } catch (error: any) {
      console.error("Join competition error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se připojit k závodu",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  }

  function getCompetitionStatus(comp: any) {
    const now = new Date();
    const startDate = new Date(comp.start_date);
    const endDate = new Date(comp.end_date);

    if (now < startDate) {
      return { label: "Nezačal", variant: "outline" as const, icon: Clock };
    } else if (now > endDate) {
      return { label: "Skončil", variant: "secondary" as const, icon: Clock };
    } else {
      return { label: "Probíhá", variant: "default" as const, icon: Clock };
    }
  }

  if (isLoading) {
    return (
      <>
        <SEO title="Závody" />
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container py-8">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Závody" />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 space-y-6">
          {/* Header */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  Rybářské závody
                </CardTitle>
                <Button onClick={() => router.push("/competitions/create")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Vytvořit závod</span>
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Aktivní ({activePage.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Nadcházející ({upcomingPage.length})</TabsTrigger>
              <TabsTrigger value="past">Ukončené ({pastPage.length})</TabsTrigger>
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
                            <p className="font-medium">
                              {format(new Date(comp.start_date), "d. MMM yyyy HH:mm", { locale: cs })} -{" "}
                              {format(new Date(comp.end_date), "d. MMM yyyy HH:mm", { locale: cs })}
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
                            <p className="font-medium">
                              {format(new Date(comp.start_date), "d. MMM yyyy HH:mm", { locale: cs })} -{" "}
                              {format(new Date(comp.end_date), "d. MMM yyyy HH:mm", { locale: cs })}
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
                            <p className="font-medium">
                              {format(new Date(comp.start_date), "d. MMM yyyy HH:mm", { locale: cs })} -{" "}
                              {format(new Date(comp.end_date), "d. MMM yyyy HH:mm", { locale: cs })}
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
    </>
  );
}