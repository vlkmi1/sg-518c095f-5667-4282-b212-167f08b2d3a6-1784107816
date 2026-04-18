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
  }
};