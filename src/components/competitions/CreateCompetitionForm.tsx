import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { competitionService } from "@/services/competitionService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trophy, Calendar, Medal, Users, Save, CheckCircle } from "lucide-react";

export function CreateCompetitionForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [createdCompetition, setCreatedCompetition] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    prize_type: "none",
    start_date: "",
    end_date: "",
    scoring_type: "length",
    top_catches_count: "",
    auto_approve: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, auto_approve: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await authService.getCurrentUser();
      
      if (!user) {
        toast({
          title: "Chyba",
          description: "Musíte být přihlášeni pro vytvoření závodu.",
          variant: "destructive",
        });
        router.push("/auth/login");
        return;
      }

      if (!formData.name || !formData.start_date || !formData.end_date) {
        toast({
          title: "Chyba",
          description: "Vyplňte všechna povinná pole.",
          variant: "destructive",
        });
        return;
      }

      // Convert local dates to ISO strings
      const startDate = new Date(formData.start_date).toISOString();
      const endDate = new Date(formData.end_date).toISOString();

      const { data, error } = await competitionService.createCompetition({
        creator_id: user.id,
        name: formData.name,
        prize_type: formData.prize_type,
        start_date: startDate,
        end_date: endDate,
        scoring_type: formData.scoring_type,
        top_catches_count: formData.top_catches_count ? parseInt(formData.top_catches_count) : null,
        auto_approve: formData.auto_approve
      });

      if (error) {
        throw new Error(error.message || "Nepodařilo se vytvořit závod.");
      }

      setCreatedCompetition(data);
      
      toast({
        title: "Úspěch",
        description: "Závod byl úspěšně vytvořen!",
      });

    } catch (error: any) {
      console.error("Create competition error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Došlo k neočekávané chybě.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (!createdCompetition) return;
    
    // Generate the full invite link
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
    const inviteLink = `${origin}/competitions/join/${createdCompetition.invite_code}`;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast({
        title: "Zkopírováno",
        description: "Odkaz byl zkopírován do schránky.",
      });
    });
  };

  if (createdCompetition) {
    return (
      <Card className="max-w-2xl mx-auto border-primary/20 shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-serif text-3xl text-primary">Závod vytvořen!</CardTitle>
          <CardDescription className="text-base">
            Váš přátelský závod byl úspěšně spuštěn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="bg-muted p-6 rounded-lg text-center space-y-4">
            <h3 className="font-medium text-lg">Zvací kód:</h3>
            <div className="text-4xl font-mono tracking-widest font-bold text-primary">
              {createdCompetition.invite_code}
            </div>
            <p className="text-sm text-muted-foreground pt-2">
              Pošlete tento odkaz přátelům, se kterými chcete závodit:
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input 
                readOnly 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/competitions/join/${createdCompetition.invite_code}`}
                className="bg-background"
              />
              <Button onClick={copyInviteLink}>
                Kopírovat
              </Button>
            </div>
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" onClick={() => router.push('/profile')}>
              Zpět na profil
            </Button>
            <Button onClick={() => router.push(`/competitions/${createdCompetition.id}`)}>
              Přejít na závod
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-2xl text-primary flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Založit přátelský závod
        </CardTitle>
        <CardDescription>
          Vytvořte soukromý závod pro vás a vaše přátele na společné výpravě.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Název */}
            <div className="space-y-2">
              <Label htmlFor="name">Název závodu *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Např. Podzimní kaprařina na Orlíku"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* O co se hraje */}
              <div className="space-y-2">
                <Label htmlFor="prize_type">O co se závodí?</Label>
                <Select value={formData.prize_type} onValueChange={(v) => handleSelectChange("prize_type", v)}>
                  <SelectTrigger id="prize_type">
                    <SelectValue placeholder="Vyberte cenu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Jen tak (o čest)</SelectItem>
                    <SelectItem value="beer">O pivo 🍺</SelectItem>
                    <SelectItem value="bottle">O láhev 🍾</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Co se hodnotí */}
              <div className="space-y-2">
                <Label htmlFor="scoring_type">Co se hodnotí?</Label>
                <Select value={formData.scoring_type} onValueChange={(v) => handleSelectChange("scoring_type", v)}>
                  <SelectTrigger id="scoring_type">
                    <SelectValue placeholder="Vyberte hodnocení" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="length">Nejdelší ryba (cm)</SelectItem>
                    <SelectItem value="weight">Nejtěžší ryba (kg)</SelectItem>
                    <SelectItem value="both">Součet (délka + váha)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Začátek závodu *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Konec */}
              <div className="space-y-2">
                <Label htmlFor="end_date">Konec závodu *</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolik úlovků */}
              <div className="space-y-2">
                <Label htmlFor="top_catches_count">Počet započítaných úlovků</Label>
                <Select 
                  value={formData.top_catches_count ? "custom" : "all"} 
                  onValueChange={(v) => handleSelectChange("top_catches_count", v === "all" ? "" : "3")}
                >
                  <SelectTrigger id="top_catches_count_select">
                    <SelectValue placeholder="Všechny úlovky" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny úlovky</SelectItem>
                    <SelectItem value="custom">Jen nejlepší X úlovků</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.top_catches_count !== "" && (
                <div className="space-y-2">
                  <Label htmlFor="top_catches_count">Zadat počet (X)</Label>
                  <Input
                    id="top_catches_count"
                    name="top_catches_count"
                    type="number"
                    min="1"
                    placeholder="Např. 3"
                    value={formData.top_catches_count}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            {/* Schvalování */}
            <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base">Automatické schvalování</Label>
                <p className="text-sm text-muted-foreground">
                  Úlovky účastníků se rovnou započítají do výsledků. Vypněte, pokud chcete úlovky schvalovat vy.
                </p>
              </div>
              <Switch
                checked={formData.auto_approve}
                onCheckedChange={handleSwitchChange}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">Zakládám...</span>
            ) : (
              <span className="flex items-center gap-2"><Save className="h-5 w-5" /> Založit závod</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}