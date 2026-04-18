import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { competitionService } from "@/services/competitionService";
import { Upload, MapPin, Calendar, Save, Loader2, Fish, X, ChevronDown, Eye, EyeOff } from "lucide-react";

// Configurable bait brands - edit this array to add/remove brands
const BAIT_BRANDS = [
  "LK Baits",
  "Mikbaits",
  "Starbaits",
  "Dynamite Baits",
  "Mainline",
  "CC Moore",
  "Carp Zoom",
  "Richworth",
  "Nutrabaits",
  "Nash",
  "Korda",
  "Spotted Fin",
  "Mivardi",
  "Imperial Baits",
  "Rod Hutchinson",
  "Tandem Baits",
  "Bait-Tech",
  "Solar",
  "Crafty Catcher",
  "Jiné",
];

// Priority countries at the top
const PRIORITY_COUNTRIES = [
  "Česko",
  "Slovensko",
  "Maďarsko",
  "Polsko",
  "Španělsko",
  "Francie",
  "Itálie",
  "Chorvatsko",
];

// Other European countries (alphabetically)
const OTHER_COUNTRIES = [
  "Albánie",
  "Belgie",
  "Bulharsko",
  "Dánsko",
  "Estonsko",
  "Finsko",
  "Irsko",
  "Island",
  "Litva",
  "Lotyšsko",
  "Lucembursko",
  "Makedonie",
  "Malta",
  "Moldavsko",
  "Monako",
  "Německo",
  "Nizozemsko",
  "Norsko",
  "Portugalsko",
  "Rakousko",
  "Rumunsko",
  "Řecko",
  "San Marino",
  "Srbsko",
  "Slovinsko",
  "Švédsko",
  "Švýcarsko",
  "Ukrajina",
  "Velká Británie",
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
  "Vysočina",
  "Jihomoravský kraj",
  "Olomoucký kraj",
  "Zlínský kraj",
  "Moravskoslezský kraj",
];

const CZECH_DISTRICTS: Record<string, string[]> = {
  "Hlavní město Praha": ["Praha"],
  "Středočeský kraj": ["Benešov", "Beroun", "Kladno", "Kolín", "Kutná Hora", "Mělník", "Mladá Boleslav", "Nymburk", "Praha-východ", "Praha-západ", "Příbram", "Rakovník"],
  "Jihočeský kraj": ["České Budějovice", "Český Krumlov", "Jindřichův Hradec", "Písek", "Prachatice", "Strakonice", "Tábor"],
  "Plzeňský kraj": ["Domažlice", "Klatovy", "Plzeň-město", "Plzeň-jih", "Plzeň-sever", "Rokycany", "Tachov"],
  "Karlovarský kraj": ["Cheb", "Karlovy Vary", "Sokolov"],
  "Ústecký kraj": ["Děčín", "Chomutov", "Litoměřice", "Louny", "Most", "Teplice", "Ústí nad Labem"],
  "Liberecký kraj": ["Česká Lípa", "Jablonec nad Nisou", "Liberec", "Semily"],
  "Královéhradecký kraj": ["Hradec Králové", "Jičín", "Náchod", "Rychnov nad Kněžnou", "Trutnov"],
  "Pardubický kraj": ["Chrudim", "Pardubice", "Svitavy", "Ústí nad Orlicí"],
  "Vysočina": ["Havlíčkův Brod", "Jihlava", "Pelhřimov", "Třebíč", "Žďár nad Sázavou"],
  "Jihomoravský kraj": ["Blansko", "Brno-město", "Brno-venkov", "Břeclav", "Hodonín", "Vyškov", "Znojmo"],
  "Olomoucký kraj": ["Jeseník", "Olomouc", "Prostějov", "Přerov", "Šumperk"],
  "Zlínský kraj": ["Kroměříž", "Uherské Hradiště", "Vsetín", "Zlín"],
  "Moravskoslezský kraj": ["Bruntál", "Frýdek-Místek", "Karviná", "Nový Jičín", "Opava", "Ostrava-město"],
};

