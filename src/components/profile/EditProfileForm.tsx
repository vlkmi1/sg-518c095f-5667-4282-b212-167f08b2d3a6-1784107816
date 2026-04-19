import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { profileService } from "@/services/profileService";
import { storageService } from "@/services/storageService";
import { authService } from "@/services/authService";
import { Loader2, Upload, User } from "lucide-react";

interface EditProfileFormProps {
  profile: any;
  onSave: () => void;
  onCancel: () => void;
}

export function EditProfileForm({ profile, onSave, onCancel }: EditProfileFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile?.avatar_url || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Neplatný soubor",
        description: "Vyberte obrázek (JPG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Soubor je příliš velký",
        description: "Maximální velikost je 5 MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error("Uživatel není přihlášen");
      }

      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        // Delete old avatar if exists
        if (profile?.avatar_url && profile?.avatar_path) {
          try {
            await storageService.deleteAvatar(profile.avatar_path);
          } catch (error) {
            console.error("Error deleting old avatar:", error);
          }
        }

        // Upload new avatar
        const { url, path } = await storageService.uploadAvatar(avatarFile, user.id);
        avatarUrl = url;

        // Update avatar in profile
        await profileService.updateAvatar(user.id, url);
        
        // Update avatar_path separately
        const { error: pathError } = await profileService.updateProfile(user.id, {
          avatar_path: path,
        });
        
        if (pathError) {
          console.error("Error updating avatar_path:", pathError);
        }
      }

      // Update other profile fields
      const { error } = await profileService.updateProfile(user.id, {
        full_name: fullName.trim() || null,
        location: location.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "✅ Profil aktualizován",
        description: "Vaše změny byly uloženy",
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
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarPreview || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            <User className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {avatarPreview ? "Změnit fotku" : "Nahrát fotku"}
          </Button>
          {avatarPreview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAvatarFile(null);
                setAvatarPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              Odstranit
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarSelect}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG nebo WebP. Max 5 MB.
        </p>
      </div>

      {/* Nickname (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="nickname">Přezdívka (nick)</Label>
        <Input
          id="nickname"
          value={profile?.nickname || ""}
          disabled
          className="bg-muted"
        />
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={profile?.email || ""}
          disabled
          className="bg-muted"
        />
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Celé jméno (volitelné)</Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="např. Jan Novák"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Bydliště (volitelné)</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="např. Praha"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ukládám...
            </>
          ) : (
            "Uložit"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Zrušit
        </Button>
      </div>
    </form>
  );
}