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
    bait_brand: string | null;
    photo_url: string;
    caught_at: string;
  }): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from("catches")
      .insert([catchData])
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

  // Get unique filter values for dropdown options
  async getFilterOptions(): Promise<{
    countries: string[];
    regions: string[];
    districts: string[];
    species: string[];
  }> {
    try {
      const { data: catches } = await supabase
        .from("catches")
        .select("country, region, district, species");

      const countries = [...new Set(catches?.map(c => c.country).filter(Boolean))].sort() as string[];
      const regions = [...new Set(catches?.map(c => c.region).filter(Boolean))].sort() as string[];
      const districts = [...new Set(catches?.map(c => c.district).filter(Boolean))].sort() as string[];
      const species = [...new Set(catches?.map(c => c.species).filter(Boolean))].sort() as string[];

      return { countries, regions, districts, species };
    } catch (error) {
      console.error("getFilterOptions error:", error);
      return { countries: [], regions: [], districts: [], species: [] };
    }
  },
};