interface FormData {
  species: string;
  length_cm: number;
  weight_kg: number;
  country: string;
  region: string;
  district: string;
  fishing_area: string;
  bait_brand: string;
  caught_at: string;
  selectedRegion?: string;
  selectedDistrict?: string;
  competition_id?: string;
  is_public: boolean;
}

export function UploadCatchForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisPrompt, setShowAnalysisPrompt] = useState(false);
  const [userCompetitions, setUserCompetitions] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [formData, setFormData] = useState<FormData>({
    species: "",
    length_cm: 50,
    weight_kg: 2,
    country: "",
    region: "",
    district: "",
    fishing_area: "",
    bait_brand: "",
    caught_at: new Date().toISOString().slice(0, 16),
    selectedRegion: "",
    selectedDistrict: "",
    competition_id: "",
    is_public: true,
  });

  useEffect(() => {
    loadUserCompetitions();
    loadLastCatch();
  }, []);

  async function loadUserCompetitions() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      const competitions = await competitionService.getUserCompetitions(user.id);
      // Filter only active competitions
      const activeComps = competitions.filter((comp: any) => {
        const now = new Date();
        return new Date(comp.start_date) <= now && new Date(comp.end_date) >= now;
      });
      setUserCompetitions(activeComps);
    } catch (error) {
      console.error("Error loading competitions:", error);
    }
  }

  async function loadLastCatch() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      const catches = await catchService.getUserCatches(user.id);
      if (catches.length > 0) {
        const lastCatch = catches[0]; // Already sorted by caught_at DESC
        
        // Pre-fill form data from last catch (except photo and caught_at)
        setFormData((prev) => ({
          ...prev,
          species: lastCatch.species || "",
          length_cm: lastCatch.length_cm || 50,
          weight_kg: lastCatch.weight_kg || 2,
          country: lastCatch.country || "",
          region: lastCatch.region || "",
          district: lastCatch.district || "",
          fishing_area: lastCatch.fishing_area || "",
          bait_brand: lastCatch.bait_brand || "",
          selectedRegion: lastCatch.region || "",
          selectedDistrict: lastCatch.district || "",
        }));
      }
    } catch (error) {
      console.error("Error loading last catch:", error);
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setShowAnalysisPrompt(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setShowAnalysisPrompt(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setShowAnalysisPrompt(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await storageService.getCurrentLocation();
      if (location) {
        toast({
          title: "GPS poloha získána",
          description: `Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`,
        });
        // Here you could add reverse geocoding to get country/region/district
        // For now, user will fill it manually
      } else {
        toast({
          title: "GPS poloha nedostupná",
          description: "Povolte přístup k poloze v prohlížeči",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Chyba GPS",
        description: "Nepodařilo se získat polohu",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  async function handleAnalyzeFish() {
    if (!imagePreview) return;

    setIsAnalyzing(true);
    setShowAnalysisPrompt(false);

    try {
      const response = await fetch("/api/analyze-fish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: imagePreview }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Analýza selhala");
      }

      const analysis = await response.json();

      // Pre-fill form with AI analysis
      if (analysis.species) {
        setFormData((prev) => ({
          ...prev,
          species: analysis.species,
          length_cm: analysis.length_cm || prev.length_cm,
          weight_kg: analysis.weight_kg || prev.weight_kg,
        }));
      }

      toast({
        title: "✅ Analýza dokončena",
        description: `Druh: ${analysis.species || "Neznámý"} | Spolehlivost: ${analysis.confidence === "high" ? "vysoká" : analysis.confidence === "medium" ? "střední" : "nízká"}`,
      });

      // Auto-expand details if AI found the species
      if (analysis.species && !showDetails) {
        setShowDetails(true);
      }
    } catch (error: any) {
      console.error("Fish analysis error:", error);
      toast({
        title: "Chyba při analýze",
        description: error.message || "Nepodařilo se analyzovat rybu. Zkuste to prosím znovu.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSkipAnalysis() {
    setShowAnalysisPrompt(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      toast({
        title: "Chybí fotografie",
        description: "Nahrajte prosím fotografii úlovku",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error("Nejste přihlášeni");
      }

      // Upload image
      const uploadResult = await storageService.uploadCatchImage(imageFile, user.id);
      if (uploadResult.error || !uploadResult.url) {
        const errorMsg = typeof uploadResult.error === 'string' 
          ? uploadResult.error 
          : (uploadResult.error?.message || "Nepodařilo se nahrát obrázek");
        throw new Error(errorMsg);
      }

      // Create catch record
      const { data, error } = await catchService.createCatch({
        user_id: user.id,
        species: formData.species,
        length_cm: formData.length_cm ? parseFloat(formData.length_cm.toString()) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg.toString()) : null,
        country: formData.country || null,
        region: formData.region || null,
        district: formData.district || null,
        fishing_area: formData.fishing_area || null,
        bait_brand: formData.bait_brand || null,
        photo_url: uploadResult.url,
        caught_at: formData.caught_at ? new Date(formData.caught_at).toISOString() : new Date().toISOString(),
        is_public: formData.is_public,
      });

      if (error) {
        throw error;
      }

      // If competition selected, submit to competition
      if (formData.competition_id && data?.id) {
        const comp = userCompetitions.find((c: any) => c.id === formData.competition_id);
        if (comp) {
          await competitionService.submitCatchToCompetition(
            formData.competition_id,
            data.id,
            comp.auto_approve
          );
        }
      }

      toast({
        title: "Úlovek přidán!",
        description: formData.is_public 
          ? "Váš úlovek byl úspěšně přidán do galerie" 
          : "Váš úlovek byl přidán jako soukromý",
      });

      router.push("/profile");
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat úlovek",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRegionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedRegion: value,
      region: value,
      selectedDistrict: "",
      district: "",
    }));
  };

  const handleDistrictChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedDistrict: value,
      district: value,
    }));
  };

  const availableDistricts = formData.selectedRegion ? CZECH_DISTRICTS[formData.selectedRegion] || [] : [];

  return (
    <Card className="max-w-2xl mx-auto border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-2xl text-primary flex items-center gap-2">
          <Fish className="h-6 w-6" />
          Přidat úlovek
        </CardTitle>
        <CardDescription>
          Nahrajte fotografii svého úlovku
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Fotografie úlovku *</Label>
            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Klikněte nebo přetáhněte fotografii
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG do 10 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Náhled"
                  className="w-full rounded-lg object-cover max-h-[400px]"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              {formData.is_public ? (
                <Eye className="h-5 w-5 text-primary" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="is_public" className="text-sm font-medium">
                  {formData.is_public ? "Veřejný úlovek" : "Soukromý úlovek"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formData.is_public 
                    ? "Zobrazí se v galerii pro ostatní" 
                    : "Viditelný jen ve vašem profilu"}
                </p>
              </div>
            </div>
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_public: checked }))}
            />
          </div>

          {/* Quick Submit or Show Details */}
          {!showDetails ? (
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isUploading || !imageFile}
                className="flex-1 gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Nahrávám...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Vložit
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDetails(true)}
                className="flex-1 gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                Přidat detaily
              </Button>
            </div>
          ) : (
            <>
              {/* Species */}
              <div className="space-y-2">
                <Label htmlFor="species">Druh ryby</Label>
                <Input
                  id="species"
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  placeholder="např. Kapr obecný"
                />
              </div>

              {/* Length with Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="length_cm">Délka (cm)</Label>
                  <Input
                    id="length_cm"
                    type="number"
                    value={formData.length_cm}
                    onChange={(e) => setFormData({ ...formData, length_cm: parseFloat(e.target.value) || 0 })}
                    className="w-20 text-right"
                    min="0"
                    max="150"
                    step="0.1"
                  />
                </div>
                <Slider
                  value={[formData.length_cm]}
                  onValueChange={(value) => setFormData({ ...formData, length_cm: value[0] })}
                  min={0}
                  max={150}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground text-center">{formData.length_cm} cm</p>
              </div>

              {/* Weight with Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="weight_kg">Váha (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                    className="w-20 text-right"
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>
                <Slider
                  value={[formData.weight_kg]}
                  onValueChange={(value) => setFormData({ ...formData, weight_kg: value[0] })}
                  min={0}
                  max={50}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground text-center">{formData.weight_kg} kg</p>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Místo úlovku</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                    className="gap-2"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Získávám GPS...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        Získat GPS
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid gap-4">
                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="country">Země</Label>
                    <Select value={formData.country} onValueChange={(value) => handleSelectChange("country", value)}>
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Vyberte zemi" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                        <SelectItem value="separator" disabled className="border-t my-1">
                          ──────────
                        </SelectItem>
                        {OTHER_COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Region (only for Czechia) */}
                  {formData.country === "Česko" && (
                    <div className="space-y-2">
                      <Label htmlFor="region">Kraj</Label>
                      <Select value={formData.selectedRegion} onValueChange={handleRegionChange}>
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Vyberte kraj" />
                        </SelectTrigger>
                        <SelectContent>
                          {CZECH_REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* District (only for selected Czech region) */}
                  {formData.country === "Česko" && formData.selectedRegion && availableDistricts.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="district">Okres</Label>
                      <Select 
                        value={formData.district} 
                        onValueChange={(value) => handleSelectChange("district", value)}
                        disabled={!formData.region || formData.region === "" || availableDistricts.length === 0}
                      >
                        <SelectTrigger id="district">
                          <SelectValue placeholder={formData.region ? "Vyberte okres" : "Nejdříve vyberte kraj"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- Žádný --</SelectItem>
                          {availableDistricts.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Fishing area */}
                  <div className="space-y-2">
                    <Label htmlFor="fishing_area">Název revíru (volitelné)</Label>
                    <Input
                      id="fishing_area"
                      name="fishing_area"
                      type="text"
                      placeholder="např. Labe - Mělník"
                      value={formData.fishing_area}
                      onChange={(e) => setFormData({ ...formData, fishing_area: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Název vodní plochy nebo revíru
                    </p>
                  </div>
                </div>
              </div>

              {/* Bait Brand */}
              <div className="space-y-2">
                <Label htmlFor="bait_brand">Značka nástrahy</Label>
                <Select value={formData.bait_brand} onValueChange={(value) => handleSelectChange("bait_brand", value)}>
                  <SelectTrigger id="bait_brand">
                    <SelectValue placeholder="Vyberte značku" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAIT_BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Competition selection (optional) */}
              {userCompetitions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="competition_id">
                    Přidat do závodu (volitelné)
                  </Label>
                  <Select 
                    value={formData.competition_id} 
                    onValueChange={(value) => handleSelectChange("competition_id", value)}
                  >
                    <SelectTrigger id="competition_id">
                      <SelectValue placeholder="Vyberte závod nebo nechte prázdné" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Žádný závod</SelectItem>
                      {userCompetitions.map((comp) => (
                        <SelectItem key={comp.id} value={comp.id}>
                          {comp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pokud je úlovek z probíhajícího závodu, můžete ho automaticky započítat
                  </p>
                </div>
              )}

              {/* Caught at */}
              <div className="space-y-2">
                <Label htmlFor="caught_at">Datum a čas ulovení</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="caught_at"
                    type="datetime-local"
                    value={formData.caught_at}
                    onChange={(e) => setFormData({ ...formData, caught_at: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isUploading || !imageFile}
                className="w-full gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Nahrávám úlovek...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Vložit úlovek
                  </>
                )}
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}