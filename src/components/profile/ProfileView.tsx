import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import type { Profile } from "@/services/profileService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Fish, Calendar } from "lucide-react";
import Link from "next/link";

export function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        const { data } = await profileService.getProfileById(user.id);
        setProfile(data);
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Načítám profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Profil nebyl nalezen</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="font-serif text-2xl">{profile.nickname}</CardTitle>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <Link href="/profile/add-catch">
              <Button className="gap-2">
                <Fish className="h-4 w-4" />
                Přidat úlovek
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="space-y-2">
              <Fish className="h-8 w-8 mx-auto text-primary" />
              <p className="text-3xl font-bold font-serif">0</p>
              <p className="text-sm text-muted-foreground">Celkem úlovků</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="space-y-2">
              <Calendar className="h-8 w-8 mx-auto text-accent" />
              <p className="text-3xl font-bold font-serif">-</p>
              <p className="text-sm text-muted-foreground">Největší úlovek</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="space-y-2">
              <Fish className="h-8 w-8 mx-auto text-secondary" />
              <p className="text-3xl font-bold font-serif">-</p>
              <p className="text-sm text-muted-foreground">Nejnovější</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catches List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Moje úlovky</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground space-y-4">
            <Fish className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <p className="text-lg">Zatím jste nepřidali žádný úlovek</p>
            <Link href="/profile/add-catch">
              <Button className="mt-4">Přidat první úlovek</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}