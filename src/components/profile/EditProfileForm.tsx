import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { profileService } from "@/services/profileService";
import { storageService } from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, AlertCircle, UserCheck, Trash2, User } from "lucide-react";
import Image from "next/image";

interface EditProfileFormProps {
  profile: any;
  onSave: () => void;
  onCancel: () => void;
}

export function EditProfileForm({ profile, onSave, onCancel }: EditProfileFormProps) {
  const { toast } = useToast();
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  useEffect(() => {
    // Detect if this is first-time profile edit
    setIsFirstTime(!profile?.first_login_completed);
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size before preview
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "Soubor je příliš velký",
          description: "Maximální velikost profilové fotky je 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Neplatný typ souboru",
          description: "Prosím nahrajte obrázek (PNG, JPG, WebP)",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setShowRemoveDialog(true);
  };

  const confirmRemoveAvatar = async () => {
    setLoading(true);
    try {
      // Delete from storage if path exists
      if (profile.avatar_path) {
        await storageService.deleteAvatar(profile.avatar_path);
      }

      // Remove from database
      const { error } = await profileService.removeAvatar(profile.id);

      if (error) {
        throw new Error(error);
      }

      // Clear preview
      setAvatarPreview(null);
      setAvatarFile(null);

      toast({
        title: "✅ Fotka odstraněna",
        description: "Profilová fotka byla úspěšně odstraněna",
      });

      setShowRemoveDialog(false);
      onSave();
    } catch (error: any) {
      console.error("Remove avatar error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odstranit fotku",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate nickname
      if (!nickname.trim()) {
        toast({
          title: "Chyba",
          description: "Nick je povinný",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check nickname availability if changed
      if (nickname !== profile.nickname) {
        const isAvailable = await profileService.isNicknameAvailable(nickname);
        if (!isAvailable) {
          toast({
            title: "Nick obsazený",
            description: "Tento nick již používá jiný uživatel",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      let avatarUrl = profile.avatar_url;
      let avatarPath = profile.avatar_path;

      // Upload new avatar if selected
      if (avatarFile) {
        try {
          // Delete old avatar first (if exists)
          if (profile.avatar_path) {
            console.log("Deleting old avatar:", profile.avatar_path);
            try {
              await storageService.deleteAvatar(profile.avatar_path);
            } catch (deleteError) {
              console.error("Failed to delete old avatar:", deleteError);
              // Continue anyway - old file might not exist
            }
          }

          // Upload new avatar
          const result = await storageService.uploadAvatar(avatarFile, profile.id);
          if (result.url && result.path) {
            avatarUrl = result.url;
            avatarPath = result.path;
            console.log("New avatar uploaded:", { url: avatarUrl, path: avatarPath });
          }
        } catch (uploadError: any) {
          toast({
            title: "Chyba nahrávání",
            description: uploadError.message || "Nepodařilo se nahrát profilovou fotku",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { error } = await profileService.updateProfile(profile.id, {
        nickname,
        full_name: fullName || null,
        location: location || null,
        bio: bio || null,
        avatar_url: avatarUrl,
        avatar_path: avatarPath,
        first_login_completed: true,
      });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "✅ Profil aktualizován",
        description: "Vaše změny byly úspěšně uloženy",
      });

      onSave();
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se aktualizovat profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First-time user alert */}
        {isFirstTime && (
          <Alert className="bg-primary/5 border-primary/20">
            <UserCheck className="h-5 w-5 text-primary" />
            <AlertDescription className="ml-2">
              <p className="font-semibold mb-1">👋 Vítejte! Dokončete svůj profil</p>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Zkontrolujte hlavně nick</strong> - ten se bude zobrazovat u vašich úlovků a v závodech.
                Změnit ho můžete kdykoliv později.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Avatar Upload */}
        <div className="space-y-3">
          <Label>Profilová fotka</Label>
          <div className="flex items-start gap-4">
            {/* Avatar Preview */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={loading}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG nebo WebP · Maximálně 5MB · Automaticky se zmenší na 200×200px
              </p>
              
              {/* Remove Avatar Button */}
              {(avatarPreview || profile.avatar_url) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={loading}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Odebrat fotku
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Nickname */}
        <div className="space-y-2">
          <Label htmlFor="nickname" className="flex items-center gap-2">
            Nick <span className="text-destructive">*</span>
            {isFirstTime && <AlertCircle className="h-4 w-4 text-primary" />}
          </Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="jan123"
            required
            disabled={loading}
            pattern="[a-zA-Z0-9_-]+"
            title="Pouze písmena, čísla, podtržítka a pomlčky"
            className={isFirstTime ? "border-primary/50 focus:border-primary" : ""}
          />
          <p className="text-xs text-muted-foreground">
            Zobrazuje se u vašich úlovků a v závodech
          </p>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Celé jméno (volitelné)</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jan Novák"
            disabled={loading}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Lokace (volitelné)</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Praha, Česká republika"
            disabled={loading}
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">O mně (volitelné)</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Napište něco o sobě..."
            disabled={loading}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Zrušit
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ukládám...
              </>
            ) : (
              "Uložit změny"
            )}
          </Button>
        </div>
      </form>

      {/* Remove Avatar Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odstranit profilovou fotku?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete odstranit svou profilovou fotku? Tato akce je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveAvatar}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Odstraňuji...
                </>
              ) : (
                "Odstranit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}