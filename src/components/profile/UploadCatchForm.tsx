import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { authService } from "@/services/authService";
import { Upload, MapPin, Loader2, Image as ImageIcon } from "lucide-react";

export function UploadCatchForm() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    species: "",
    length_cm: "",
    weight_kg: "",
    country: "",
    region: "",
    district: "",
    bait_brand: "",
    caught_at: new Date().toISOString().slice(0, 16), // datetime-local format
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Chyba",
          description: "Vyberte prosím obrázek",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = async () => {
    const location = await storageService.getCurrentLocation();
    if (location) {
      toast({
        title: "Poloha získána",
        description: `GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      });
      // In real app, you'd reverse geocode this to get country/region/district
      // For now, user enters manually
    } else {
      toast({
        title: "Upozornění",
        description: "Nepodařilo se získat GPS polohu",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "Chyba",
        description: "Vyberte fotografii úlovku",
        variant: "destructive",
      });
      return;
    }

    if (!formData.species) {
      toast({
        title: "Chyba",
        description: "Vyplňte druh ryby",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const user = await authService.getCurrentUser();
      if (!user) {
        toast({
          title: "Chyba",
          description: "Musíte být přihlášeni",
          variant: "destructive",
        });
        router.push("/auth/login");
        return;
      }

      // Upload image
      const uploadResult = await storageService.uploadCatchImage(selectedFile, user.id);
      if (uploadResult.error || !uploadResult.url) {
        toast({
          title: "Chyba nahrávání",
          description: uploadResult.error?.message || "Nepodařilo se nahrát fotografii",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create catch record
      const { data, error } = await catchService.createCatch({
        user_id: user.id,
        species: formData.species,
        length_cm: formData.length_cm ? parseFloat(formData.length_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        country: formData.country || null,
        region: formData.region || null,
        district: formData.district || null,
        bait_brand: formData.bait_brand || null,
        photo_url: uploadResult.url,
        caught_at: formData.caught_at ? new Date(formData.caught_at).toISOString() : new Date().toISOString(),
      });

      if (error) {
        toast({
          title: "Chyba",
          description: error.message || "Nepodařilo se uložit úlovek",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Úspěch!",
        description: "Úlovek byl úspěšně přidán",
      });

      router.push("/profile");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Chyba",
        description: "Něco se pokazilo",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Přidat úlovek</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Fotografie úlovku *</Label>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="space-y-3">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Klikněte pro výběr fotografie</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG do 10MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Species */}
          <div className="space-y-2">
            <Label htmlFor="species">Druh ryby *</Label>
            <Input
              id="species"
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              placeholder="Např. Kapr obecný"
              required
            />
          </div>

          {/* Measurements */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Délka (cm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                value={formData.length_cm}
                onChange={(e) => setFormData({ ...formData, length_cm: e.target.value })}
                placeholder="Např. 65"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Váha (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                placeholder="Např. 4.5"
              />
            </div>
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
            <div className="grid gap-4">
              <Input
                placeholder="Země (např. Česká republika)"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Kraj (např. Jihočeský)"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
                <Input
                  placeholder="Okres (např. České Budějovice)"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Bait */}
          <div className="space-y-2">
            <Label htmlFor="bait">Značka nástrahy</Label>
            <Input
              id="bait"
              value={formData.bait_brand}
              onChange={(e) => setFormData({ ...formData, bait_brand: e.target.value })}
              placeholder="Např. Carp Zoom Premium"
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="caught_at">Datum a čas ulovení</Label>
            <Input
              id="caught_at"
              type="datetime-local"
              value={formData.caught_at}
              onChange={(e) => setFormData({ ...formData, caught_at: e.target.value })}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Nahrávám...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Přidat úlovek
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}