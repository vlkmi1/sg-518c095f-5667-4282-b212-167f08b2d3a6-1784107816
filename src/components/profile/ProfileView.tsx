import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [biggestCatch, setBiggestCatch] = useState<any>(null);
  const [heaviestCatch, setHeaviestCatch] = useState<any>(null);
  const [winsCount, setWinsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  // Show install guide toast if app is not installed
  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                         (window.navigator as any).standalone === true;

    if (!isStandalone) {
      // Check if user has already seen the install guide
      const hasSeenInstallGuide = localStorage.getItem("hasSeenInstallGuide");

      if (!hasSeenInstallGuide) {
        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        let installGuide = "";

        if (isIOS) {
          installGuide = "💡 Tip: Nainstalujte aplikaci na plochu! Safari → Sdílet → Přidat na plochu";
        } else if (isAndroid) {
          installGuide = "💡 Tip: Nainstalujte aplikaci na plochu! Menu (⋮) → Nainstalovat aplikaci";
        } else {
          installGuide = "💡 Tip: Nainstalujte aplikaci na plochu! Klikněte na ikonu instalace v adresním řádku";
        }

        // Show toast after a short delay
        setTimeout(() => {
          toast({
            title: "Ukaž Rybu na vaší ploše",
            description: installGuide,
            duration: 10000, // 10 seconds
          });

          // Mark as seen
          localStorage.setItem("hasSeenInstallGuide", "true");
        }, 2000);
      }
    }
  }, [toast]);

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

      // Load statistics
      const biggestCatchData = await catchService.getUserBiggestCatch(currentUser.id);
      setBiggestCatch(biggestCatchData);

      const heaviestCatchData = await catchService.getUserHeaviestCatch(currentUser.id);
      setHeaviestCatch(heaviestCatchData);

      const wins = await competitionService.getUserWinsCount(currentUser.id);
      setWinsCount(wins);
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
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="font-serif text-2xl mb-1">
                  {profile?.nickname || "Rybář"}
                </CardTitle>
                {profile?.full_name && (
                  <p className="text-sm font-medium text-muted-foreground">
                    {profile.full_name}
                  </p>
                )}
                {profile?.location && (
                  <p className="text-xs text-muted-foreground">📍 {profile.location}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Upravit profil</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-serif">Upravit profil</DialogTitle>
                    <DialogDescription>
                      Změňte svůj nickname, fotku nebo jiné informace
                    </DialogDescription>
                  </DialogHeader>
                  <EditProfileForm
                    profile={profile}
                    onSave={handleProfileUpdated}
                    onCancel={() => setEditDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => router.push("/my-catches")} className="hidden sm:inline-flex">
                Moje úlovky
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Odhlásit se</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">📊 Statistiky</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Catches */}
            <div 
              className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => router.push("/my-catches")}
            >
              <Fish className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-primary mb-1">{catchCount}</p>
              <p className="text-sm text-muted-foreground">Celkem úlovků</p>
            </div>

            {/* Biggest Catch */}
            <div 
              className="text-center p-4 bg-accent/5 rounded-lg border border-accent/10 cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => router.push("/my-catches")}
            >
              <Trophy className="h-8 w-8 mx-auto mb-2 text-accent" />
              {biggestCatch ? (
                <>
                  <p className="text-3xl font-bold text-accent mb-1">
                    {biggestCatch.length_cm} cm
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Největší ryba
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {biggestCatch.species}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-accent/50 mb-1">-</p>
                  <p className="text-sm text-muted-foreground">Největší ryba</p>
                </>
              )}
            </div>

            {/* Heaviest Catch */}
            <div 
              className="text-center p-4 bg-accent/5 rounded-lg border border-accent/10 cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => router.push("/my-catches")}
            >
              <Trophy className="h-8 w-8 mx-auto mb-2 text-accent" />
              {heaviestCatch ? (
                <>
                  <p className="text-3xl font-bold text-accent mb-1">
                    {heaviestCatch.weight_kg} kg
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nejtěžší ryba
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {heaviestCatch.species}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-accent/50 mb-1">-</p>
                  <p className="text-sm text-muted-foreground">Nejtěžší ryba</p>
                </>
              )}
            </div>

            {/* Competition Wins */}
            <div 
              className="text-center p-4 bg-secondary/5 rounded-lg border border-secondary/10 cursor-pointer hover:bg-secondary/10 transition-colors"
              onClick={() => router.push("/competitions")}
            >
              <Trophy className="h-8 w-8 mx-auto mb-2 text-secondary" />
              <p className="text-3xl font-bold text-secondary mb-1">{winsCount}</p>
              <p className="text-sm text-muted-foreground">Výhry v závodech</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Catch CTA */}
      <Button
        size="lg"
        onClick={() => router.push("/profile/add-catch")}
        className="w-full h-16 text-lg gap-3"
      >
        <Fish className="h-6 w-6" />
        Přidat úlovek
      </Button>

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
                    <span className="hidden sm:inline">Přidat se k závodu</span>
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
                <span className="hidden sm:inline">Nový závod</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}