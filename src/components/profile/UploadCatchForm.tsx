import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { Loader2, Fish, MapPin, Calendar } from "lucide-react";

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

  // Form mode
  const [isQuickMode, setIsQuickMode] = useState(true);

  // Required fields (quick mode)
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [species, setSpecies] = useState("");

  // Optional fields (detailed mode)
  const [length, setLength] = useState("");
  const [weight, setWeight] = useState("");
  const [caughtDate, setCaughtDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [caughtTime, setCaughtTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [baitBrand, setBaitBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [country, setCountry] = useState("Česká republika");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (photo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(photo);
    } else {
      setPhotoPreview("");
    }
  }, [photo]);

  async function getCurrentLocation() {
    setIsLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolokace není podporována");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);

      toast({
        title: "✅ Poloha získána",
        description: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
      });
    } catch (error: any) {
      console.error("Geolocation error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se získat polohu",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!photo) {
      toast({
        title: "Chybí fotografie",
        description: "Nahrajte fotografii úlovku",
        variant: "destructive",
      });
      return;
    }

    if (!species) {
      toast({
        title: "Chybí druh ryby",
        description: "Vyberte druh ryby",
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
      const photoUrl = await storageService.uploadCatchPhoto(photo, user.id);

      // Prepare caught_at timestamp
      const caughtAt = new Date(`${caughtDate}T${caughtTime}:00`).toISOString();

      // Create catch
      const catchData: any = {
        user_id: user.id,
        species,
        photo_url: photoUrl,
        caught_at: caughtAt,
      };

      // Add optional fields only if filled
      if (length) catchData.length_cm = parseFloat(length);
      if (weight) catchData.weight_kg = parseFloat(weight);
      if (baitBrand) catchData.bait_brand = baitBrand;
      if (notes) catchData.notes = notes;
      if (latitude !== null) catchData.latitude = latitude;
      if (longitude !== null) catchData.longitude = longitude;
      if (country) catchData.country = country;
      if (region) catchData.region = region;
      if (district) catchData.district = district;

      await catchService.createCatch(catchData);

      toast({
        title: "✅ Úlovek přidán!",
        description: `${species} byl úspěšně přidán do galerie`,
      });

      router.push("/my-catches");
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-2xl flex items-center gap-2">
          <Fish className="h-6 w-6 text-primary" />
          Přidat úlovek
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Toggle */}
          <div className="space-y-3">
            <Label>Režim přidání</Label>
            <RadioGroup
              value={isQuickMode ? "quick" : "detailed"}
              onValueChange={(value) => setIsQuickMode(value === "quick")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="quick" id="quick" />
                <Label htmlFor="quick" className="font-normal cursor-pointer">
                  ⚡ Rychlé přidání (jen foto + druh)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="font-normal cursor-pointer">
                  📋 Detailní (všechny údaje)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="photo">
              Fotografie úlovku <span className="text-destructive">*</span>
            </Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              required
            />
            {photoPreview && (
              <div className="mt-2 rounded-lg overflow-hidden border">
                <img
                  src={photoPreview}
                  alt="Náhled"
                  className="w-full h-64 object-cover"
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
                        className="h-5 w-5 object-contain"
                      />
                      {fish.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Detailed Fields */}
          {!isQuickMode && (
            <>
              {/* Measurements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Délka (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
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
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="např. 8.5"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Datum a čas ulovení
                </Label>
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
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Místo ulovení
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="gap-2"
                  >
                    {isLoadingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Načítám...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        Získat polohu
                      </>
                    )}
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
                      <SelectItem value="Česká republika">Česká republika</SelectItem>
                      <SelectItem value="Slovensko">Slovensko</SelectItem>
                      <SelectItem value="Polsko">Polsko</SelectItem>
                      <SelectItem value="Rakousko">Rakousko</SelectItem>
                      <SelectItem value="Německo">Německo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Region (Kraj) */}
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

                {/* District (Okres) */}
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
                {latitude !== null && longitude !== null && (
                  <div className="text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                  </div>
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
                  placeholder="Volitelné poznámky k úlovku..."
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
                  Nahrávám úlovek...
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
      </CardContent>
    </Card>
  );
}