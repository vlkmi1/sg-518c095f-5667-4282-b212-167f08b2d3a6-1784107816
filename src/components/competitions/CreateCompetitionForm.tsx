import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { competitionService } from "@/services/competitionService";
import { Loader2, Trophy } from "lucide-react";
import { format } from "date-fns";

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

    setIsSubmitting(true);

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error("Uživatel není přihlášen");
      }

      // Create competition with timestamps
      const { data: competition, error } = await competitionService.createCompetition({
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        scoring_type: scoringType,
        created_by: user.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!competition) {
        throw new Error("Nepodařilo se vytvořit závod");
      }

      // Auto-join creator as participant if checkbox is checked
      if (autoJoin) {
        try {
          await competitionService.joinCompetition(competition.id, user.id);
        } catch (joinError) {
          console.error("Auto-join error:", joinError);
          // Don't fail the whole operation if auto-join fails
        }
      }

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

          {/* Date Range - Začátek */}
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

            {/* Date Range - Konec */}
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
                  🏆 Bodování (každý úlovek = 1 bod)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="measurements" id="measurements" />
                <Label htmlFor="measurements" className="font-normal cursor-pointer">
                  📏 Podle rozměrů (délka + váha)
                </Label>
              </div>
            </RadioGroup>
          </div>

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