import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { competitionService } from "@/services/competitionService";
import { Loader2, Trophy, Plus, X } from "lucide-react";
import { format } from "date-fns";

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

export function CreateCompetitionForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState(
    format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );
  const [endTime, setEndTime] = useState("23:59");
  const [scoringType, setScoringType] = useState<"points" | "measurements">("points");
  const [autoJoin, setAutoJoin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Points scoring configuration
  const [fishPoints, setFishPoints] = useState<Array<{ species: string; points: number }>>([
    { species: "Kapr", points: 10 },
  ]);

  // Measurements scoring configuration
  const [measurementType, setMeasurementType] = useState<"weight" | "length" | "both">("both");
  const [topCatchesCount, setTopCatchesCount] = useState<number | null>(null);

  function addFishPoints() {
    const availableSpecies = FISH_SPECIES.filter(
      (fish) => !fishPoints.some((fp) => fp.species === fish.value)
    );
    if (availableSpecies.length > 0) {
      setFishPoints([...fishPoints, { species: availableSpecies[0].value, points: 1 }]);
    }
  }

  function removeFishPoints(index: number) {
    setFishPoints(fishPoints.filter((_, i) => i !== index));
  }

  function updateFishPoints(index: number, field: "species" | "points", value: string | number) {
    const updated = [...fishPoints];
    if (field === "species") {
      updated[index].species = value as string;
    } else {
      updated[index].points = Number(value);
    }
    setFishPoints(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Chybí název",
        description: "Zadejte název závodu",
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);

    if (endDateTime <= startDateTime) {
      toast({
        title: "Neplatné datum",
        description: "Konec závodu musí být po začátku",
        variant: "destructive",
      });
      return;
    }

    if (scoringType === "points" && fishPoints.length === 0) {
      toast({
        title: "Chybí bodování",
        description: "Přidejte alespoň jeden druh ryby s bodovou hodnotou",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error("Uživatel není přihlášen");
      }

      // Prepare fish points as JSON object
      const fishPointsJson = scoringType === "points"
        ? fishPoints.reduce((acc, fp) => {
            acc[fp.species] = fp.points;
            return acc;
          }, {} as Record<string, number>)
        : null;

      // Create competition with advanced scoring
      const { data: competition, error } = await competitionService.createCompetition({
        name,
        description,
        start_date: startDateTime,
        end_date: endDateTime,
        scoring_type: scoringType,
        measurement_type: scoringType === "measurements" ? measurementType : null,
        fish_points: scoringType === "points" ? fishPoints : null,
        top_catches_count: scoringType === "measurements" ? (topCatchesCount || null) : null,
        creator_id: user.id, // Use creator_id not created_by
        is_public: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!competition) {
        throw new Error("Nepodařilo se vytvořit závod");
      }

      console.log("Competition created:", competition);

      // Auto-join creator as participant
      await competitionService.joinCompetition(competition.id);

      toast({
        title: "✅ Závod vytvořen!",
        description: autoJoin 
          ? `Závod "${competition.name}" byl vytvořen a jste automaticky přidán jako účastník`
          : `Závod "${competition.name}" byl úspěšně vytvořen`,
      });

      router.push(`/competitions/${competition.id}`);
    } catch (error: any) {
      console.error("Create competition error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se vytvořit závod",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-2xl flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Vytvořit závod
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Competition Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Název závodu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Letní kaprařský závod 2026"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Popis (volitelné)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Podrobnosti o závodu, pravidla, podmínky..."
              rows={4}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Začátek <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Konec <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Scoring Type */}
          <div className="space-y-3">
            <Label>
              Typ hodnocení <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={scoringType} onValueChange={(v) => setScoringType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="points" id="points" />
                <Label htmlFor="points" className="font-normal cursor-pointer">
                  🏆 Bodování podle druhu ryby
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="measurements" id="measurements" />
                <Label htmlFor="measurements" className="font-normal cursor-pointer">
                  📏 Podle rozměrů (délka / váha)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Points Scoring Configuration */}
          {scoringType === "points" && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-base">Bodování druhů ryb</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFishPoints}
                  disabled={fishPoints.length >= FISH_SPECIES.length}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Přidat druh
                </Button>
              </div>
              
              <div className="space-y-2">
                {fishPoints.map((fp, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={fp.species}
                      onValueChange={(value) => updateFishPoints(index, "species", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FISH_SPECIES.filter(
                          (fish) =>
                            fish.value === fp.species ||
                            !fishPoints.some((existing) => existing.species === fish.value)
                        ).map((fish) => (
                          <SelectItem key={fish.value} value={fish.value}>
                            <div className="flex items-center gap-2">
                              <img 
                                src={fish.image} 
                                alt={fish.label}
                                className="h-5 w-5 object-contain"
                              />
                              {fish.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="number"
                      min="1"
                      value={fp.points}
                      onChange={(e) => updateFishPoints(index, "points", e.target.value)}
                      className="w-24"
                      placeholder="Body"
                    />
                    <span className="text-sm text-muted-foreground">bodů</span>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFishPoints(index)}
                      disabled={fishPoints.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Každý druh ryby má přidělenou bodovou hodnotu. Skóre závodníka = součet bodů za všechny úlovky.
              </p>
            </div>
          )}

          {/* Measurements Scoring Configuration */}
          {scoringType === "measurements" && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label>Co se bude hodnotit? <span className="text-destructive">*</span></Label>
                <RadioGroup value={measurementType} onValueChange={(v) => setMeasurementType(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weight" id="weight" />
                    <Label htmlFor="weight" className="font-normal cursor-pointer">
                      ⚖️ Pouze váha (kg)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="length" id="length" />
                    <Label htmlFor="length" className="font-normal cursor-pointer">
                      📏 Pouze délka (cm)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="font-normal cursor-pointer">
                      🔢 Délka + váha (součet)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="top_catches">
                  Počet nejlepších úlovků (volitelné)
                </Label>
                <Input
                  id="top_catches"
                  type="number"
                  min="1"
                  value={topCatchesCount || ""}
                  onChange={(e) => setTopCatchesCount(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Např. 5 = počítá se jen 5 nejlepších úlovků"
                />
                <p className="text-xs text-muted-foreground">
                  Pokud nevyplníte, počítají se všechny úlovky. Pokud zadáte číslo (např. 5), 
                  do celkového skóre se započítá jen 5 nejlepších úlovků každého závodníka.
                </p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Výpočet skóre:</p>
                <ul className="list-disc list-inside space-y-1">
                  {measurementType === "weight" && (
                    <li>Skóre = váha v kg (např. 8.5 kg = 8.5 bodů)</li>
                  )}
                  {measurementType === "length" && (
                    <li>Skóre = délka v cm (např. 75 cm = 75 bodů)</li>
                  )}
                  {measurementType === "both" && (
                    <li>Skóre = délka (cm) + váha (kg) × 10 (např. 75 cm + 8.5 kg × 10 = 160 bodů)</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Auto-join Checkbox */}
          <div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg">
            <Checkbox
              id="auto-join"
              checked={autoJoin}
              onCheckedChange={(checked) => setAutoJoin(checked === true)}
            />
            <Label
              htmlFor="auto-join"
              className="font-normal cursor-pointer text-sm"
            >
              Automaticky mě přidat jako účastníka závodu
            </Label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vytvářím závod...
                </>
              ) : (
                "Vytvořit závod"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Zrušit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}