import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export interface CreateProfileData {
  id: string;
  email: string;
  nickname: string;
  full_name?: string;
  avatar_url?: string;
}

export interface UpdateProfileData {
  nickname?: string;
  full_name?: string;
  avatar_url?: string;
}

export const profileService = {
  // Get profile by ID
  async getProfileById(userId: string): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    console.log("getProfileById:", { data, error });
    return { data, error };
  },

  // Get profile by nickname
  async getProfileByNickname(nickname: string): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("nickname", nickname)
      .maybeSingle();

    console.log("getProfileByNickname:", { data, error });
    return { data, error };
  },

  // Get profile by email
  async getProfileByEmail(email: string): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    console.log("getProfileByEmail:", { data, error });
    return { data, error };
  },

  // Create profile
  async createProfile(profileData: CreateProfileData): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: profileData.id,
        email: profileData.email,
        nickname: profileData.nickname,
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
      })
      .select()
      .single();

    console.log("createProfile:", { data, error });
    return { data, error };
  },

  // Update profile
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    console.log("updateProfile:", { data, error });
    return { data, error };
  },

  // Check if nickname is available
  async isNicknameAvailable(nickname: string): Promise<boolean> {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("nickname", nickname)
      .maybeSingle();

    return data === null;
  },

  // Delete profile
  async deleteProfile(userId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    console.log("deleteProfile:", { error });
    return { error };
  },
};