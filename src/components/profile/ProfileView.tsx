import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { catchService } from "@/services/catchService";
import { competitionService } from "@/services/competitionService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Fish, MapPin, Calendar, Award, Ruler, Weight, Eye, EyeOff, Trash2, User, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  nickname: string;
  email: string;
  avatar_url?: string;
}

interface Catch {
  id: string;
  species: string;
  length_cm: number | null;
  weight_kg: number | null;
  photo_url: string;
  caught_at: string;
  country: string | null;
  region: string | null;
  district: string | null;
  fishing_area: string | null;
  bait_brand: string | null;
  is_public: boolean;
}

export function ProfileView() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [catches, setCatches] = useState<Catch[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [catchToDelete, setCatchToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profileData } = await profileService.getProfileById(user.id);
      setProfile(profileData as any);

      const userCatches = await catchService.getUserCatches(user.id);
      setCatches(userCatches);

      const userComps = await competitionService.getUserCompetitions(user.id);
      setCompetitions(userComps);
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

  async function handleDeleteCatch() {
    if (!catchToDelete) return;

    try {
      const { error } = await catchService.deleteCatch(catchToDelete);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "✅ Úlovek odstraněn",
        description: "Úlovek byl úspěšně smazán",
      });

      // Refresh catches list
      setCatches(catches.filter(c => c.id !== catchToDelete));
    } catch (error: any) {
      console.error("Delete catch error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odstranit úlovek",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCatchToDelete(null);
    }
  }

  function openDeleteDialog(catchId: string) {
    setCatchToDelete(catchId);
    setDeleteDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalCatches = catches.length;
  const avgLength = catches.length > 0
    ? catches.filter(c => c.length_cm).reduce((sum, c) => sum + (c.length_cm || 0), 0) / catches.filter(c => c.length_cm).length
    : 0;
  const biggestCatch = catches.reduce((max, c) => {
    const currentWeight = c.weight_kg || c.length_cm || 0;
    const maxWeight = max.weight_kg || max.length_cm || 0;
    return currentWeight > maxWeight ? c : max;
  }, catches[0]);

  return (
    <div className="container py-8 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="font-serif text-2xl">
                  {profile?.nickname || "Anonym"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <Link href="/profile/add-catch">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Přidat úlovek
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Fish className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold font-serif">{totalCatches}</p>
                <p className="text-sm text-muted-foreground">Úlovků celkem</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Ruler className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold font-serif">
                  {avgLength > 0 ? avgLength.toFixed(1) : "—"}
                </p>
                <p className="text-sm text-muted-foreground">Průměrná délka (cm)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Weight className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold font-serif">
                  {biggestCatch?.weight_kg ? `${biggestCatch.weight_kg} kg` : biggestCatch?.length_cm ? `${biggestCatch.length_cm} cm` : "—"}
                </p>
                <p className="text-sm text-muted-foreground">Největší úlovek</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Catches */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Moje úlovky</CardTitle>
        </CardHeader>
        <CardContent>
          {catches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-4">
              <Fish className="h-16 w-16 mx-auto text-muted-foreground/30" />
              <div>
                <p className="text-lg font-medium">Zatím žádné úlovky</p>
                <p className="text-sm">Přidejte svůj první úlovek!</p>
              </div>
              <Link href="/profile/add-catch">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Přidat úlovek
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catches.map((catchData) => (
                <Link
                  key={catchData.id}
                  href={`/catches/${catchData.id}`}
                  className="group block"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
                    <div className="aspect-[4/3] relative bg-muted">
                      {catchData.photo_url && (
                        <img
                          src={catchData.photo_url}
                          alt={catchData.species || "Úlovek"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          openDeleteDialog(catchData.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-lg font-semibold">
                          {catchData.species || "Neznámý druh"}
                        </h3>
                        <Badge variant="outline" className="flex gap-1 items-center">
                          {catchData.is_public ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </Badge>
                      </div>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        {catchData.length_cm && (
                          <span>{catchData.length_cm} cm</span>
                        )}
                        {catchData.weight_kg && (
                          <span>• {catchData.weight_kg} kg</span>
                        )}
                      </div>
                      {catchData.caught_at && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(catchData.caught_at), "d. MMMM yyyy", { locale: cs })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-2xl text-primary flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Moje závody
            </CardTitle>
            <Link href="/competitions/create">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nový závod
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {competitions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm">Zatím nemáte žádné závody</p>
              <p className="text-xs mt-1">Založte si přátelský závod nebo se připojte k existujícímu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {competitions.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/competitions/${comp.id}`}
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{comp.name}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Kód: {comp.invite_code}</span>
                        {comp.prize_type === "beer" && <span>🍺 O pivo</span>}
                        {comp.prize_type === "bottle" && <span>🍾 O láhev</span>}
                        {comp.prize_type === "none" && <span>O čest</span>}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(comp.end_date) > new Date() ? "Probíhá" : "Ukončeno"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odstranit úlovek?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Úlovek a fotografie budou trvale odstraněny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCatch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Odstranit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}