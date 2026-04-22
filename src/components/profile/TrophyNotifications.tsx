import { useEffect, useState } from "react";
import { Trophy, X, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getUnreadTrophyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatPeriodType,
  formatPeriodDate,
  type TrophyWithNotification
} from "@/services/trophyService";
import { FISH_SPECIES_CZ } from "@/lib/constants";

interface TrophyNotificationsProps {
  userId: string;
}

export function TrophyNotifications({ userId }: TrophyNotificationsProps) {
  const [notifications, setNotifications] = useState<TrophyWithNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const data = await getUnreadTrophyNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => (n as any).notification_id !== notificationId));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const handleDismissAll = async () => {
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications([]);
    } catch (error) {
      console.error("Error dismissing all notifications:", error);
    }
  };

  if (loading || notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Nové trofeje
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismissAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Označit vše jako přečtené
        </Button>
      </div>

      {notifications.map((trophy) => (
        <Alert
          key={(trophy as any).notification_id}
          className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20"
        >
          <Medal className="h-5 w-5 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                🎉 Gratulujeme! Získal jsi trofej{" "}
                <span className="text-primary">
                  {trophy.position}. místo {FISH_SPECIES_CZ[trophy.fish_species] || trophy.fish_species}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {formatPeriodType(trophy.period_type)}
                </Badge>
                <span>•</span>
                <span>{formatPeriodDate(trophy.period_end_date, trophy.period_type)}</span>
                <span>•</span>
                <span>{trophy.weight_kg} kg</span>
                <span>•</span>
                <span>{trophy.length_cm} cm</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDismiss((trophy as any).notification_id)}
              className="ml-4 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}