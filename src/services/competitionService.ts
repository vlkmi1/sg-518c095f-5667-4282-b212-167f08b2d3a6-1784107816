import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Competition = Tables<"competitions">;
export type CompetitionParticipant = Tables<"competition_participants">;
export type CompetitionCatch = Tables<"competition_catches">;

export const competitionService = {
  // Create competition
  async createCompetition(competitionData: {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    scoring_type: string;
    measurement_type?: string | null;
    fish_points?: Record<string, number> | null;
    top_catches_count?: number | null;
    creator_id: string;
    is_public?: boolean;
  }): Promise<{ data: any; error: any }> {
    try {
      // Generate unique join code
      const join_code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from("competitions")
        .insert({
          ...competitionData,
          join_code,
        })
        .select()
        .single();

      if (error) {
        console.error("Create competition error:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error("Create competition error:", error);
      return { data: null, error };
    }
  },

  // Get competition by ID
  async getCompetition(id: string): Promise<{ data: Competition | null; error: any }> {
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  },

  // Get competition by invite code
  async getCompetitionByInviteCode(inviteCode: string): Promise<{ data: Competition | null; error: any }> {
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("invite_code", inviteCode)
      .single();

    return { data, error };
  },

  // Get competition by join code
  async getCompetitionByCode(code: string): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("join_code", code)
      .single();

    console.log("getCompetitionByCode:", { code, data, error });
    return { data, error };
  },

  // Get competition participants
  async getCompetitionParticipants(competitionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("competition_participants")
      .select(`
        *,
        profiles:user_id (
          nickname,
          avatar_url
        )
      `)
      .eq("competition_id", competitionId);

    if (error) {
      console.error("getCompetitionParticipants error:", error);
      return [];
    }
    return data || [];
  },

  // Get competition catches
  async getCompetitionCatches(competitionId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from("catches")
        .select(`
          *,
          profiles!catches_user_id_fkey (
            id,
            nick,
            avatar_url
          )
        `)
        .eq("competition_id", competitionId)
        .order("caught_at", { ascending: false });

      if (error) {
        console.error("Get competition catches error:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error("Get competition catches error:", error);
      return { data: null, error };
    }
  },

  // Join a competition
  async joinCompetition(competitionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("competition_participants")
      .insert({
        competition_id: competitionId,
        user_id: userId,
      });

    if (error) {
      console.error("joinCompetition error:", error);
      throw error;
    }

    console.log("joinCompetition success:", { competitionId, userId });
  },

  // Get competitions user is part of (created OR participating)
  async getUserCompetitions(userId: string): Promise<Competition[]> {
    // Get competitions where user is creator/organizer
    const { data: createdComps, error: createdError } = await supabase
      .from("competitions")
      .select("*")
      .or(`creator_id.eq.${userId},organizer_id.eq.${userId}`);

    // Get competitions where user is participant
    const { data: participantData, error: participantError } = await supabase
      .from("competition_participants")
      .select(`
        competition_id,
        competitions (*)
      `)
      .eq("user_id", userId);

    console.log("getUserCompetitions:", { 
      created: createdComps, 
      createdError,
      participants: participantData,
      participantError
    });

    // Combine both lists and remove duplicates
    const allCompetitions: Competition[] = [];
    const seenIds = new Set<string>();

    // Add created competitions
    if (createdComps) {
      createdComps.forEach((comp) => {
        if (!seenIds.has(comp.id)) {
          allCompetitions.push(comp);
          seenIds.add(comp.id);
        }
      });
    }

    // Add participant competitions
    if (participantData) {
      participantData.forEach((row: any) => {
        const comp = row.competitions;
        if (comp && !seenIds.has(comp.id)) {
          allCompetitions.push(comp);
          seenIds.add(comp.id);
        }
      });
    }

    return allCompetitions;
  },

  // Submit a catch to a competition
  async submitCatchToCompetition(
    competitionId: string, 
    catchId: string, 
    autoApprove: boolean
  ): Promise<{ error: any }> {
    const { error } = await supabase
      .from("competition_catches")
      .insert([
        {
          competition_id: competitionId,
          catch_id: catchId,
          approved: autoApprove,
        },
      ]);

    return { error };
  },

  // Approve a catch (for creators)
  async approveCatch(competitionCatchId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("competition_catches")
      .update({ approved: true })
      .eq("id", competitionCatchId);

    return { error };
  },

  // Get competition leaderboard
  async getLeaderboard(competitionId: string): Promise<any[]> {
    const { data: catches, error } = await supabase
      .from("competition_catches")
      .select(`
        *,
        catches (
          species,
          length_cm,
          weight_kg,
          user_id,
          profiles (
            nickname
          )
        )
      `)
      .eq("competition_id", competitionId)
      .eq("approved", true);

    if (error || !catches) return [];

    const { data: competition } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", competitionId)
      .single();

    if (!competition) return [];

    // Group by user
    const userStats = new Map();

    catches.forEach((c: any) => {
      const catchData = c.catches;
      if (!catchData) return;
      
      const userId = catchData.user_id;
      const nickname = catchData.profiles?.nickname || "Anonym";
      
      let score = 0;

      // Calculate score based on competition type
      if (competition.scoring_type === "points" && competition.scoring_table) {
        // Points-based: use scoring table
        const species = catchData.species;
        score = competition.scoring_table[species] || 0;
      } else {
        // Measurement-based: use length or weight
        score = competition.scoring_metric === "length" 
          ? (catchData.length_cm || 0)
          : competition.scoring_metric === "weight"
          ? (catchData.weight_kg || 0)
          : ((catchData.length_cm || 0) + (catchData.weight_kg || 0));
      }

      if (!userStats.has(userId)) {
        userStats.set(userId, {
          user_id: userId,
          nickname,
          catch_count: 0,
          catches: [],
          total_score: 0
        });
      }

      const stats = userStats.get(userId);
      stats.catch_count += 1;
      stats.catches.push(score);
    });

    // Calculate final scores based on top_catches_count
    const leaderboard = Array.from(userStats.values()).map((stats: any) => {
      // Sort catches descending
      stats.catches.sort((a: number, b: number) => b - a);
      
      // Take top X if specified
      const catchesToCount = competition.top_catches_count 
        ? stats.catches.slice(0, competition.top_catches_count)
        : stats.catches;
        
      stats.total_score = catchesToCount.reduce((sum: number, val: number) => sum + val, 0);
      
      return stats;
    });

    // Sort leaderboard by score descending
    return leaderboard.sort((a, b) => b.total_score - a.total_score);
  },

  // Delete competition
  async deleteCompetition(competitionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("competitions")
        .delete()
        .eq("id", competitionId);

      if (error) {
        throw error;
      }

      console.log("deleteCompetition success:", competitionId);
    } catch (error) {
      console.error("deleteCompetition error:", error);
      throw error;
    }
  },

  // Generate random join code
  generateJoinCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
};