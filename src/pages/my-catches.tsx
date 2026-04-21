import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { authService } from "@/services/authService";
import { catchService } from "@/services/catchService";
import { storageService } from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";
import { Fish, MapPin, Calendar, Trash2, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { FISH_SPECIES, COUNTRIES, CZECH_REGIONS } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

export default function MyCatchesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [catches, setCatches] = useState<Tables<"catches">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [catchToDelete, setCatchToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [catchToEdit, setCatchToEdit] = useState<Tables<"catches"> | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDateChangeOpen, setConfirmDateChangeOpen] = useState(false);
  const [pendingDateTimeUpdate, setPendingDateTimeUpdate] = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
    loadUserCatches();
  }, []);

  async function loadUserCatches() {
    setIsLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // getUserCatches returns the data array directly, or throws an error
      const data = await catchService.getUserCatches(user.id);

      // Filter out competition catches - they should not appear in personal catches
      const personalCatches = (data || []).filter(
        (c: any) => !c.competition_id
      );

      console.log("Personal catches loaded:", personalCatches.length);
      setCatches(personalCatches);
    } catch (error) {
      console.error("Error loading catches:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst vaše úlovky",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenDeleteDialog(catchId: string) {
    setCatchToDelete(catchId);
    setDeleteDialogOpen(true);
  }

  function handleOpenEditDialog(catchData: Tables<"catches">) {
    setCatchToEdit(catchData);
    
    // Format caught_at to date and time strings
    const caughtDate = catchData.caught_at ? new Date(catchData.caught_at) : new Date();
    const dateStr = caughtDate.toISOString().split('T')[0];
    const timeStr = caughtDate.toTimeString().slice(0, 5);
    
    // Pre-fill form with current data
    setEditFormData({
      species: catchData.species || "",
      length_cm: catchData.length_cm?.toString() || "",
      weight_kg: catchData.weight_kg?.toString() || "",
      country: catchData.country || "",
      region: catchData.region || "",
      district: catchData.district || "",
      fishing_area: catchData.fishing_area || "",
      bait_brand: catchData.bait_brand || "",
      notes: catchData.notes || "",
      caught_date: dateStr,
      caught_time: timeStr,
    });
    setEditDialogOpen(true);
  }

  function checkDateTimeChange(): boolean {
    if (!catchToEdit) return false;

    const originalDate = catchToEdit.caught_at ? new Date(catchToEdit.caught_at) : null;
    if (!originalDate) return false;

    const originalDateStr = originalDate.toISOString().split('T')[0];
    const originalTimeStr = originalDate.toTimeString().slice(0, 5);

    return editFormData.caught_date !== originalDateStr || editFormData.caught_time !== originalTimeStr;
  }

  function handleConfirmDateTimeChange() {
    setConfirmDateChangeOpen(false);
    proceedWithUpdate();
  }

  async function proceedWithUpdate() {
    if (!catchToEdit) return;

    setIsSubmitting(true);

    try {
      // Only update fields that were filled in (non-empty) or changed
      const updates: any = {};
      
      if (editFormData.species && editFormData.species !== catchToEdit.species) {
        updates.species = editFormData.species;
      }
      if (editFormData.length_cm && editFormData.length_cm !== catchToEdit.length_cm?.toString()) {
        updates.length_cm = parseFloat(editFormData.length_cm);
      }
      if (editFormData.weight_kg && editFormData.weight_kg !== catchToEdit.weight_kg?.toString()) {
        updates.weight_kg = parseFloat(editFormData.weight_kg);
      }
      if (editFormData.country && editFormData.country !== catchToEdit.country) {
        updates.country = editFormData.country;
      }
      if (editFormData.region && editFormData.region !== catchToEdit.region) {
        updates.region = editFormData.region;
      }
      if (editFormData.district && editFormData.district !== catchToEdit.district) {
        updates.district = editFormData.district;
      }
      if (editFormData.fishing_area && editFormData.fishing_area !== catchToEdit.fishing_area) {
        updates.fishing_area = editFormData.fishing_area;
      }
      if (editFormData.bait_brand && editFormData.bait_brand !== catchToEdit.bait_brand) {
        updates.bait_brand = editFormData.bait_brand;
      }
      if (editFormData.notes && editFormData.notes !== catchToEdit.notes) {
        updates.notes = editFormData.notes;
      }

      // Handle date/time update
      if (pendingDateTimeUpdate || checkDateTimeChange()) {
        const dateTime = pendingDateTimeUpdate || { date: editFormData.caught_date, time: editFormData.caught_time };
        const caughtAt = new Date(`${dateTime.date}T${dateTime.time}`);
        updates.caught_at = caughtAt.toISOString();
        setPendingDateTimeUpdate(null);
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: "Žádné změny",
          description: "Nebyly provedeny žádné změny",
        });
        setEditDialogOpen(false);
        setIsSubmitting(false);
        return;
      }

      const { error } = await catchService.updateCatch(catchToEdit.id, updates);

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Úlovek upraven",
        description: "Úlovek byl úspěšně aktualizován",
      });

      setEditDialogOpen(false);
      loadUserCatches(); // Reload catches
    } catch (error: any) {
      console.error("Update catch error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit úlovek",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateCatch() {
    if (!catchToEdit) return;

    // Check if date/time changed
    if (checkDateTimeChange()) {
      setConfirmDateChangeOpen(true);
      return;
    }

    // No date/time change, proceed directly
    proceedWithUpdate();
  }

  async function handleDeleteCatch() {
    if (!catchToDelete) return;

    setIsSubmitting(true);

    try {
      // Find the catch to get its photo path
      const catchData = catches.find((c) => c.id === catchToDelete);
      
      if (!catchData) {
        throw new Error("Úlovek nebyl nalezen");
      }

      // Delete photo from storage
      if (catchData.photo_url) {
        // Extract path from URL (format: https://.../storage/v1/object/public/catches/path)
        const urlParts = catchData.photo_url.split("/catches/");
        if (urlParts.length > 1) {
          const photoPath = urlParts[1];
          await storageService.deleteCatchImage(photoPath);
        }
      }

      // Delete catch from database
      await catchService.deleteCatch(catchToDelete);

      toast({
        title: "✅ Úlovek odstraněn",
        description: "Úlovek byl úspěšně smazán",
      });

      setDeleteDialogOpen(false);
      setCatchToDelete(null);
      loadUserCatches(); // Reload catches
    } catch (error: any) {
      console.error("Delete catch error:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odstranit úlovek",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <SEO title="Moje úlovky" />
        <div className="min-h-screen bg-background">
          <main className="container py-8">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Moje úlovky" />
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                  <Fish className="h-6 w-6 text-primary" />
                  Moje úlovky
                </CardTitle>
                <Button onClick={() => router.push("/profile/add-catch")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Přidat úlovek
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {catches.length === 0 ? (
                <div className="text-center py-12">
                  <Fish className="h-20 w-20 mx-auto mb-6 text-muted-foreground/30" />
                  <h3 className="font-serif text-xl mb-2">Zatím nemáte žádné úlovky</h3>
                  <p className="text-muted-foreground mb-6">
                    Přidejte svůj první úlovek a sdílejte ho s komunitou rybářů
                  </p>
                  <Button onClick={() => router.push("/profile/add-catch")} size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Přidat první úlovek
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-muted-foreground">
                      Celkem <strong className="text-foreground">{catches.length}</strong>{" "}
                      {catches.length === 1 ? "úlovek" : catches.length < 5 ? "úlovky" : "úlovků"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catches.map((catchData) => (
                      <Card key={catchData.id} className="overflow-hidden group">
                        <div className="aspect-video relative">
                          <img
                            src={catchData.photo_url}
                            alt={catchData.species}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            {catchData.is_public ? (
                              <Badge className="bg-green-500/90 backdrop-blur">
                                Veřejné
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-muted/80 backdrop-blur"
                              >
                                Soukromé
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <Fish className="h-5 w-5 text-primary" />
                              <h3 className="font-serif text-xl font-semibold">{catchData.species}</h3>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditDialog(catchData)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Upravit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(catchData.id)}
                                className="gap-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Smazat
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {catchData.length_cm && (
                              <Badge variant="secondary" className="gap-1">
                                📏 {catchData.length_cm} cm
                              </Badge>
                            )}
                            {catchData.weight_kg && (
                              <Badge variant="secondary" className="gap-1">
                                ⚖️ {catchData.weight_kg} kg
                              </Badge>
                            )}
                          </div>

                          {catchData.fishing_area && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              📍 {catchData.fishing_area}
                            </p>
                          )}

                          {catchData.bait_brand && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              🎣 {catchData.bait_brand}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {format(new Date(catchData.caught_at), "d. MMMM yyyy HH:mm", {
                              locale: cs,
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete smazat úlovek?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Úlovek a jeho fotografie budou trvale odstraněny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCatch}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Mažu..." : "Smazat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Date/Time Change Dialog */}
      <AlertDialog open={confirmDateChangeOpen} onOpenChange={setConfirmDateChangeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Určitě chcete změnit datum a čas ulovení?</AlertDialogTitle>
            <AlertDialogDescription>
              Změna data a času ulovení může ovlivnit umístění v Síni slávy a časových žebříčcích.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDateTimeChange}
              disabled={isSubmitting}
            >
              Ano, změnit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Catch Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Upravit úlovek</DialogTitle>
            <DialogDescription>
              Doplňte chybějící informace o úlovku
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Show only empty fields */}
            {!catchToEdit?.species && (
              <div className="space-y-2">
                <Label htmlFor="edit-species">Druh ryby *</Label>
                <Select
                  value={editFormData.species}
                  onValueChange={(value) =>
                    setEditFormData((prev: any) => ({ ...prev, species: value }))
                  }
                >
                  <SelectTrigger id="edit-species">
                    <SelectValue placeholder="Vyberte druh" />
                  </SelectTrigger>
                  <SelectContent>
                    {FISH_SPECIES.map((fish) => (
                      <SelectItem key={fish.value} value={fish.value}>
                        {fish.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!catchToEdit?.length_cm && (
              <div className="space-y-2">
                <Label htmlFor="edit-length">Délka (cm)</Label>
                <Input
                  id="edit-length"
                  type="number"
                  step="0.1"
                  value={editFormData.length_cm}
                  onChange={(e) =>
                    setEditFormData((prev: any) => ({ ...prev, length_cm: e.target.value }))
                  }
                  placeholder="např. 45.5"
                />
              </div>
            )}

            {!catchToEdit?.weight_kg && (
              <div className="space-y-2">
                <Label htmlFor="edit-weight">Hmotnost (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.01"
                  value={editFormData.weight_kg}
                  onChange={(e) =>
                    setEditFormData((prev: any) => ({ ...prev, weight_kg: e.target.value }))
                  }
                  placeholder="např. 3.25"
                />
              </div>
            )}

            {!catchToEdit?.country && (
              <div className="space-y-2">
                <Label htmlFor="edit-country">Stát</Label>
                <Select
                  value={editFormData.country}
                  onValueChange={(value) =>
                    setEditFormData((prev: any) => ({ ...prev, country: value }))
                  }
                >
                  <SelectTrigger id="edit-country">
                    <SelectValue placeholder="Vyberte stát" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!catchToEdit?.region && editFormData.country === "Česká republika" && (
              <div className="space-y-2">
                <Label htmlFor="edit-region">Kraj</Label>
                <Select
                  value={editFormData.region}
                  onValueChange={(value) =>
                    setEditFormData((prev: any) => ({ ...prev, region: value }))
                  }
                >
                  <SelectTrigger id="edit-region">
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

            {!catchToEdit?.district && (
              <div className="space-y-2">
                <Label htmlFor="edit-district">Okres</Label>
                <Input
                  id="edit-district"
                  value={editFormData.district}
                  onChange={(e) =>
                    setEditFormData((prev: any) => ({ ...prev, district: e.target.value }))
                  }
                  placeholder="např. Praha-západ"
                />
              </div>
            )}

            {!catchToEdit?.fishing_area && (
              <div className="space-y-2">
                <Label htmlFor="edit-fishing-area">Revír / místo</Label>
                <Input
                  id="edit-fishing-area"
                  value={editFormData.fishing_area}
                  onChange={(e) =>
                    setEditFormData((prev: any) => ({ ...prev, fishing_area: e.target.value }))
                  }
                  placeholder="např. Labe - Mělník"
                />
              </div>
            )}

            {!catchToEdit?.bait_brand && (
              <div className="space-y-2">
                <Label htmlFor="edit-bait">Značka nástrahy</Label>
                <Input
                  id="edit-bait"
                  value={editFormData.bait_brand}
                  onChange={(e) =>
                    setEditFormData((prev: any) => ({ ...prev, bait_brand: e.target.value }))
                  }
                  placeholder="např. Sportcarp"
                />
              </div>
            )}

            {!catchToEdit?.notes && (
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Poznámky</Label>
                <Textarea
                  id="edit-notes"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData((prev: any) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Další informace o úlovku..."
                  rows={3}
                />
              </div>
            )}

            {/* Date and Time - always shown */}
            <div className="space-y-4 pt-2 border-t">
              <Label className="text-base font-semibold">Datum a čas ulovení</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Datum</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editFormData.caught_date}
                    onChange={(e) =>
                      setEditFormData((prev: any) => ({ ...prev, caught_date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Čas</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editFormData.caught_time}
                    onChange={(e) =>
                      setEditFormData((prev: any) => ({ ...prev, caught_time: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdateCatch}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Ukládám..." : "Uložit změny"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Zrušit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}