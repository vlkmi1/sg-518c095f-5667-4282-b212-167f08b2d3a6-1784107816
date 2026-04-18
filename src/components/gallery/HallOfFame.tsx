import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { catchService } from "@/services/catchService";
import { Trophy, Ruler, Weight, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

const FISH_SPECIES = [
  { value: "Kapr", label: "Kapr", emoji: "🐟" },
  { value: "Amur", label: "Amur", emoji: "🐠" },
  { value: "Sumec", label: "Sumec", emoji: "🐡" },
  { value: "Štika", label: "Štika", emoji: "🦈" },
  { value: "Candát", label: "Candát", emoji: "🐟" },
  { value: "Pstruh", label: "Pstruh", emoji: "🐠" },
];

const PODIUM_COLORS = {
  1: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950",
  2: "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-950",
  3: "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-950",
};

const PODIUM_ICONS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function HallOfFame() {
  const [selectedSpecies, setSelectedSpecies] = useState("Kapr");
  const [topCatches, setTopCatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopCatches();
  }, [selectedSpecies]);

  async function loadTopCatches() {
    setIsLoading(true);
    try {
      const catches = await catchService.getTopCatchesBySpecies(selectedSpecies, 3);
      setTopCatches(catches);
    } catch (error) {
      console.error("Error loading top catches:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h2 className="font-serif text-3xl font-bold text-primary">Síň slávy</h2>
        </div>
        <p className="text-muted-foreground">Největší úlovky v jednotlivých kategoriích</p>
      </div>

      <Tabs value={selectedSpecies} onValueChange={setSelectedSpecies} className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
          {FISH_SPECIES.map((species) => (
            <TabsTrigger key={species.value} value={species.value} className="gap-1.5">
              <span className="text-base">{species.emoji}</span>
              <span className="hidden sm:inline">{species.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 animate-pulse text-muted-foreground/30" />
          <p>Načítání nejlepších úlovků...</p>
        </div>
      ) : topCatches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p>Zatím zde nejsou žádné úlovky druhu {selectedSpecies}</p>
          <p className="text-sm mt-1">Buďte první, kdo přidá tento druh!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topCatches.map((catchData, index) => {
            const position = (index + 1) as 1 | 2 | 3;
            const caughtDate = catchData.caught_at ? new Date(catchData.caught_at) : null;

            return (
              <Card 
                key={catchData.id} 
                className={`overflow-hidden border-2 ${
                  position === 1 ? "border-yellow-400 shadow-lg" :
                  position === 2 ? "border-gray-400" :
                  "border-amber-600"
                }`}
              >
                <CardHeader className={`pb-3 ${PODIUM_COLORS[position]}`}>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{PODIUM_ICONS[position]}</span>
                      <span>{position}. místo</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                
                <div className="aspect-[4/3] relative bg-muted">
                  {catchData.photo_url && (
                    <img
                      src={catchData.photo_url}
                      alt={catchData.species || "Úlovek"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      {catchData.species}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {catchData.profiles?.nickname || "Anonym"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
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

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {catchData.country && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {[catchData.fishing_area, catchData.district, catchData.region, catchData.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {caughtDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {format(caughtDate, "d. MMMM yyyy", { locale: cs })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}