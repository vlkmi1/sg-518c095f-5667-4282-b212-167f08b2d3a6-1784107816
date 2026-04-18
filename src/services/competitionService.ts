import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Competition = Tables<"competitions">;
export type CompetitionParticipant = Tables<"competition_participants">;
export type CompetitionCatch = Tables<"competition_catches">;

export const competitionService = {
  // Create a new competition
  async createCompetition(competitionData: {
    creator_id: string;
    name: string;
    prize_type: string;
    start_date: string;
    end_date: string;
    scoring_type: string;
    top_catches_count: number | null;
    auto_approve: boolean;
  }): Promise<{ data: Competition | null; error: any }> {
    // Generate a random 8-character invite code
    const invite_code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data, error } = await supabase
      .from("competitions")
      .insert([
        {
          ...competitionData,
          invite_code,
        },
      ])
      .select()
      .single();

    console.log("createCompetition:", { data, error });
    
    // Auto-join the creator to their own competition
    if (data) {
      await this.joinCompetition(data.id, competitionData.creator_id);
    }
    
    return { data, error };
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

  // Join a competition
  async joinCompetition(competitionId: string, userId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("competition_participants")
      .insert([
        {
          competition_id: competitionId,
          user_id: userId,
        },
      ]);

    console.log("joinCompetition:", { error });
    return { error };
  },

  // Get competitions user is part of
  async getUserCompetitions(userId: string): Promise<Competition[]> {
    const { data, error } = await supabase
      .from("competition_participants")
      .select(`
        competition_id,
        competitions (*)
      `)
      .eq("user_id", userId);

    console.log("getUserCompetitions:", { data, error });
    if (error) return [];

    return data
      .map((row: any) => row.competitions)
      .filter(Boolean) as Competition[];
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
      
      const score = competition.scoring_type === "length" ? (catchData.length_cm || 0) :
                    competition.scoring_type === "weight" ? (catchData.weight_kg || 0) :
                    ((catchData.length_cm || 0) + (catchData.weight_kg || 0));

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
  }
};