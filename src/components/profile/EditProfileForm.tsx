import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profileService } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, X } from "lucide-react";

interface EditProfileFormProps {
  profile: {
    id: string;
    nickname: string;
    email: string;
    full_name?: string | null;
    location?: string | null;
  };
  onSave: () => void;
  onCancel: () => void;
}

export function EditProfileForm({ profile, onSave, onCancel }: EditProfileFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    location: profile.location || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await profileService.updateProfile(profile.id, {
        full_name: formData.full_name || null,
        location: formData.location || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "✅ Profil aktualizován",
        description: "Vaše údaje byly úspěšně uloženy",
      });

      onSave();
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se aktualizovat profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Upravit profil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Přezdívka (nick)</Label>
            <Input
              id="nickname"
              value={profile.nickname}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Přezdívku nelze měnit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email nelze měnit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Celé jméno (volitelné)</Label>
            <Input
              id="full_name"
              placeholder="např. Jan Novák"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Bydliště (volitelné)</Label>
            <Input
              id="location"
              placeholder="např. Praha, Brno, Ostrava"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ukládám...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Uložit
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Zrušit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}