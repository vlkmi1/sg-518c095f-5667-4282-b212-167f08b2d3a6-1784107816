import { useState, useEffect } from "react";
import { catchService } from "@/services/catchService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, MapPin, Calendar, Ruler, Weight } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface TopCatch {
  id: string;
  species: string;
  length_cm: number;
  weight_kg: number;
  photo_url: string;
  caught_at: string;
  country: string | null;
  region: string | null;
  district: string | null;
  fishing_area: string | null;
  profiles: {
    nickname: string;
  };
}

const SPECIES_DATA: Record<string, { image: string; color: string }> = {
  "Kapr": { 
    image: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=100&h=100&fit=crop", 
    color: "hsl(35, 50%, 50%)" 
  },
  "Amur": { 
    image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=100&h=100&fit=crop", 
    color: "hsl(150, 45%, 45%)" 
  },
  "Sumec": { 
    image: "https://images.unsplash.com/photo-1590923188069-70d0c8f2d765?w=100&h=100&fit=crop", 
    color: "hsl(220, 40%, 35%)" 
  },
  "Štika": { 
    image: "https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=100&h=100&fit=crop", 
    color: "hsl(140, 45%, 40%)" 
  },
  "Candát": { 
    image: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=100&h=100&fit=crop", 
    color: "hsl(200, 50%, 45%)" 
  },
  "Pstruh": { 
    image: "https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=100&h=100&fit=crop", 
    color: "hsl(280, 50%, 55%)" 
  },
  "Úhoř": { 
    image: "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=100&h=100&fit=crop", 
    color: "hsl(40, 30%, 40%)" 
  },
  "Lín": { 
    image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=100&h=100&fit=crop", 
    color: "hsl(110, 45%, 40%)" 
  },
  "Plotice": { 
    image: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=100&h=100&fit=crop", 
    color: "hsl(0, 0%, 60%)" 
  },
  "Cejn": { 
    image: "https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=100&h=100&fit=crop", 
    color: "hsl(210, 50%, 50%)" 
  },
  "Jelec": { 
    image: "https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=100&h=100&fit=crop", 
    color: "hsl(45, 70%, 55%)" 
  },
  "Ostroretka": { 
    image: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=100&h=100&fit=crop", 
    color: "hsl(30, 60%, 50%)" 
  },
  "Bolen": { 
    image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=100&h=100&fit=crop", 
    color: "hsl(50, 60%, 55%)" 
  },
  "Mník": { 
    image: "https://images.unsplash.com/photo-1590923188069-70d0c8f2d765?w=100&h=100&fit=crop", 
    color: "hsl(5, 60%, 50%)" 
  },
};

const FISH_SPECIES = [
  { value: "Kapr", label: "Kapr", image: "/Kapr.webp" },
  { value: "Amur", label: "Amur", image: "/amur.webp" },
  { value: "Sumec", label: "Sumec", image: "/Sumec.webp" },
  { value: "Štika", label: "Štika", image: "/Stika.webp" },
  { value: "Candát", label: "Candát", image: "/candat.webp" },
  { value: "Pstruh", label: "Pstruh", image: "/Pstruh.webp" },
  { value: "Úhoř", label: "Úhoř", image: "/Uhor.webp" },
  { value: "Lín", label: "Lín", image: "/lin.webp" },
  { value: "Plotice", label: "Plotice", image: "/plotice.webp" },
  { value: "Cejn", label: "Cejn", image: "/Cejn.webp" },
  { value: "Jelec", label: "Jelec", image: "/Jelec.webp" },
  { value: "Okoun", label: "Okoun", image: "/okoun.webp" },
  { value: "Bolen", label: "Bolen", image: "/Bolen.webp" },
  { value: "Mník", label: "Mník", image: "/Mnik.webp" },
  { value: "Perlin", label: "Perlin", image: "/Perlin.webp" },
  { value: "Síven", label: "Síven", image: "/Siven.webp" },
  { value: "Jeseter", label: "Jeseter", image: "/Jeseter.webp" },
];

const MEDAL_CONFIG = {
  1: {
    medal: "🥇",
    color: "bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600",
    textColor: "text-yellow-900",
    height: "h-48",
    order: 2,
  },
  2: {
    medal: "🥈",
    color: "bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500",
    textColor: "text-gray-900",
    height: "h-36",
    order: 1,
  },
  3: {
    medal: "🥉",
    color: "bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600",
    textColor: "text-orange-900",
    height: "h-28",
    order: 3,
  },
};

