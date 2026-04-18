import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { catchService } from "@/services/catchService";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Fish, Ruler, Weight, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export function ProfileView() {
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [catches, setCatches] = useState<Tables<"catches">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await profileService.getProfileById(user.id);
      if (profileData) {
        setProfile(profileData);
      }

      // Load user's catches
      const userCatches = await catchService.getUserCatches(user.id);
      setCatches(userCatches);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
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
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] relative bg-muted">
                      {catchData.photo_url && (
                        <img
                          src={catchData.photo_url}
                          alt={catchData.species || "Úlovek"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-serif text-lg font-semibold">
                        {catchData.species || "Neznámý druh"}
                      </h3>
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
    </div>
  );
}