import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authService } from "@/services/authService";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Fish, Ban, CheckCircle, Eye, EyeOff, Trash2, User, Edit } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { FISH_SPECIES, COUNTRIES, CZECH_REGIONS } from "@/lib/constants";
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
import { catchService } from "@/services/catchService";

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [catchToEdit, setCatchToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDateChangeOpen, setConfirmDateChangeOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [catches, setCatches] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const adminStatus = await adminService.isAdmin(user.id);
      if (!adminStatus) {
        toast({
          title: "Přístup odepřen",
          description: "Nemáte oprávnění k této stránce",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error) {
      console.error("Admin access check error:", error);
      router.push("/");
    }
  }

  async function loadData() {
    console.log("🔄 [Admin] loadData() called");
    try {
      setIsLoading(true);

      // Get all users
      const usersData = await adminService.getAllUsers();
      console.log("📊 [Admin] Users loaded:", usersData.length);
      setUsers(usersData);

      // Get all catches
      const catchesData = await adminService.getAllCatches();
      console.log("📊 [Admin] Catches loaded:", catchesData.length);
      console.log("📊 [Admin] First catch sample:", catchesData[0]);
      setCatches(catchesData);

    } catch (error) {
      console.error("❌ [Admin] Load data error:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleUserBlock(userId: string, currentlyBlocked: boolean) {
    setProcessingId(userId);
    try {
      await adminService.toggleUserBlock(userId, !currentlyBlocked);
      
      toast({
        title: currentlyBlocked ? "✅ Uživatel odblokován" : "🚫 Uživatel zablokován",
        description: currentlyBlocked 
          ? "Uživatel může opět používat aplikaci"
          : "Uživatel nemůže používat aplikaci",
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se změnit stav uživatele",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleToggleCatchVisibility(catchId: string, currentlyHidden: boolean) {
    setProcessingId(catchId);
    try {
      await adminService.toggleCatchVisibility(catchId, !currentlyHidden);
      
      toast({
        title: currentlyHidden ? "✅ Úlovek zobrazen" : "👁️ Úlovek skryt",
        description: currentlyHidden 
          ? "Úlovek je viditelný ve veřejné galerii"
          : "Úlovek je skrytý z veřejné galerie",
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se změnit viditelnost",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeleteCatch(catchId: string) {
    setProcessingId(catchId);
    try {
      await adminService.deleteCatch(catchId);
      
      toast({
        title: "🗑️ Úlovek odstraněn",
        description: "Úlovek byl trvale smazán",
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odstranit úlovek",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserId) return;

    setIsDeleting(true);
    try {
      await adminService.deleteUser(deleteUserId);
      toast({
        title: "✅ Uživatel smazán",
        description: "Uživatel byl úspěšně odstraněn",
      });
      setDeleteDialogOpen(false);
      setDeleteUserId(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat uživatele",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenEditDialog(catchData: any) {
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
      const updates: any = {};
      
      if (editFormData.species !== catchToEdit.species) {
        updates.species = editFormData.species;
      }
      if (editFormData.length_cm && editFormData.length_cm !== catchToEdit.length_cm?.toString()) {
        updates.length_cm = parseFloat(editFormData.length_cm);
      }
      if (editFormData.weight_kg && editFormData.weight_kg !== catchToEdit.weight_kg?.toString()) {
        updates.weight_kg = parseFloat(editFormData.weight_kg);
      }
      if (editFormData.country !== catchToEdit.country) {
        updates.country = editFormData.country || null;
      }
      if (editFormData.region !== catchToEdit.region) {
        updates.region = editFormData.region || null;
      }
      if (editFormData.district !== catchToEdit.district) {
        updates.district = editFormData.district || null;
      }
      if (editFormData.fishing_area !== catchToEdit.fishing_area) {
        updates.fishing_area = editFormData.fishing_area || null;
      }
      if (editFormData.bait_brand !== catchToEdit.bait_brand) {
        updates.bait_brand = editFormData.bait_brand || null;
      }
      if (editFormData.notes !== catchToEdit.notes) {
        updates.notes = editFormData.notes || null;
      }

      // Handle date/time update
      if (checkDateTimeChange()) {
        const caughtAt = new Date(`${editFormData.caught_date}T${editFormData.caught_time}`);
        updates.caught_at = caughtAt.toISOString();
      }

      console.log("💾 [Admin] Updating catch:", { catchId: catchToEdit.id, updates });

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

      console.log("💾 [Admin] Update result:", { error });

      if (error) {
        throw error;
      }

      console.log("✅ [Admin] Update successful, showing toast...");

      toast({
        title: "✅ Úlovek upraven",
        description: "Úlovek byl úspěšně aktualizován",
      });

      console.log("🔒 [Admin] Closing edit dialog...");
      setEditDialogOpen(false);
      
      console.log("🔄 [Admin] Starting data reload...");
      try {
        await loadData();
        console.log("✅ [Admin] Data reload completed");
      } catch (reloadError) {
        console.error("❌ [Admin] Data reload failed:", reloadError);
      }
    } catch (error: any) {
      console.error("❌ [Admin] Update catch error:", error);
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

  if (isLoading) {
    return (
      <>
        <SEO title="Admin - Načítání..." />
        <div className="min-h-screen bg-background">
          <main className="container py-8">
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEO title="Admin Panel" />
      <div className="min-h-screen bg-background">
        <main className="container py-8 space-y-6">
          {/* Admin Header */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Admin Panel
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Moderace uživatelů a úlovků
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-3xl font-bold text-primary">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Uživatelů</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-3xl font-bold text-primary">{catches.length}</p>
                  <p className="text-sm text-muted-foreground">Úlovků</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Uživatelé ({users.length})
              </TabsTrigger>
              <TabsTrigger value="catches" className="gap-2">
                <Fish className="h-4 w-4" />
                Úlovky ({catches.length})
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.nickname}</p>
                              {user.is_admin && (
                                <Badge variant="secondary" className="gap-1">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </Badge>
                              )}
                              {user.is_blocked && (
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Zablokován
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.full_name && (
                              <p className="text-xs text-muted-foreground">{user.full_name}</p>
                            )}
                            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                              Registrován: {format(new Date(user.created_at), "d. MMM yyyy", { locale: cs })}
                            </p>
                          </div>
                        </div>
                        {!user.is_admin && (
                          <Button
                            variant={user.is_blocked ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleToggleUserBlock(user.id, user.is_blocked)}
                            disabled={processingId === user.id}
                            className="gap-2"
                          >
                            {user.is_blocked ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Odblokovat
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4" />
                                Zablokovat
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Catches Tab */}
            <TabsContent value="catches" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catches.map((catchItem) => (
                  <Card key={catchItem.id} className={catchItem.is_hidden ? "opacity-60" : ""}>
                    <CardContent className="p-4 space-y-3">
                      {/* Image */}
                      {catchItem.photo_url && (
                        <div className="relative rounded-lg overflow-hidden aspect-video">
                          <img
                            src={catchItem.photo_url}
                            alt={catchItem.species}
                            className="w-full h-full object-cover"
                          />
                          {catchItem.is_hidden && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Badge variant="secondary" className="gap-1">
                                <EyeOff className="h-3 w-3" />
                                Skrytý
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <Fish className="h-5 w-5 text-primary" />
                          <h3 className="font-serif text-xl font-semibold">{catchItem.species}</h3>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(catchItem)}
                            disabled={processingId === catchItem.id}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Upravit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={processingId === catchItem.id}
                                className="gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Odstranit
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Opravdu chcete smazat tento úlovek?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tato akce je nevratná. Úlovek a jeho fotografie budou trvale odstraněny.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCatch(catchItem.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Smazat
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {catchItem.profiles?.nickname || "Neznámý rybář"}
                      </p>
                      {(catchItem.length_cm || catchItem.weight_kg) && (
                        <p className="text-sm text-muted-foreground">
                          {catchItem.length_cm && `📏 ${catchItem.length_cm} cm`}
                          {catchItem.length_cm && catchItem.weight_kg && " • "}
                          {catchItem.weight_kg && `⚖️ ${catchItem.weight_kg} kg`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {format(new Date(catchItem.caught_at), "d. MMM yyyy HH:mm", { locale: cs })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

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
            <DialogTitle className="font-serif">Upravit úlovek (Admin)</DialogTitle>
            <DialogDescription>
              Upravte informace o úlovku uživatele
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* All fields - admin can edit everything */}
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

            <div className="grid grid-cols-2 gap-4">
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
            </div>

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

            {editFormData.country === "Česká republika" && (
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

            {/* Date and Time */}
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

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete smazat uživatele?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Uživatel a všechny jeho úlovky budou trvale odstraněny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Mažu..." : "Smazat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}