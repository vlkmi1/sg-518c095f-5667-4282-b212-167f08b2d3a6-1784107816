import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, MapPin, Loader2, Fish, Camera } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export function UploadCatchForm() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showAnalysisPrompt, setShowAnalysisPrompt] = useState(false);

  const [formData, setFormData] = useState({
    species: "",
    length_cm: "",
    weight_kg: "",
    latitude: "",
    longitude: "",
    country: "",
    region: "",
    district: "",
    fishing_area: "",
    bait_brand: "",
    caught_at: new Date().toISOString().slice(0, 16),
    is_public: true,
  });

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setShowAnalysisPrompt(true);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setShowAnalysisPrompt(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSpeciesSelect(species: string) {
    setFormData({ ...formData, species });
  }

  async function handleGetLocation() {
    if (!navigator.geolocation) {
      toast({
        title: "GPS není podporováno",
        description: "Váš prohlížeč nepodporuje geolokaci",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);

        try {
          // Reverse geocoding using Nominatim (OpenStreetMap)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=cs`
          );
          const data = await response.json();

          console.log("Reverse geocoding data:", data);

          const address = data.address || {};

          setFormData({
            ...formData,
            latitude: lat,
            longitude: lon,
            country: address.country || "",
            region: address.state || address.region || "",
            district: address.county || address.municipality || "",
          });

          toast({
            title: "✅ Poloha získána",
            description: `${address.country || ""}, ${address.state || address.region || ""}`,
          });
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          
          // Still save coordinates even if reverse geocoding fails
          setFormData({
            ...formData,
            latitude: lat,
            longitude: lon,
          });

          toast({
            title: "Poloha uložena",
            description: "GPS souřadnice uloženy, ale nepodařilo se zjistit adresu",
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsGettingLocation(false);
        
        toast({
          title: "Chyba GPS",
          description: "Nepodařilo se získat polohu. Zkontrolujte oprávnění prohlížeče.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  async function handleAnalyzeFish() {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setShowAnalysisPrompt(false);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch("/api/analyze-fish", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("AI analýza selhala");
      }

      const result = await response.json();

      setFormData((prev) => ({
        ...prev,
        species: result.species || prev.species,
        length_cm: result.length_cm ? result.length_cm.toString() : prev.length_cm,
        weight_kg: result.weight_kg ? result.weight_kg.toString() : prev.weight_kg,
      }));

      toast({
        title: "✅ AI analýza dokončena",
        description: `Rozpoznán druh: ${result.species || "Neznámý"}`,
      });
    } catch (error: any) {
      console.error("AI analysis error:", error);
      toast({
        title: "Chyba AI analýzy",
        description: "Zkuste zadat údaje ručně",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSkipAnalysis() {
    setShowAnalysisPrompt(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Hide analysis prompt when submitting
    setShowAnalysisPrompt(false);

    if (!imageFile) {
      toast({
        title: "Chybí fotografie",
        description: "Prosím nahrajte fotografii úlovku",
        variant: "destructive",
      });
      return;
    }

    if (!formData.species) {
      toast({
        title: "Chybí druh ryby",
        description: "Prosím zadejte druh ryby",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error("Uživatel není přihlášen");
      }

      // Upload photo
      const { url: photoUrl, path: photoPath } = await storageService.uploadCatchPhoto(
        imageFile,
        user.id
      );

      // Create catch record
      const catchData = {
        user_id: user.id,
        species: formData.species,
        length_cm: formData.length_cm ? parseFloat(formData.length_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        photo_url: photoUrl,
        photo_path: photoPath,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        country: formData.country || null,
        region: formData.region || null,
        district: formData.district || null,
        fishing_area: formData.fishing_area || null,
        bait_brand: formData.bait_brand || null,
        caught_at: new Date(formData.caught_at).toISOString(),
        is_public: formData.is_public,
      };

      const { error } = await catchService.createCatch(catchData);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "✅ Úlovek přidán!",
        description: "Váš úlovek byl úspěšně nahrán",
      });

      router.push("/profile");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Chyba při nahrávání",
        description: error.message || "Něco se pokazilo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          Přidat úlovek
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Fotografie úlovku *</Label>
            <div className="flex flex-col gap-4">
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Klikněte pro výběr fotografie
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Náhled"
                    className="w-full h-auto max-h-96 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* AI Analysis Prompt */}
          {imagePreview && showAnalysisPrompt && !isAnalyzing && (
            <Card className="border-accent/50 bg-accent/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Fish className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Analyzovat rybu pomocí AI?</p>
                      <p className="text-xs text-muted-foreground">
                        Automaticky rozpozná druh, délku a váhu
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSkipAnalysis}
                    >
                      Ne
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAnalyzeFish}
                      className="gap-2"
                    >
                      Ano
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis Loading */}
          {imagePreview && isAnalyzing && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium text-sm">Analyzuji rybu...</p>
                    <p className="text-xs text-muted-foreground">
                      AI rozpoznává druh a odhaduje rozměry
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fish Species */}
          <div className="space-y-2">
            <Label htmlFor="species">
              Druh ryby <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.species} onValueChange={(value) => handleSpeciesSelect(value)} required>
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

          {/* Measurements */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Délka (cm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                value={formData.length_cm}
                onChange={(e) => setFormData({ ...formData, length_cm: e.target.value })}
                placeholder="např. 45.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Váha (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                placeholder="např. 2.5"
              />
            </div>
          </div>

          {/* Location with GPS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Poloha úlovku</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="gap-2"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {isGettingLocation ? "Získávám..." : "Získat GPS polohu"}
              </Button>
            </div>

            {formData.latitude && formData.longitude && (
              <div className="p-3 bg-muted/30 rounded-lg text-sm">
                <p className="font-medium mb-1">📍 GPS souřadnice</p>
                <p className="text-muted-foreground">
                  {formData.latitude}, {formData.longitude}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Země</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="např. Česká republika"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Kraj</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="např. Jihočeský"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Okres</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="např. České Budějovice"
                />
              </div>
            </div>
          </div>

          {/* Fishing Area */}
          <div className="space-y-2">
            <Label htmlFor="fishing_area">Revír / Místo</Label>
            <Input
              id="fishing_area"
              value={formData.fishing_area}
              onChange={(e) => setFormData({ ...formData, fishing_area: e.target.value })}
              placeholder="např. Orlík, Rybník Chabičov"
            />
          </div>

          {/* Bait Brand */}
          <div className="space-y-2">
            <Label htmlFor="bait_brand">Značka nástrahy</Label>
            <Input
              id="bait_brand"
              value={formData.bait_brand}
              onChange={(e) => setFormData({ ...formData, bait_brand: e.target.value })}
              placeholder="např. Boilies Monster Crab"
            />
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <Label htmlFor="caught_at">Datum a čas úlovku</Label>
            <Input
              id="caught_at"
              type="datetime-local"
              value={formData.caught_at}
              onChange={(e) => setFormData({ ...formData, caught_at: e.target.value })}
              required
            />
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Label htmlFor="is_public" className="cursor-pointer">
                Veřejný úlovek
              </Label>
              <p className="text-xs text-muted-foreground">
                (zobrazí se v galerii)
              </p>
            </div>
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_public: checked })
              }
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isUploading || !imageFile}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Nahrávám...
              </>
            ) : (
              "Přidat úlovek"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}