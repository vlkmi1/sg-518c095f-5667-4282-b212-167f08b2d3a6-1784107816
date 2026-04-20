import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/layout/Header";
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
import { Shield, Users, Fish, Ban, CheckCircle, Eye, EyeOff, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
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
    try {
      const [usersData, catchesData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllCatches(),
      ]);

      setUsers(usersData);
      setCatches(catchesData);
    } catch (error) {
      console.error("Load data error:", error);
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

  if (isLoading) {
    return (
      <>
        <SEO title="Admin - Načítání..." />
        <div className="min-h-screen bg-background">
          <Header />
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
        <Header />
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
                        <h3 className="font-serif font-semibold text-lg">{catchItem.species}</h3>
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
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant={catchItem.is_hidden ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => handleToggleCatchVisibility(catchItem.id, catchItem.is_hidden)}
                          disabled={processingId === catchItem.id}
                          className="flex-1 gap-1"
                        >
                          {catchItem.is_hidden ? (
                            <>
                              <Eye className="h-3 w-3" />
                              Zobrazit
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Skrýt
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={processingId === catchItem.id}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Opravdu smazat úlovek?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tato akce je nevratná. Úlovek bude trvale odstraněn.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Zrušit</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCatch(catchItem.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Smazat
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}