import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/layout/Header";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { catchService } from "@/services/catchService";
import { Fish, MapPin, Calendar, Share2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function CatchDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();

  const [catchData, setCatchData] = useState<Tables<"catches"> | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadCatchDetail(id);
    }
  }, [id]);

  async function loadCatchDetail(catchId: string) {
    setIsLoading(true);
    try {
      const data = await catchService.getCatchById(catchId);
      
      if (data) {
        setCatchData(data.catch);
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Error loading catch:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst úlovek",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShare() {
    if (!catchData) return;

    const shareUrl = `${window.location.origin}/catch/${catchData.id}`;
    const shareText = `Podívejte se na můj úlovek: ${catchData.species}${catchData.length_cm ? ` (${catchData.length_cm} cm)` : ""}${catchData.weight_kg ? ` (${catchData.weight_kg.toFixed(2)} kg)` : ""}`;

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${catchData.species} - Ukaž Rybu`,
          text: shareText,
          url: shareUrl,
        });
        
        toast({
          title: "✅ Sdíleno",
          description: "Úlovek byl úspěšně sdílen",
        });
      } catch (error: any) {
        // User cancelled share or error occurred
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "📋 Odkaz zkopírován",
          description: "Odkaz na úlovek byl zkopírován do schránky",
        });
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast({
          title: "Chyba",
          description: "Nepodařilo se zkopírovat odkaz",
          variant: "destructive",
        });
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title="Načítání úlovku..."
          description="Detail úlovku se načítá"
        />
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-96 w-full rounded-lg mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </main>
      </div>
    );
  }

  if (!catchData) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title="Úlovek nenalezen"
          description="Požadovaný úlovek nebyl nalezen"
        />
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <Fish className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-serif font-bold mb-2">Úlovek nenalezen</h2>
              <p className="text-muted-foreground mb-6">
                Požadovaný úlovek neexistuje nebo byl smazán.
              </p>
              <Link href="/">
                <Button>Zpět na hlavní stránku</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${catchData.species} - ${profile?.nick || "Úlovek"}`}
        description={`${catchData.species}${catchData.length_cm ? ` (${catchData.length_cm} cm)` : ""}${catchData.weight_kg ? ` (${catchData.weight_kg.toFixed(2)} kg)` : ""} - ${catchData.fishing_area || catchData.district || "Ukaž Rybu"}`}
        image={catchData.photo_url}
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zpět
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {/* Photo */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg">
              <Image
                src={catchData.photo_url}
                alt={catchData.species}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Details */}
            <div className="p-6 space-y-6">
              {/* Header with Share button */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-serif text-3xl font-bold mb-2">{catchData.species}</h1>
                  <p className="text-muted-foreground">
                    Ulovil: <span className="font-medium text-foreground">{profile?.nick || "Anonym"}</span>
                  </p>
                </div>
                <Button onClick={handleShare} variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Sdílet
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {catchData.length_cm && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Délka</p>
                    <p className="text-2xl font-bold">{catchData.length_cm} cm</p>
                  </div>
                )}
                {catchData.weight_kg && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Hmotnost</p>
                    <p className="text-2xl font-bold">{catchData.weight_kg.toFixed(2)} kg</p>
                  </div>
                )}
              </div>

              {/* Date */}
              {catchData.caught_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(catchData.caught_at), "d. MMMM yyyy, HH:mm", { locale: cs })}
                  </span>
                </div>
              )}

              {/* Location */}
              {(catchData.country || catchData.region || catchData.district || catchData.fishing_area) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium text-foreground">Místo</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    {catchData.fishing_area && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Revír:</span>{" "}
                        <span className="font-medium">{catchData.fishing_area}</span>
                      </p>
                    )}
                    {catchData.district && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Okres:</span>{" "}
                        <span className="font-medium">{catchData.district}</span>
                      </p>
                    )}
                    {catchData.region && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Kraj:</span>{" "}
                        <span className="font-medium">{catchData.region}</span>
                      </p>
                    )}
                    {catchData.country && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Stát:</span>{" "}
                        <span className="font-medium">{catchData.country}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Bait */}
              {catchData.bait_brand && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Značka nástrahy</p>
                  <Badge variant="secondary">{catchData.bait_brand}</Badge>
                </div>
              )}

              {/* Notes */}
              {catchData.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Poznámky</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                    {catchData.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}