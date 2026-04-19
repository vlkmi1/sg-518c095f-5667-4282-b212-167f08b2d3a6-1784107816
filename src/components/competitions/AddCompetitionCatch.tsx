import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { Loader2, Upload, Plus, X } from "lucide-react";

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

interface AddCompetitionCatchProps {
  competitionId: string;
  scoringType: "points" | "measurements";
  measurementType?: "weight" | "length" | "both" | null;
  onSuccess?: () => void;
}

export function AddCompetitionCatch({
  competitionId,
  scoringType,
  measurementType,
  onSuccess,
}: AddCompetitionCatchProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [species, setSpecies] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log("=== DIALOG OPENED ===");
      console.log("Competition ID:", competitionId);
      console.log("Scoring Type:", scoringType);
      console.log("Measurement Type:", measurementType);
      console.log("Should show length field:", scoringType === "measurements" && (measurementType === "length" || measurementType === "both"));
      console.log("Should show weight field:", scoringType === "measurements" && (measurementType === "weight" || measurementType === "both"));
    }
  }, [open, competitionId, scoringType, measurementType]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreview("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("=== ADD COMPETITION CATCH DEBUG ===");
    console.log("Competition ID:", competitionId);
    console.log("Scoring Type:", scoringType);
    console.log("Measurement Type:", measurementType);
    console.log("Species:", species);
    console.log("Length:", lengthCm);
    console.log("Weight:", weightKg);

    if (!photoFile || !species) {
      toast({
        title: "Chybí údaje",
        description: "Nahrajte fotografii a vyberte druh ryby",
        variant: "destructive",
      });
      return;
    }

    // Validate measurements if required
    if (scoringType === "measurements") {
      const needsWeight = measurementType === "weight" || measurementType === "both";
      const needsLength = measurementType === "length" || measurementType === "both";

      console.log("Needs weight:", needsWeight);
      console.log("Needs length:", needsLength);

      if (needsWeight && !weightKg) {
        toast({
          title: "Chybí váha",
          description: "Tento závod vyžaduje zadání váhy úlovku",
          variant: "destructive",
        });
        return;
      }

      if (needsLength && !lengthCm) {
        toast({
          title: "Chybí délka",
          description: "Tento závod vyžaduje zadání délky úlovku",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error("Uživatel není přihlášen");
      }

      console.log("User ID:", user.id);

      // Upload photo
      const photoData = await storageService.uploadCatchPhoto(photoFile, user.id);
      const photoUrl = typeof photoData === 'string' ? photoData : photoData.url;

      console.log("Photo uploaded:", photoUrl);

      // Create catch data
      const catchData = {
        user_id: user.id,
        species,
        photo_url: photoUrl,
        length_cm: lengthCm ? parseFloat(lengthCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        country: null,
        region: null,
        district: null,
        latitude: null,
        longitude: null,
        fishing_area: null,
        bait_brand: null,
        notes: null,
        caught_at: new Date().toISOString(),
        is_public: false, // CRITICAL: Competition catches must be private
        competition_id: competitionId, // CRITICAL: Link to competition
      };

      console.log("Catch data to save:", catchData);

      // Create catch linked to competition
      const { data, error } = await catchService.createCatch(catchData);

      if (error) {
        console.error("Create catch error:", error);
        throw new Error(error.message || "Nepodařilo se přidat úlovek");
      }

      console.log("Competition catch created successfully:", data);

      toast({
        title: "✅ Úlovek přidán!",
        description: "Váš úlovek byl úspěšně přidán do závodu",
      });

      // Reset form
      setPhotoFile(null);
      setPhotoPreview("");
      setSpecies("");
      setLengthCm("");
      setWeightKg("");
      setOpen(false);

      onSuccess?.();
    } catch (error: any) {
      console.error("Add catch error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat úlovek",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const needsWeight = scoringType === "measurements" && 
    (measurementType === "weight" || measurementType === "both");
  const needsLength = scoringType === "measurements" && 
    (measurementType === "length" || measurementType === "both");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Přidat úlovek
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Přidat úlovek do závodu</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>
              Fotografie úlovku <span className="text-destructive">*</span>
            </Label>
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearPhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Label
                  htmlFor="photo-upload"
                  className="cursor-pointer text-sm text-primary hover:underline"
                >
                  Klikněte pro výběr fotografie
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Fish Species */}
          <div className="space-y-2">
            <Label htmlFor="species">
              Druh ryby <span className="text-destructive">*</span>
            </Label>
            <Select value={species} onValueChange={setSpecies} required>
              <SelectTrigger id="species">
                <SelectValue placeholder="Vyberte druh" />
              </SelectTrigger>
              <SelectContent>
                {FISH_SPECIES.map((fish) => (
                  <SelectItem key={fish.value} value={fish.value}>
                    <div className="flex items-center gap-2">
                      <img 
                        src={fish.image} 
                        alt={fish.label}
                        className="h-5 w-5 object-cover rounded-full"
                      />
                      {fish.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show length/weight fields only for measurements scoring */}
          {scoringType === "measurements" && (
            <div className="grid grid-cols-2 gap-4">
              {/* Length - required if measurementType is 'length' or 'both' */}
              {(measurementType === "length" || measurementType === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="length">
                    Délka (cm) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    placeholder="např. 75.5"
                    required
                  />
                </div>
              )}

              {/* Weight - required if measurementType is 'weight' or 'both' */}
              {(measurementType === "weight" || measurementType === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="weight">
                    Váha (kg) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="např. 8.5"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Info about what will be scored */}
          {scoringType === "points" && (
            <p className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg">
              ℹ️ Tento závod hodnotí podle druhu ryby. Stačí vybrat druh.
            </p>
          )}
          {scoringType === "measurements" && (
            <p className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg">
              ℹ️ Tento závod hodnotí podle {
                measurementType === "weight" ? "váhy" :
                measurementType === "length" ? "délky" :
                "délky a váhy"
              }. Zadejte přesné rozměry úlovku.
            </p>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Přidávám...
                </>
              ) : (
                "Přidat úlovek"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Zrušit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}