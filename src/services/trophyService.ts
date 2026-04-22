import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { FISH_SPECIES_CZ } from "@/lib/constants";

type Trophy = Database["public"]["Tables"]["trophies"]["Row"];
type TrophyNotification = Database["public"]["Tables"]["trophy_notifications"]["Row"];

export interface TrophyWithNotification extends Trophy {
  is_new?: boolean;
}

/**
 * Získat všechny trofeje uživatele
 */
export async function getUserTrophies(userId: string): Promise<Trophy[]> {
  const { data, error } = await supabase
    .from("trophies")
    .select("*")
    .eq("user_id", userId)
    .order("period_end_date", { ascending: false });

  if (error) {
    console.error("Error fetching trophies:", error);
    throw error;
  }

  return data || [];
}

/**
 * Získat nepřečtené notifikace o trofejích
 */
export async function getUnreadTrophyNotifications(userId: string): Promise<TrophyWithNotification[]> {
  const { data, error } = await supabase
    .from("trophy_notifications")
    .select(`
      id,
      is_read,
      created_at,
      trophy:trophy_id (
        id,
        fish_species,
        period_type,
        period_end_date,
        weight_kg,
        length_cm,
        position
      )
    `)
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  // Transform data to include trophy details
  return (data || []).map((notification: any) => ({
    ...notification.trophy,
    is_new: true,
    notification_id: notification.id
  }));
}

/**
 * Označit notifikaci jako přečtenou
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("trophy_notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Označit všechny notifikace jako přečtené
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("trophy_notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Statistiky trofejí uživatele
 */
export interface TrophyStats {
  total: number;
  weekly: number;
  monthly: number;
  yearly: number;
  bySpecies: Record<string, number>;
}

export async function getTrophyStats(userId: string): Promise<TrophyStats> {
  const trophies = await getUserTrophies(userId);

  const stats: TrophyStats = {
    total: trophies.length,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    bySpecies: {}
  };

  trophies.forEach(trophy => {
    if (trophy.period_type === "weekly") stats.weekly++;
    if (trophy.period_type === "monthly") stats.monthly++;
    if (trophy.period_type === "yearly") stats.yearly++;

    stats.bySpecies[trophy.fish_species] = (stats.bySpecies[trophy.fish_species] || 0) + 1;
  });

  return stats;
}

/**
 * Formátování názvu období
 */
export function formatPeriodType(periodType: string): string {
  const map: Record<string, string> = {
    weekly: "Týden",
    monthly: "Měsíc",
    yearly: "Rok"
  };
  return map[periodType] || periodType;
}

/**
 * Získat číslo týdne v roce
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Formátování data období
 */
export function formatPeriodDate(date: string, periodType: string): string {
  const d = new Date(date);
  
  if (periodType === "weekly") {
    const weekNumber = getWeekNumber(d);
    return `${weekNumber}. týdne`;
  }
  
  if (periodType === "monthly") {
    return `${d.getMonth() + 1}. měsíce`;
  }
  
  return `roku ${d.getFullYear()}`;
}

/**
 * Formátování úplného názvu trofeje
 */
export function formatTrophyTitle(fishSpecies: string, periodType: string, periodEndDate: string, position: number): string {
  const speciesName = FISH_SPECIES_CZ[fishSpecies] || fishSpecies;
  const period = formatPeriodDate(periodEndDate, periodType);
  
  return `Trofej ${period} v kategorii ${speciesName} ${position}. místo`;
}