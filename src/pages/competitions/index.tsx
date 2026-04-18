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
      <SEO title="Rybářské závody" />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold mb-2">Závody</h1>
              <p className="text-muted-foreground">Moje rybářské soutěže a závody</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Přidat se k závodu
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif">Připojit se k závodu</DialogTitle>
                    <DialogDescription>
                      Zadejte 6místný kód závodu, ke kterému se chcete připojit
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="join-code">Kód závodu</Label>
                      <Input
                        id="join-code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="např. ABC123"
                        maxLength={6}
                        className="font-mono text-lg text-center tracking-widest"
                      />
                    </div>
                    <Button
                      onClick={handleJoinCompetition}
                      disabled={isJoining || !joinCode.trim()}
                      className="w-full"
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Připojuji se...
                        </>
                      ) : (
                        "Připojit se"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={() => router.push("/competitions/create")} className="gap-2">
                <Plus className="h-4 w-4" />
                Nový závod
              </Button>
            </div>
          </div>

          {/* Competitions Grid */}
          {competitions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-serif text-xl font-semibold mb-2">Zatím žádné závody</h3>
                <p className="text-muted-foreground mb-6">
                  Vytvořte nový závod nebo se připojte k existujícímu
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setJoinDialogOpen(true)} className="gap-2">
                    <Users className="h-4 w-4" />
                    Přidat se k závodu
                  </Button>
                  <Button onClick={() => router.push("/competitions/create")}>
                    Vytvořit závod
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitions.map((comp) => {
                const status = getCompetitionStatus(comp);
                const StatusIcon = status.icon;

                return (
                  <Card
                    key={comp.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/competitions/${comp.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <CardTitle className="font-serif text-xl">{comp.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">
                          {comp.scoring_type === "points" ? "🏆 Bodování" : "📏 Míry"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(comp.start_date), "d. MMM", { locale: cs })} -{" "}
                            {format(new Date(comp.end_date), "d. MMM yyyy", { locale: cs })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Kód:</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {comp.join_code || comp.invite_code}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}