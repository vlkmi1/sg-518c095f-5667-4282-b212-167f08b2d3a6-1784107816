import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Catch = Tables<"catches">;

export interface CatchWithProfile extends Catch {
  profiles?: {
    nickname: string | null;
  };
}

export interface CatchFilters {
  country?: string;
  region?: string;
  district?: string;
  species?: string;
}

export const catchService = {
  // Get all catches with optional filtering
  async getCatches(filters?: CatchFilters): Promise<{ data: CatchWithProfile[] | null; error: any }> {
    try {
      let query = supabase
        .from("catches")
        .select(`
          *,
          profiles!catches_user_id_fkey(nickname)
        `)
        .order("caught_at", { ascending: false });

      if (filters?.country) {
        query = query.eq("country", filters.country);
      }
      if (filters?.region) {
        query = query.eq("region", filters.region);
      }
      if (filters?.district) {
        query = query.eq("district", filters.district);
      }
      if (filters?.species) {
        query = query.eq("species", filters.species);
      }

      const { data, error } = await query;

      console.log("getCatches:", { data, error, filters });
      return { data: data || [], error };
    } catch (error) {
      console.error("getCatches error:", error);
      return { data: null, error };
    }
  },

  // Get single catch by ID
  async getCatchById(id: string): Promise<{ data: CatchWithProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from("catches")
        .select(`
          *,
          profiles!catches_user_id_fkey(nickname)
        `)
        .eq("id", id)
        .maybeSingle();

      console.log("getCatchById:", { data, error, id });
      return { data, error };
    } catch (error) {
      console.error("getCatchById error:", error);
      return { data: null, error };
    }
  },

  // Get catches by user ID
  async getCatchesByUserId(userId: string): Promise<{ data: CatchWithProfile[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from("catches")
        .select(`
          *,
          profiles!catches_user_id_fkey(nickname)
        `)
        .eq("user_id", userId)
        .order("caught_at", { ascending: false });

      console.log("getCatchesByUserId:", { data, error, userId });
      return { data: data || [], error };
    } catch (error) {
      console.error("getCatchesByUserId error:", error);
      return { data: null, error };
    }
  },

  // Create new catch
  async createCatch(catchData: {
    user_id: string;
    species: string;
    length_cm: number | null;
    weight_kg: number | null;
    country: string | null;
    region: string | null;
    district: string | null;
    latitude?: number | null;
    longitude?: number | null;
    fishing_area?: string | null;
    bait_brand: string | null;
    notes?: string | null;
    photo_url: string;
    caught_at: string;
    is_public?: boolean;
    competition_id?: string | null;
  }): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from("catches")
      .insert([{
        ...catchData,
        is_public: catchData.is_public ?? true,
      }])
      .select()
      .single();

    console.log("createCatch:", { data, error });
    return { data, error };
  },

  // Get user's catches
  async getUserCatches(userId: string): Promise<Tables<"catches">[]> {
    const { data, error } = await supabase
      .from("catches")
      .select("*")
      .eq("user_id", userId)
      .order("caught_at", { ascending: false });

    console.log("getUserCatches:", { data, error });
    if (error) {
      console.error("getUserCatches error:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  // Get user's biggest catch (by length)
  async getUserBiggestCatch(userId: string): Promise<Tables<"catches"> | null> {
    const { data, error } = await supabase
      .from("catches")
      .select("*")
      .eq("user_id", userId)
      .not("length_cm", "is", null)
      .order("length_cm", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("getUserBiggestCatch:", { data, error });
    if (error) {
      console.error("getUserBiggestCatch error:", error);
      return null;
    }

    return data;
  },

  // Get user's heaviest catch (by weight)
  async getUserHeaviestCatch(userId: string): Promise<Tables<"catches"> | null> {
    const { data, error } = await supabase
      .from("catches")
      .select("*")
      .eq("user_id", userId)
      .not("weight_kg", "is", null)
      .order("weight_kg", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("getUserHeaviestCatch:", { data, error });
    if (error) {
      console.error("getUserHeaviestCatch error:", error);
      return null;
    }

    return data;
  },

  // Check if catch made it to Hall of Fame
  async checkHallOfFamePosition(catchId: string): Promise<{
    inHallOfFame: boolean;
    period?: "week" | "month" | "year" | "all";
    position?: number;
    species?: string;
  }> {
    try {
      // Get the catch details
      const { data: catchData, error: catchError } = await supabase
        .from("catches")
        .select("*")
        .eq("id", catchId)
        .single();

      if (catchError || !catchData) {
        console.error("Error fetching catch:", catchError);
        return { inHallOfFame: false };
      }

      const { species, length_cm, weight_kg } = catchData;

      // Determine sort column based on species
      const isHeavyFish = species === "Kapr obecný" || species === "Amur bílý";
      const sortColumn = isHeavyFish ? "weight_kg" : "length_cm";
      const catchValue = isHeavyFish ? weight_kg : length_cm;

      if (!catchValue) {
        return { inHallOfFame: false };
      }

      // Check different time periods
      const periods: Array<{ key: "week" | "month" | "year" | "all"; days: number | null }> = [
        { key: "week", days: 7 },
        { key: "month", days: 30 },
        { key: "year", days: 365 },
        { key: "all", days: null },
      ];

      for (const period of periods) {
        let query = supabase
          .from("catches")
          .select("id")
          .eq("species", species)
          .not(sortColumn, "is", null)
          .order(sortColumn, { ascending: false })
          .limit(3);

        // Add time filter for non-all periods
        if (period.days) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - period.days);
          query = query.gte("caught_at", startDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Error checking ${period.key} hall of fame:`, error);
          continue;
        }

        // Check if our catch is in top 3
        const position = (data || []).findIndex((c) => c.id === catchId);
        
        if (position !== -1 && position < 3) {
          return {
            inHallOfFame: true,
            period: period.key,
            position: position + 1, // 1-indexed
            species,
          };
        }
      }

      return { inHallOfFame: false };
    } catch (error) {
      console.error("Error in checkHallOfFamePosition:", error);
      return { inHallOfFame: false };
    }
  },

  // Get unique filter values for dropdown options
  async getFilterOptions(): Promise<{
    countries: string[];
    regions: string[];
    districts: string[];
    species: string[];
  }> {
    const { data: catches } = await supabase
      .from("catches")
      .select("country, region, district, species")
      .eq("is_public", true);

    if (!catches) {
      return { countries: [], regions: [], districts: [], species: [] };
    }

    const countries = [...new Set(catches.map((c: any) => c.country).filter(Boolean))].sort();
    const regions = [...new Set(catches.map((c: any) => c.region).filter(Boolean))].sort();
    const districts = [...new Set(catches.map((c: any) => c.district).filter(Boolean))].sort();
    const species = [...new Set(catches.map((c: any) => c.species).filter(Boolean))].sort();

    return { countries, regions, districts, species };
  },

  // Update catch
  async updateCatch(catchId: string, updates: any): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from("catches")
      .update(updates)
      .eq("id", catchId)
      .select()
      .single();

    console.log("updateCatch:", { data, error });
    return { data, error };
  },

  // Delete catch
  async deleteCatch(catchId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("catches")
      .delete()
      .eq("id", catchId);

    console.log("deleteCatch:", { catchId, error });
    return { error };
  },

  // Get top catches by species for Hall of Fame
  async getTopCatchesBySpecies(species: string, limit: number = 3): Promise<any[]> {
    const { data, error } = await supabase
      .from("catches")
      .select(`
        *,
        profiles (
          nickname
        )
      `)
      .eq("species", species)
      .eq("is_public", true)
      .not("length_cm", "is", null)
      .not("weight_kg", "is", null)
      .order("length_cm", { ascending: false })
      .limit(limit);

    console.log("getTopCatchesBySpecies:", { species, data, error });
    
    if (error) {
      console.error("getTopCatchesBySpecies error:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  // Get top catches by species and time period for Hall of Fame
  async getTopCatchesBySpeciesAndPeriod(
    species: string, 
    period: "week" | "month" | "year" | "all", 
    limit: number = 3
  ): Promise<any[]> {
    const now = new Date();
    let dateFilter: string | null = null;

    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = weekAgo.toISOString();
    } else if (period === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = monthStart.toISOString();
    } else if (period === "year") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      dateFilter = yearStart.toISOString();
    }

    let query = supabase
      .from("catches")
      .select(`
        *,
        profiles (
          nickname
        )
      `)
      .eq("species", species)
      .eq("is_public", true)
      .not("length_cm", "is", null)
      .not("weight_kg", "is", null);

    if (dateFilter) {
      query = query.gte("caught_at", dateFilter);
    }

    const { data, error } = await query
      .order("length_cm", { ascending: false })
      .limit(limit);

    console.log("getTopCatchesBySpeciesAndPeriod:", { species, period, dateFilter, data, error });
    
    if (error) {
      console.error("getTopCatchesBySpeciesAndPeriod error:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },
};