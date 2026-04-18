import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { competitionService } from "@/services/competitionService";
import { Upload, MapPin, Calendar, Save, Loader2, Fish, X } from "lucide-react";

// UPRAVITELNÉ SEZNAMY
const FISH_SPECIES = [
  "Kapr",
  "Štika",
  "Candát",
  "Sumec",
  "Amur",
  "Pstruh",
  "Lín",
  "Okoun",
  "Cejn",
  "Plotice",
  "Parma",
  "Jeřáb",
  "Ostroretka",
  "Mřenka",
  "Úhoř",
  "Síh",
  "Jelec",
  "Lipan",
  "Jiné",
];

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

const OTHER_COUNTRIES = [
  "Albánie",
  "Andorra",
  "Belgie",
  "Bělorusko",
  "Bosna a Hercegovina",
  "Bulharsko",
  "Černá Hora",
  "Dánsko",
  "Estonsko",
  "Finsko",
  "Německo",
  "Gibraltar",
  "Řecko",
  "Grónsko",
  "Island",
  "Irsko",
  "Kosovo",
  "Kypr",
  "Lichtenštejnsko",
  "Litva",
  "Lotyšsko",
  "Lucembursko",
  "Malta",
  "Moldavsko",
  "Monako",
  "Nizozemsko",
  "Norsko",
  "Portugalsko",
  "Rakousko",
  "Rumunsko",
  "Rusko",
  "San Marino",
  "Severní Makedonie",
  "Srbsko",
  "Slovinsko",
  "Spojené království",
  "Švédsko",
  "Švýcarsko",
  "Turecko",
  "Ukrajina",
  "Vatikán",
].sort();

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

const BAIT_BRANDS = [
  "LK Baits",
  "Mikbaits",
  "Carp Servis Václavík",
  "Mivardi",
  "Starbaits",
  "Mainline",
  "CC Moore",
  "Dynamite Baits",
  "Richworth",
  "Nutrabaits",
  "Nash",
  "Korda",
  "Sticky Baits",
  "Pro Line",
  "Tandem Baits",
  "Imperial Baits",
  "Carpzoom",
  "Nikl",
  "Craftbaits",
  "Jiné",
];

interface FormData {
  species: string;
  length_cm: number;
  weight_kg: number;
  country: string;
  region: string;
  district: string;
  bait_brand: string;
  caught_at: string;
  selectedRegion?: string;
  selectedDistrict?: string;
  competition_id?: string;
}

export function UploadCatchForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userCompetitions, setUserCompetitions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [formData, setFormData] = useState<FormData>({
    species: "",
    length_cm: 50,
    weight_kg: 5,
    country: "Česko",
    region: "",
    district: "",
    bait_brand: "",
    caught_at: new Date().toISOString().slice(0, 16),
    selectedRegion: "",
    selectedDistrict: "",
    competition_id: "",
  });

  const availableDistricts = formData.region && CZECH_DISTRICTS[formData.region] 
    ? CZECH_DISTRICTS[formData.region] 
    : [];

  useEffect(() => {
    loadUserCompetitions();
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Chyba",
        description: "Vyberte prosím obrázek",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Chyba",
        description: "Obrázek je příliš velký (max 10MB)",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleImageChange({ target: input } as any);
      }
    }
  };

  const handleGetLocation = async () => {
    const location = await storageService.getCurrentLocation();
    if (location) {
      toast({
        title: "Poloha získána",
        description: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      });
      // Note: Reverse geocoding would happen here in production
      // For now, user needs to manually select location
    } else {
      toast({
        title: "Chyba",
        description: "Nepodařilo se získat polohu",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      toast({
        title: "Chyba",
        description: "Vyberte prosím fotografii úlovku",
        variant: "destructive",
      });
      return;
    }

    if (!formData.species) {
      toast({
        title: "Chyba",
        description: "Vyberte druh ryby",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

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
        length_cm: formData.length_cm || null,
        weight_kg: formData.weight_kg || null,
        country: formData.country || null,
        region: formData.region || null,
        district: formData.district || null,
        bait_brand: formData.bait_brand || null,
        photo_url: uploadResult.url,
        caught_at: formData.caught_at ? new Date(formData.caught_at).toISOString() : new Date().toISOString(),
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
        title: "Úspěch!",
        description: "Úlovek byl přidán",
      });

      router.push("/profile");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat úlovek",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Přidat úlovek</CardTitle>
        <CardDescription>Nahrajte fotografii a vyplňte detaily o úlovku</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Fotografie úlovku *</Label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Náhled"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Klikněte nebo přetáhněte pro změnu
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Přetáhněte fotografii nebo klikněte</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (max 10MB)</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Species */}
          <div className="space-y-2">
            <Label htmlFor="species">Druh ryby *</Label>
            <Select
              value={formData.species}
              onValueChange={(value) => setFormData({ ...formData, species: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte druh" />
              </SelectTrigger>
              <SelectContent>
                {FISH_SPECIES.map((species) => (
                  <SelectItem key={species} value={species}>
                    {species}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Length - Slider with Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Délka</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.length_cm}
                  onChange={(e) => setFormData({ ...formData, length_cm: parseFloat(e.target.value) || 0 })}
                  className="w-20 h-8 text-right"
                  min="0"
                  max="150"
                  step="0.1"
                />
                <span className="text-sm text-muted-foreground">cm</span>
              </div>
            </div>
            <Slider
              value={[formData.length_cm]}
              onValueChange={([value]) => setFormData({ ...formData, length_cm: value })}
              max={150}
              step={1}
              className="w-full"
            />
          </div>

          {/* Weight - Slider with Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Váha</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                  className="w-20 h-8 text-right"
                  min="0"
                  max="50"
                  step="0.1"
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
            </div>
            <Slider
              value={[formData.weight_kg]}
              onValueChange={([value]) => setFormData({ ...formData, weight_kg: value })}
              max={50}
              step={0.1}
              className="w-full"
            />
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
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                Získat GPS
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Země</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value, region: "", district: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                    <SelectItem disabled value="divider">―――――――――――</SelectItem>
                    {OTHER_COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kraj</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value, district: "" })}
                  disabled={formData.country !== "Česko"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.country === "Česko" ? "Vyberte kraj" : "Pouze pro ČR"} />
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

              <div className="space-y-2 sm:col-span-2">
                <Label>Okres</Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => setFormData({ ...formData, district: value })}
                  disabled={!formData.region || availableDistricts.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.region ? "Vyberte okres" : "Nejprve vyberte kraj"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDistricts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          </div>

          {/* Bait Brand */}
          <div className="space-y-2">
            <Label>Značka nástrahy</Label>
            <Select
              value={formData.bait_brand}
              onValueChange={(value) => setFormData({ ...formData, bait_brand: value })}
            >
              <SelectTrigger>
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

          {/* Date and Time */}
          <div className="space-y-2">
            <Label htmlFor="caught_at">Datum a čas ulovení</Label>
            <Input
              id="caught_at"
              type="datetime-local"
              value={formData.caught_at}
              onChange={(e) => setFormData({ ...formData, caught_at: e.target.value })}
              max={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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