import { useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { competitionService } from "@/services/competitionService";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Calendar, Plus, X } from "lucide-react";

const COMMON_SPECIES = [
  "Kapr", "Amur", "Sumec", "Štika", "Candát", 
  "Pstruh", "Úhoř", "Lín", "Plotice", "Cejn"
];

export function CreateCompetitionForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    scoring_type: "measurement" as "measurement" | "points",
    scoring_metric: "weight" as "weight" | "length" | "points",
    is_public: true,
  });

  const [scoringTable, setScoringTable] = useState<Record<string, number>>({});
  const [newSpecies, setNewSpecies] = useState("");
  const [newPoints, setNewPoints] = useState("");

  function handleAddSpecies() {
    if (!newSpecies || !newPoints) {
      toast({
        title: "Chybí údaje",
        description: "Zadejte druh ryby a počet bodů",
        variant: "destructive",
      });
      return;
    }

    const points = parseFloat(newPoints);
    if (isNaN(points) || points <= 0) {
      toast({
        title: "Neplatný počet bodů",
        description: "Zadejte kladné číslo",
        variant: "destructive",
      });
      return;
    }

    setScoringTable({
      ...scoringTable,
      [newSpecies]: points,
    });
    setNewSpecies("");
    setNewPoints("");
  }

  function handleRemoveSpecies(species: string) {
    const updated = { ...scoringTable };
    delete updated[species];
    setScoringTable(updated);
  }

  function handleScoringTypeChange(type: "measurement" | "points") {
    setFormData({
      ...formData,
      scoring_type: type,
      scoring_metric: type === "points" ? "points" : "weight",
    });
    if (type === "measurement") {
      setScoringTable({});
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (formData.scoring_type === "points" && Object.keys(scoringTable).length === 0) {
      toast({
        title: "Chybí bodovací tabulka",
        description: "Přidejte alespoň jeden druh ryby s body",
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

      const competitionData = {
        organizer_id: user.id,
        name: formData.name,
        description: formData.description || null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        scoring_type: formData.scoring_type,
        scoring_metric: formData.scoring_metric,
        scoring_table: formData.scoring_type === "points" ? scoringTable : null,
        is_public: formData.is_public,
      };

      const { data: competition, error } = await competitionService.createCompetition(
        competitionData
      );

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "✅ Závod vytvořen!",
        description: `Kód pro připojení: ${competition.join_code}`,
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
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Vytvořit nový závod
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Competition Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Název závodu *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="např. Letní kaprařský závod 2026"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Pravidla a informace o závodu..."
              rows={4}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Začátek *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Konec *</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Scoring Type */}
          <div className="space-y-2">
            <Label>Typ hodnocení *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.scoring_type === "measurement" ? "default" : "outline"}
                onClick={() => handleScoringTypeChange("measurement")}
                className="flex-1"
              >
                📏 Míry ryby
              </Button>
              <Button
                type="button"
                variant={formData.scoring_type === "points" ? "default" : "outline"}
                onClick={() => handleScoringTypeChange("points")}
                className="flex-1"
              >
                🏆 Bodování
              </Button>
            </div>
          </div>

          {/* Scoring Metric (for measurement type) */}
          {formData.scoring_type === "measurement" && (
            <div className="space-y-2">
              <Label htmlFor="scoring_metric">Co se hodnotí *</Label>
              <Select
                value={formData.scoring_metric}
                onValueChange={(value: "weight" | "length") =>
                  setFormData({ ...formData, scoring_metric: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Hmotnost (kg)</SelectItem>
                  <SelectItem value="length">Délka (cm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Scoring Table (for points type) */}
          {formData.scoring_type === "points" && (
            <div className="space-y-4">
              <Label>Bodovací tabulka *</Label>
              
              {/* Add Species Form */}
              <div className="space-y-3">
                {/* Quick selection buttons */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Rychlý výběr:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SPECIES.filter(s => !scoringTable[s]).map((species) => (
                      <Button
                        key={species}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewSpecies(species)}
                        className={newSpecies === species ? "border-primary" : ""}
                      >
                        {species}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom species input */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={newSpecies}
                      onChange={(e) => setNewSpecies(e.target.value)}
                      placeholder="Druh ryby (např. Kapr nebo vlastní)"
                    />
                  </div>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={newPoints}
                    onChange={(e) => setNewPoints(e.target.value)}
                    placeholder="Body"
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSpecies}
                    disabled={!newSpecies || !newPoints}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Přidat
                  </Button>
                </div>
              </div>

              {/* Species List */}
              {Object.keys(scoringTable).length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  {Object.entries(scoringTable).map(([species, points]) => (
                    <div
                      key={species}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{species}</span>
                        <Badge variant="secondary">{points} bodů</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSpecies(species)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(scoringTable).length === 0 && (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Zatím nejsou přidány žádné druhy ryb
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vyberte druh nebo zadejte vlastní a přiřaďte mu body
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Vytvářím..." : "Vytvořit závod"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}