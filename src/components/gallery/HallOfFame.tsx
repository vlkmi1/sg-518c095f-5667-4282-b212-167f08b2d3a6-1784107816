import { useState, useEffect } from "react";
import { catchService } from "@/services/catchService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

const SPECIES_DATA: Record<string, { emoji: string; color: string }> = {
  "Kapr": { emoji: "🐟", color: "hsl(35, 50%, 50%)" },
  "Amur": { emoji: "🐠", color: "hsl(150, 45%, 45%)" },
  "Sumec": { emoji: "🦈", color: "hsl(220, 40%, 35%)" },
  "Štika": { emoji: "🐊", color: "hsl(140, 45%, 40%)" },
  "Candát": { emoji: "🦎", color: "hsl(200, 50%, 45%)" },
  "Pstruh": { emoji: "🌈", color: "hsl(280, 50%, 55%)" },
  "Úhoř": { emoji: "🐍", color: "hsl(40, 30%, 40%)" },
  "Lín": { emoji: "🟢", color: "hsl(110, 45%, 40%)" },
  "Plotice": { emoji: "⚪", color: "hsl(0, 0%, 60%)" },
  "Cejn": { emoji: "🔵", color: "hsl(210, 50%, 50%)" },
  "Jelec": { emoji: "⚡", color: "hsl(45, 70%, 55%)" },
  "Ostroretka": { emoji: "🔶", color: "hsl(30, 60%, 50%)" },
  "Bolen": { emoji: "🟡", color: "hsl(50, 60%, 55%)" },
  "Mník": { emoji: "🔴", color: "hsl(5, 60%, 50%)" },
};

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

const FISH_SPECIES = [
  { value: "Kapr", label: "Kapr", emoji: "🐟" },
  { value: "Amur", label: "Amur", emoji: "🐠" },
  { value: "Sumec", label: "Sumec", emoji: "🐡" },
  { value: "Štika", label: "Štika", emoji: "🦈" },
  { value: "Candát", label: "Candát", emoji: "🐟" },
  { value: "Pstruh", label: "Pstruh", emoji: "🐠" },
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
  const [selectedSpecies, setSelectedSpecies] = useState("Kapr");
  const [topCatches, setTopCatches] = useState<TopCatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTopCatches();
  }, [selectedSpecies]);

  async function loadTopCatches() {
    setIsLoading(true);
    try {
      const catches = await catchService.getTopCatchesBySpecies(selectedSpecies, 3);
      setTopCatches(catches as TopCatch[]);
    } catch (error) {
      console.error("Error loading top catches:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function renderPodium(catches: TopCatch[]) {
    if (catches.length === 0) {
      return (
        <div className="text-center py-16">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Zatím žádné úlovky druhu {selectedSpecies}
          </p>
        </div>
      );
    }

    // Prepare podium positions: [2nd, 1st, 3rd]
    const podiumOrder = [
      catches[1], // 2nd place (left)
      catches[0], // 1st place (center)
      catches[2], // 3rd place (right)
    ].filter(Boolean);

    return (
      <div className="flex items-end justify-center gap-4 sm:gap-8 max-w-4xl mx-auto py-8">
        {podiumOrder.map((catchData, idx) => {
          if (!catchData) return null;
          
          const position = idx === 0 ? 2 : idx === 1 ? 1 : 3;
          const config = MEDAL_CONFIG[position as keyof typeof MEDAL_CONFIG];

          return (
            <div
              key={catchData.id}
              className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8"
              style={{ 
                animationDelay: `${position * 100}ms`,
                order: config.order 
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
                        <Ruler className="h-3 w-3" />
                        {catchData.length_cm} cm
                      </Badge>
                    )}
                    {catchData.weight_kg && (
                      <Badge variant="secondary" className="gap-1">
                        <Weight className="h-3 w-3" />
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
                    <p className="text-xs text-muted-foreground">
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
                    {position === 1 ? "1." : position === 2 ? "2." : "3."}
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
    <div className="space-y-6">
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

      {/* Species Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={selectedSpecies === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedSpecies(null)}
          className="gap-2"
        >
          🏆 Všechny druhy
        </Button>
        {availableSpecies.map((species) => {
          const speciesData = SPECIES_DATA[species] || { emoji: "🐟", color: "hsl(186, 78%, 22%)" };
          return (
            <Button
              key={species}
              variant={selectedSpecies === species ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSpecies(species)}
              className="gap-2"
              style={
                selectedSpecies === species
                  ? { backgroundColor: speciesData.color, borderColor: speciesData.color }
                  : {}
              }
            >
              <span className="text-lg">{speciesData.emoji}</span>
              {species}
            </Button>
          );
        })}
      </div>

      {/* Podium */}
      <div className="bg-muted/30 rounded-lg p-4 sm:p-8">
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