import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { Loader2, Upload, MapPin, X, Zap, FileText } from "lucide-react";

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

const COUNTRIES = [
  "Česká republika",
  "Slovensko",
  "Polsko",
  "Rakousko",
  "Německo",
];

const CZECH_REGIONS = [
  "Hlavní město Praha",
  "Středočeský kraj",
  "Jihočeský kraj",
  "Plzeňský kraj",
  "Karlovarský kraj",
  "Ústecký kraj",
  "Liberecký kraj",
  "Královéhradecký kraj",
  "Pardubický kraj",
  "Kraj Vysočina",
  "Jihomoravský kraj",
  "Olomoucký kraj",
  "Zlínský kraj",
  "Moravskoslezský kraj",
];

export function UploadCatchForm() {
  const router = useRouter();
  const { toast } = useToast();

  // Step 1: Photo upload
  const [step, setStep] = useState<"upload" | "mode" | "form">("upload");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Step 2: Mode selection
  const [mode, setMode] = useState<"quick" | "detailed">("quick");

  // Step 3: Form data
  const [species, setSpecies] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [caughtDate, setCaughtDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [caughtTime, setCaughtTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [country, setCountry] = useState("Česká republika");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [baitBrand, setBaitBrand] = useState("");
  const [notes, setNotes] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Neplatný soubor",
        description: "Nahrajte prosím obrázek",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
      setStep("mode");
    };
    reader.readAsDataURL(file);
  }

  async function handleModeSelect(selectedMode: "quick" | "detailed") {
    setMode(selectedMode);

    if (selectedMode === "detailed" && photoFile) {
      // Run AI analysis for detailed mode
      await analyzePhoto();
    }

    setStep("form");
  }

  async function analyzePhoto() {
    if (!photoFile) return;

    setIsAnalyzing(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(",")[1];
          resolve(base64String);
        };
        reader.readAsDataURL(photoFile);
      });

      // Call AI analysis API
      const response = await fetch("/api/analyze-fish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        throw new Error("AI analýza selhala");
      }

      const result = await response.json();

      // Pre-fill form with AI results
      if (result.species) {
        setSpecies(result.species);
      }
      if (result.length) {
        setLengthCm(result.length.toString());
      }
      if (result.weight) {
        setWeightKg(result.weight.toString());
      }

      toast({
        title: "🤖 AI analýza dokončena",
        description: `Rozpoznáno: ${result.species || "neznámý druh"}`,
      });
    } catch (error: any) {
      console.error("AI analysis error:", error);
      toast({
        title: "AI analýza selhala",
        description: "Vyplňte údaje ručně",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGetLocation() {
    if (!navigator.geolocation) {
      toast({
        title: "Geolokace není podporována",
        description: "Váš prohlížeč nepodporuje získání polohy",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        toast({
          title: "✅ Poloha získána",
          description: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Chyba geolokace",
          description: "Nepodařilo se získat polohu",
          variant: "destructive",
        });
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!photoFile || !species) {
      toast({
        title: "Chybějící údaje",
        description: "Vyplňte povinná pole",
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

      // Upload photo
      const photoData = await storageService.uploadCatchPhoto(photoFile, user.id);
      const photoUrl = typeof photoData === 'string' ? photoData : photoData.url;

      // Create catch date-time
      const caughtAt = new Date(`${caughtDate}T${caughtTime}:00`).toISOString();

      // Create catch
      await catchService.createCatch({
        user_id: user.id,
        species,
        photo_url: photoUrl,
        length_cm: lengthCm ? parseFloat(lengthCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        caught_at: caughtAt,
        country: country || null,
        region: region || null,
        district: district || null,
        latitude: latitude,
        longitude: longitude,
        bait_brand: baitBrand || null,
        notes: notes || null,
      });

      toast({
        title: "✅ Úlovek přidán!",
        description: `${species} byl úspěšně přidán do vaší sbírky`,
      });

      router.push("/profile");
    } catch (error: any) {
      console.error("Upload catch error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat úlovek",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setStep("upload");
    setPhotoFile(null);
    setPhotoPreview("");
    setMode("quick");
    setSpecies("");
    setLengthCm("");
    setWeightKg("");
    setCountry("Česká republika");
    setRegion("");
    setDistrict("");
    setLatitude(null);
    setLongitude(null);
    setBaitBrand("");
    setNotes("");
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-2xl flex items-center gap-2">
          🐟 Přidat úlovek
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Step 1: Upload Photo */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <p className="text-lg font-medium">Nahrajte fotografii úlovku</p>
                  <p className="text-sm text-muted-foreground">
                    Klikněte nebo přetáhněte obrázek
                  </p>
                </div>
              </Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Zrušit
            </Button>
          </div>
        )}

        {/* Step 2: Mode Selection */}
        {step === "mode" && photoPreview && (
          <div className="space-y-6">
            {/* Photo Preview */}
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleReset}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mode Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Jak chcete pokračovat?</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleModeSelect("quick")}
                >
                  <CardContent className="p-6 text-center space-y-3">
                    <Zap className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-serif font-semibold text-lg">⚡ Rychle přidat</h3>
                    <p className="text-sm text-muted-foreground">
                      Jen druh ryby, zbytek nechat prázdný
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleModeSelect("detailed")}
                >
                  <CardContent className="p-6 text-center space-y-3">
                    <FileText className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-serif font-semibold text-lg">📋 Detailně vyplnit</h3>
                    <p className="text-sm text-muted-foreground">
                      Všechny údaje + AI analýza
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Form */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Preview Small */}
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleReset}
              >
                <X className="h-4 w-4 mr-1" />
                Změnit foto
              </Button>
            </div>

            {/* AI Analysis Loading */}
            {isAnalyzing && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">🤖 AI analýza probíhá...</p>
                    <p className="text-sm text-muted-foreground">
                      Rozpoznávám druh, délku a váhu
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fish Species - Always visible */}
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
                          className="h-5 w-5 object-contain"
                        />
                        {fish.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detailed Mode Fields */}
            {mode === "detailed" && (
              <>
                {/* Measurements */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="length">Délka (cm)</Label>
                    <Input
                      id="length"
                      type="number"
                      step="0.1"
                      min="0"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(e.target.value)}
                      placeholder="např. 75.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Váha (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="např. 8.5"
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-2">
                  <Label>📅 Datum a čas ulovení</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={caughtDate}
                      onChange={(e) => setCaughtDate(e.target.value)}
                    />
                    <Input
                      type="time"
                      value={caughtTime}
                      onChange={(e) => setCaughtTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>📍 Místo ulovení</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetLocation}
                      className="gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Získat polohu
                    </Button>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="country">Země</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Vyberte zemi" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Region - Only for Czech Republic */}
                  {country === "Česká republika" && (
                    <div className="space-y-2">
                      <Label htmlFor="region">Kraj</Label>
                      <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Vyberte kraj" />
                        </SelectTrigger>
                        <SelectContent>
                          {CZECH_REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* District */}
                  <div className="space-y-2">
                    <Label htmlFor="district">Okres</Label>
                    <Input
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="např. Brno-město"
                    />
                  </div>

                  {/* GPS Coordinates Display */}
                  {latitude && longitude && (
                    <p className="text-sm text-muted-foreground">
                      GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                  )}
                </div>

                {/* Bait Brand */}
                <div className="space-y-2">
                  <Label htmlFor="bait">Značka nástrahy</Label>
                  <Input
                    id="bait"
                    value={baitBrand}
                    onChange={(e) => setBaitBrand(e.target.value)}
                    placeholder="např. Carp Expert"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Poznámky</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Volitelné poznámky o úlovku..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Přidávám úlovek...
                  </>
                ) : (
                  "Přidat úlovek"
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
        )}
      </CardContent>
    </Card>
  );
}