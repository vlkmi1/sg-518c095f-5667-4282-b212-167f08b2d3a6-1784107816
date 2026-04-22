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
import { Shield, Users, Fish, Ban, CheckCircle, Eye, EyeOff, Trash2, User, Edit, Trophy, Loader2 } from "lucide-react";
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
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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

  async function handleOpenUserDetail(user: any) {
    setSelectedUser(user);
    setUserDetailOpen(true);
    setLoadingDetail(true);
    
    try {
      const detail = await adminService.getUserDetail(user.id);
      setUserDetail(detail);
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se načíst detail uživatele",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleOpenPasswordDialog() {
    setNewPassword("");
    setNewPasswordConfirm("");
    setPasswordDialogOpen(true);
  }

  async function handleVerifyEmail() {
    if (!selectedUser) return;

    try {
      await adminService.verifyUserEmail(selectedUser.id);
      
      toast({
        title: "✅ Email ověřen",
        description: "Email uživatele byl úspěšně ověřen a účet aktivován",
      });
      
      // Reload user detail to show updated status
      const detail = await adminService.getUserDetail(selectedUser.id);
      setUserDetail(detail);
      
      // Update selected user data
      setSelectedUser((prev: any) => ({
        ...prev,
        email_confirmed_at: new Date().toISOString()
      }));

      // Reload all users to update the main list
      await loadData();
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se ověřit email",
        variant: "destructive",
      });
    }
  }

  async function handleChangePassword() {
    if (!selectedUser) return;

    // Validation
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Chyba",
        description: "Heslo musí mít alespoň 6 znaků",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      toast({
        title: "Chyba",
        description: "Hesla se neshodují",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await adminService.changeUserPassword(selectedUser.id, newPassword);
      
      toast({
        title: "✅ Heslo změněno",
        description: "Heslo uživatele bylo úspěšně změněno",
      });
      
      setPasswordDialogOpen(false);
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se změnit heslo",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenUserDetail(user)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Detail</span>
                          </Button>
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
                                  <span className="hidden sm:inline">Odblokovat</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4" />
                                  <span className="hidden sm:inline">Zablokovat</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
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
                            <span className="hidden sm:inline">Upravit</span>
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
                                <span className="hidden sm:inline">Odstranit</span>
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
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Ukládám...</span>
                  </span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Uložit změny</span>
                    <span className="sm:hidden">Uložit</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                <span className="hidden sm:inline">Zrušit</span>
                <span className="sm:hidden">✕</span>
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

      {/* User Detail Dialog */}
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Detail uživatele</DialogTitle>
            <DialogDescription>
              Podrobné informace a statistiky uživatele
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-4">Načítám detail...</p>
            </div>
          ) : userDetail && selectedUser ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold">{selectedUser.nickname}</h3>
                    {selectedUser.is_admin && (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                    {selectedUser.is_blocked && (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />
                        Zablokován
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  {selectedUser.full_name && (
                    <p className="text-sm text-muted-foreground">{selectedUser.full_name}</p>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistiky</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Fish className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold text-primary">{userDetail.stats.catchesCount}</p>
                      <p className="text-xs text-muted-foreground">Úlovků</p>
                    </div>
                    <div className="text-center p-4 bg-accent/5 rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-2 text-accent" />
                      <p className="text-2xl font-bold text-accent">{userDetail.stats.competitionsCount}</p>
                      <p className="text-xs text-muted-foreground">Závodů</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/5 rounded-lg">
                      <Trophy className="h-6 w-6 mx-auto mb-2 text-secondary" />
                      <p className="text-2xl font-bold text-secondary">{userDetail.stats.trophiesCount}</p>
                      <p className="text-xs text-muted-foreground">Trofejí</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detaily účtu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">ID:</p>
                      <p className="font-mono text-xs">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Registrace:</p>
                      <p suppressHydrationWarning>
                        {format(new Date(selectedUser.created_at), "d. MMMM yyyy HH:mm", { locale: cs })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Email ověřen:</p>
                      {selectedUser.email_confirmed_at ? (
                        <p className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Ano</span>
                        </p>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleVerifyEmail}
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        >
                          <Ban className="h-3 w-3" />
                          <span>Ne - Klikněte pro ověření</span>
                        </Button>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground">Administrátor:</p>
                      <p>{selectedUser.is_admin ? "✅ Ano" : "❌ Ne"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleOpenPasswordDialog}
                  className="flex-1 gap-2"
                  variant="outline"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Změnit heslo</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUserDetailOpen(false)}
                >
                  <span className="hidden sm:inline">Zavřít</span>
                  <span className="sm:hidden">✕</span>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Změnit heslo uživatele</DialogTitle>
            <DialogDescription>
              Nastavte nové heslo pro uživatele <strong>{selectedUser?.nickname}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nové heslo *</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimálně 6 znaků"
                disabled={changingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Potvrzení hesla *</Label>
              <Input
                id="confirm-password"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="Zadejte heslo znovu"
                disabled={changingPassword}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1"
              >
                {changingPassword ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Měním...</span>
                  </span>
                ) : (
                  <>
                    <Edit className="h-4 w-4 sm:hidden" />
                    <span className="hidden sm:inline">Změnit heslo</span>
                    <span className="sm:hidden">Změnit</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                disabled={changingPassword}
              >
                <span className="hidden sm:inline">Zrušit</span>
                <span className="sm:hidden">✕</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}