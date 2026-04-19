import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { catchService } from "@/services/catchService";
import { competitionService } from "@/services/competitionService";
import { useToast } from "@/hooks/use-toast";
import { User, Fish, Trophy, LogOut, Plus, Users, Loader2, Edit } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export function ProfileView() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [catchCount, setCatchCount] = useState(0);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      setUser(currentUser);

      const { data: profileData } = await profileService.getProfileById(currentUser.id);
      setProfile(profileData);

      const catchesData = await catchService.getUserCatches(currentUser.id);
      setCatchCount((catchesData || []).length);

      const comps = await competitionService.getUserCompetitions(currentUser.id);
      setCompetitions(comps || []);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst profil",
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

  async function handleLogout() {
    await authService.signOut();
    router.push("/");
  }

  function handleProfileUpdated() {
    setEditDialogOpen(false);
    loadProfile();
  }

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="font-serif text-2xl mb-1">
                  {profile?.nickname || "Rybář"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Upravit profil
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif">Upravit profil</DialogTitle>
                    <DialogDescription>
                      Změňte svůj nickname nebo jiné informace
                    </DialogDescription>
                  </DialogHeader>
                  <EditProfileForm
                    profile={profile}
                    onSuccess={handleProfileUpdated}
                  />
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => router.push("/my-catches")}>
                Moje úlovky
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Odhlásit se
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{catchCount}</p>
              <p className="text-sm text-muted-foreground">Úlovků celkem</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{competitions.length}</p>
              <p className="text-sm text-muted-foreground">Závodů</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Competitions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Moje závody
            </CardTitle>
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
        </CardHeader>
        <CardContent>
          {competitions.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">Zatím nejste v žádném závodu</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setJoinDialogOpen(true)}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Přidat se k závodu
                </Button>
                <Button onClick={() => router.push("/competitions/create")}>
                  Vytvořit závod
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitions.map((comp) => (
                <Card
                  key={comp.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/competitions/${comp.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">{comp.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Kód:</span>
                      <Badge variant="outline" className="font-mono">
                        {comp.join_code || comp.invite_code || "N/A"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">
                        {comp.scoring_type === "points" ? "🏆 Bodování" : "📏 Míry"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(comp.start_date), "d. MMM", { locale: cs })} -{" "}
                      {format(new Date(comp.end_date), "d. MMM yyyy", { locale: cs })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}