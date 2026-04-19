import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/layout/Header";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { authService } from "@/services/authService";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";
import { Fish, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export default function MyCatchesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [catches, setCatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserCatches();
    }
  }, [user]);

  async function loadUserCatches() {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await catchService.getUserCatches(user.id);

      if (error) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se načíst vaše úlovky",
          variant: "destructive",
        });
        return;
      }

      // Filter out competition catches - they should not appear in personal catches
      const personalCatches = (data || []).filter(
        (c: any) => !c.competition_id
      );

      console.log("Personal catches loaded:", personalCatches.length);
      console.log("Filtered out competition catches");

      setCatches(personalCatches);
    } catch (error) {
      console.error("Error loading catches:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteCatch(catchId: string, photoPath: string) {
    if (!confirm("Opravdu chcete odstranit tento úlovek?")) {
      return;
    }

    try {
      await storageService.deleteCatchImage(photoPath);
      await catchService.deleteCatch(catchId);

      toast({
        title: "✅ Úlovek odstraněn",
        description: "Úlovek byl úspěšně smazán",
      });

      loadCatches();
    } catch (error: any) {
      console.error("Delete catch error:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se odstranit úlovek",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <>
        <SEO title="Moje úlovky" />
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container py-8">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Moje úlovky" />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                  <Fish className="h-6 w-6 text-primary" />
                  Moje úlovky
                </CardTitle>
                <Button onClick={() => router.push("/profile/add-catch")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Přidat úlovek
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {catches.length === 0 ? (
                <div className="text-center py-12">
                  <Fish className="h-20 w-20 mx-auto mb-6 text-muted-foreground/30" />
                  <h3 className="font-serif text-xl mb-2">Zatím nemáte žádné úlovky</h3>
                  <p className="text-muted-foreground mb-6">
                    Přidejte svůj první úlovek a sdílejte ho s komunitou rybářů
                  </p>
                  <Button onClick={() => router.push("/profile/add-catch")} size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Přidat první úlovek
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-muted-foreground">
                      Celkem <strong className="text-foreground">{catches.length}</strong>{" "}
                      {catches.length === 1 ? "úlovek" : catches.length < 5 ? "úlovky" : "úlovků"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catches.map((catchData) => (
                      <Card key={catchData.id} className="overflow-hidden group">
                        <div className="aspect-video relative">
                          <img
                            src={catchData.photo_url}
                            alt={catchData.species}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            {catchData.is_public ? (
                              <Badge className="bg-green-500/90 backdrop-blur">
                                Veřejné
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-muted/80 backdrop-blur"
                              >
                                Soukromé
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <h3 className="font-serif font-semibold text-lg">
                            {catchData.species}
                          </h3>
                          
                          <div className="flex flex-wrap gap-2">
                            {catchData.length_cm && (
                              <Badge variant="secondary" className="gap-1">
                                📏 {catchData.length_cm} cm
                              </Badge>
                            )}
                            {catchData.weight_kg && (
                              <Badge variant="secondary" className="gap-1">
                                ⚖️ {catchData.weight_kg} kg
                              </Badge>
                            )}
                          </div>

                          {catchData.fishing_area && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              📍 {catchData.fishing_area}
                            </p>
                          )}

                          {catchData.bait_brand && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              🎣 {catchData.bait_brand}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground">
                            {format(new Date(catchData.caught_at), "d. MMMM yyyy HH:mm", {
                              locale: cs,
                            })}
                          </p>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteCatch(catchData.id, catchData.photo_path)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Odstranit
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}