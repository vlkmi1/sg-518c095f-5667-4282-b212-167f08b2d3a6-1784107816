import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/layout/Header";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { competitionService } from "@/services/competitionService";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Calendar, Users, Award, Upload, Camera, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useRef } from "react";

export default function CompetitionPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [competition, setCompetition] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (id) {
        await loadCompetition();
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function loadCompetition() {
    try {
      const { data: comp } = await competitionService.getCompetition(id as string);
      setCompetition(comp);

      const leaders = await competitionService.getLeaderboard(id as string);
      setLeaderboard(leaders);
    } catch (error) {
      console.error("Error loading competition:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst závod",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function canSubmitCatch(): { allowed: boolean; reason?: string } {
    if (!currentUser) {
      return { allowed: false, reason: "Musíte být přihlášeni" };
    }

    if (!competition) {
      return { allowed: false, reason: "Závod nenalezen" };
    }

    const now = new Date();
    const startDate = new Date(competition.start_date);
    const endDate = new Date(competition.end_date);

    const isOrganizer = currentUser.id === competition.organizer_id || 
                       currentUser.id === competition.creator_id;

    // Before competition starts
    if (now < startDate) {
      return { allowed: false, reason: "Závod ještě nezačal" };
    }

    // After competition ends - only organizer can submit
    if (now > endDate && !isOrganizer) {
      return { 
        allowed: false, 
        reason: "Závod již skončil. Pouze organizátor může dodatečně přidat úlovky." 
      };
    }

    return { allowed: true };
  }

  async function handleSubmitCatch() {
    if (!imageFile || !selectedSpecies) {
      toast({
        title: "Chybí údaje",
        description: "Vyberte fotografii a druh ryby",
        variant: "destructive",
      });
      return;
    }

    const canSubmit = canSubmitCatch();
    if (!canSubmit.allowed) {
      toast({
        title: "Nelze přidat úlovek",
        description: canSubmit.reason,
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
      const { url: photoUrl, path: photoPath } = await storageService.uploadCatchPhoto(
        imageFile,
        user.id
      );

      // Get points for selected species (if points-based competition)
      const points = competition.scoring_type === "points" && competition.scoring_table
        ? competition.scoring_table[selectedSpecies]
        : 0;

      // Create catch record
      const catchData = {
        user_id: user.id,
        species: selectedSpecies,
        length_cm: null,
        weight_kg: null,
        photo_url: photoUrl,
        photo_path: photoPath,
        caught_at: new Date().toISOString(),
        is_public: saveToProfile, // Save to profile if toggle is on
        latitude: null,
        longitude: null,
        country: null,
        region: null,
        district: null,
        fishing_area: null,
        bait_brand: null,
      };

      const { data: newCatch, error: catchError } = await catchService.createCatch(catchData);

      if (catchError) {
        throw new Error(catchError.message);
      }

      // Submit to competition
      await competitionService.submitCatchToCompetition(
        competition.id,
        newCatch.id,
        true // auto-approve for now
      );

      const successMessage = competition.scoring_type === "points"
        ? `Získali jste ${points} bodů za ${selectedSpecies}`
        : "Váš úlovek byl přidán do závodu";

      const profileNote = saveToProfile 
        ? " + přidán do vašeho profilu a veřejné galerie"
        : "";

      toast({
        title: "✅ Úlovek přidán!",
        description: successMessage + profileNote,
      });

      // Reset form
      setImageFile(null);
      setImagePreview(null);
      setSelectedSpecies("");
      setSaveToProfile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reload leaderboard
      loadCompetition();
    } catch (error: any) {
      console.error("Submit catch error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat úlovek",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <SEO title="Načítání závodu..." />
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container py-8">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </>
    );
  }

  if (!competition) {
    return (
      <>
        <SEO title="Závod nenalezen" />
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Závod nenalezen</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </>
    );
  }

  const availableSpecies = competition.scoring_type === "points" && competition.scoring_table
    ? Object.keys(competition.scoring_table)
    : [];

  const submissionStatus = canSubmitCatch();
  const now = new Date();
  const startDate = new Date(competition.start_date);
  const endDate = new Date(competition.end_date);
  const hasStarted = now >= startDate;
  const hasEnded = now > endDate;

  return (
    <>
      <SEO title={`${competition.name} - Rybářský závod`} />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 space-y-6">
          {/* Competition Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="font-serif text-3xl mb-2">
                    {competition.name}
                  </CardTitle>
                  {competition.description && (
                    <p className="text-muted-foreground">{competition.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant="secondary" className="gap-2">
                    <Trophy className="h-4 w-4" />
                    {competition.scoring_type === "points" ? "Bodování" : "Míry ryby"}
                  </Badge>
                  {!hasStarted && (
                    <Badge variant="outline" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Nezačal
                    </Badge>
                  )}
                  {hasStarted && !hasEnded && (
                    <Badge className="gap-2 bg-green-500">
                      <Clock className="h-4 w-4" />
                      Probíhá
                    </Badge>
                  )}
                  {hasEnded && (
                    <Badge variant="outline" className="gap-2 bg-muted">
                      <Clock className="h-4 w-4" />
                      Skončil
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Začátek</p>
                    <p className="text-muted-foreground">
                      {format(new Date(competition.start_date), "d. MMMM yyyy HH:mm", { locale: cs })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Konec</p>
                    <p className="text-muted-foreground">
                      {format(new Date(competition.end_date), "d. MMMM yyyy HH:mm", { locale: cs })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Účastníci</p>
                    <p className="text-muted-foreground">{leaderboard.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium">Kód pro připojení:</p>
                <Badge variant="outline" className="font-mono text-lg">
                  {competition.join_code || competition.invite_code}
                </Badge>
              </div>

              {/* Scoring Table (for points-based competitions) */}
              {competition.scoring_type === "points" && competition.scoring_table && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Bodovací tabulka:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(competition.scoring_table).map(([species, points]: [string, any]) => (
                      <div
                        key={species}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded"
                      >
                        <span className="text-sm">{species}</span>
                        <Badge variant="secondary">{points} b.</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Catch Form */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Přidat úlovek do závodu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!submissionStatus.allowed && (
                <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {submissionStatus.reason}
                  </p>
                </div>
              )}

              {submissionStatus.allowed && (
                <>
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Fotografie úlovku *</Label>
                    {!imagePreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Klikněte pro výběr fotografie</p>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Náhled"
                          className="w-full h-auto max-h-64 object-cover"
                        />
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

                  {/* Species Selection */}
                  {competition.scoring_type === "points" ? (
                    <div className="space-y-2">
                      <Label htmlFor="species">Druh ryby *</Label>
                      <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte druh ryby" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSpecies.map((species) => (
                            <SelectItem key={species} value={species}>
                              {species} ({competition.scoring_table[species]} bodů)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedSpecies && (
                        <p className="text-sm text-muted-foreground">
                          Za {selectedSpecies} získáte <strong>{competition.scoring_table[selectedSpecies]} bodů</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="species">Druh ryby *</Label>
                      <Input
                        id="species"
                        value={selectedSpecies}
                        onChange={(e) => setSelectedSpecies(e.target.value)}
                        placeholder="např. Kapr"
                      />
                      <p className="text-sm text-muted-foreground">
                        Hodnotí se: {competition.scoring_metric === "weight" ? "Hmotnost" : "Délka"}
                      </p>
                    </div>
                  )}

                  {/* Save to Profile Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label htmlFor="save_to_profile" className="cursor-pointer font-medium">
                        Přidat i mezi moje úlovky
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Úlovek se zobrazí ve vašem profilu a veřejné galerii
                      </p>
                    </div>
                    <Switch
                      id="save_to_profile"
                      checked={saveToProfile}
                      onCheckedChange={setSaveToProfile}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitCatch}
                    disabled={isSubmitting || !imageFile || !selectedSpecies}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Přidávám...
                      </>
                    ) : (
                      "Přidat úlovek do závodu"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                Pořadí
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Zatím žádné úlovky</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((user, index) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{user.nickname}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.catch_count} {user.catch_count === 1 ? "úlovek" : "úlovky"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {user.total_score.toFixed(competition.scoring_type === "points" ? 0 : 2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {competition.scoring_type === "points" ? "bodů" : 
                           competition.scoring_metric === "weight" ? "kg" : "cm"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}