export function HallOfFame() {
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>("Kapr");
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year" | "all">("all");
  const [topCatches, setTopCatches] = useState<TopCatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTopCatches();
  }, [selectedSpecies, selectedPeriod]);

  async function loadTopCatches() {
    setIsLoading(true);
    try {
      const catches = await catchService.getTopCatchesBySpeciesAndPeriod(
        selectedSpecies || "Kapr", 
        selectedPeriod,
        3
      );
      setTopCatches(catches as TopCatch[]);
    } catch (error) {
      console.error("Error loading top catches:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function renderPodium(catches: TopCatch[]) {
    if (catches.length === 0) {
      const periodText = 
        selectedPeriod === "week" ? "tento týden" :
        selectedPeriod === "month" ? "tento měsíc" :
        selectedPeriod === "year" ? "tento rok" :
        "v historii";
      
      return (
        <div className="text-center py-16">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Zatím žádné úlovky druhu {selectedSpecies || "Všechny druhy"} {periodText}
          </p>
        </div>
      );
    }

    // Build podium based on number of catches
    // Always show catches in their actual ranking order (1st, 2nd, 3rd)
    const podiumData: Array<{ catch: TopCatch; position: 1 | 2 | 3; order: number }> = [];
    
    if (catches.length >= 1) {
      podiumData.push({ catch: catches[0], position: 1, order: 2 }); // 1st place center
    }
    if (catches.length >= 2) {
      podiumData.push({ catch: catches[1], position: 2, order: 1 }); // 2nd place left
    }
    if (catches.length >= 3) {
      podiumData.push({ catch: catches[2], position: 3, order: 3 }); // 3rd place right
    }

    return (
      <div className="flex items-end justify-center gap-4 sm:gap-8 max-w-4xl mx-auto py-8" suppressHydrationWarning>
        {podiumData.map(({ catch: catchData, position, order }) => {
          const config = MEDAL_CONFIG[position];

          return (
            <div
              key={catchData.id}
              className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8"
              style={{ 
                animationDelay: `${position * 100}ms`,
                order: order
              }}
            >
              {/* Fish photo on top of podium */}
              <div className="relative mb-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-background shadow-xl relative">
                  <img
                    src={catchData.photo_url}
                    alt={catchData.species}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Medal badge */}
                <div className="absolute -top-2 -right-2 text-4xl sm:text-5xl drop-shadow-lg">
                  {config.medal}
                </div>
              </div>

              {/* Catch info */}
              <Card className="w-full mb-2 bg-background/80 backdrop-blur">
                <CardContent className="p-3 text-center space-y-1">
                  <p className="font-serif font-semibold text-sm sm:text-base">
                    {catchData.profiles?.nickname || "Anonym"}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    {catchData.length_cm && (
                      <Badge variant="secondary" className="gap-1">
                        <span className="text-xs">📏</span>
                        {catchData.length_cm} cm
                      </Badge>
                    )}
                    {catchData.weight_kg && (
                      <Badge variant="secondary" className="gap-1">
                        <span className="text-xs">⚖️</span>
                        {catchData.weight_kg} kg
                      </Badge>
                    )}
                  </div>
                  {catchData.fishing_area && (
                    <p className="text-xs text-muted-foreground truncate">
                      📍 {catchData.fishing_area}
                    </p>
                  )}
                  {catchData.caught_at && (
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {format(new Date(catchData.caught_at), "d. MMM yyyy", { locale: cs })}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Podium block */}
              <div
                className={`w-full ${config.height} ${config.color} rounded-t-lg shadow-lg flex flex-col items-center justify-center p-4 relative overflow-hidden`}
              >
                {/* Podium number */}
                <div className={`text-6xl sm:text-8xl font-bold ${config.textColor} opacity-20 absolute`}>
                  {position}
                </div>
                <div className="relative z-10 text-center">
                  <div className="text-3xl sm:text-4xl mb-1">{config.medal}</div>
                  <div className={`text-xl sm:text-2xl font-bold ${config.textColor}`}>
                    {position}.
                  </div>
                  <div className={`text-xs sm:text-sm font-medium ${config.textColor} opacity-80`}>
                    místo
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">Síň slávy</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Nejlepší úlovky podle druhu ryby
        </p>
      </div>

      {/* Time Period Filter */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button
          variant={selectedPeriod === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPeriod("week")}
          className="gap-2 rounded-full transition-all"
        >
          📅 Hrdinové týdne
        </Button>
        <Button
          variant={selectedPeriod === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPeriod("month")}
          className="gap-2 rounded-full transition-all"
        >
          📆 Hrdinové měsíce
        </Button>
        <Button
          variant={selectedPeriod === "year" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPeriod("year")}
          className="gap-2 rounded-full transition-all"
        >
          🗓️ Hrdinové roku
        </Button>
        <Button
          variant={selectedPeriod === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPeriod("all")}
          className="gap-2 rounded-full transition-all"
        >
          🏆 Historie
        </Button>
      </div>

      {/* Species Filter */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {FISH_SPECIES.map((species) => (
          <Button
            key={species.value}
            variant={selectedSpecies === species.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSpecies(species.value)}
            className="gap-2 h-10 px-4 rounded-full transition-all"
          >
            <img 
              src={species.image} 
              alt={species.label}
              className="h-5 w-5 object-cover rounded-full"
            />
            {species.label}
          </Button>
        ))}
      </div>

      {/* Podium */}
      <div className="bg-muted/30 rounded-lg p-4 sm:p-8" suppressHydrationWarning>
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        ) : (
          renderPodium(topCatches)
        )}
      </div>
    </div>
  );
}