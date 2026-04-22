import { supabase } from "@/integrations/supabase/client";

export const adminService = {
  // Check if current user is admin
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("isAdmin error:", error);
        return false;
      }

      return data?.is_admin === true;
    } catch (error) {
      console.error("isAdmin error:", error);
      return false;
    }
  },

  // Get all users
  async getAllUsers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      console.log("getAllUsers:", { count: data?.length });
      return data || [];
    } catch (error) {
      console.error("getAllUsers error:", error);
      throw error;
    }
  },

  // Block/unblock user
  async toggleUserBlock(userId: string, isBlocked: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: isBlocked })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      console.log("toggleUserBlock:", { userId, isBlocked });
    } catch (error) {
      console.error("toggleUserBlock error:", error);
      throw error;
    }
  },

  // Get all catches (including hidden)
  async getAllCatches(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("catches")
        .select(`
          *,
          profiles!catches_user_id_fkey (
            nickname,
            email
          )
        `)
        .order("caught_at", { ascending: false });

      if (error) {
        throw error;
      }

      console.log("getAllCatches:", { count: data?.length });
      return data || [];
    } catch (error) {
      console.error("getAllCatches error:", error);
      throw error;
    }
  },

  // Hide/unhide catch
  async toggleCatchVisibility(catchId: string, isHidden: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from("catches")
        .update({ is_hidden: isHidden })
        .eq("id", catchId);

      if (error) {
        throw error;
      }

      console.log("toggleCatchVisibility:", { catchId, isHidden });
    } catch (error) {
      console.error("toggleCatchVisibility error:", error);
      throw error;
    }
  },

  // Delete catch
  async deleteCatch(catchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("catches")
        .delete()
        .eq("id", catchId);

      if (error) {
        throw error;
      }

      console.log("deleteCatch:", { catchId });
    } catch (error) {
      console.error("deleteCatch error:", error);
      throw error;
    }
  },

  // Delete user profile
  async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) {
        throw error;
      }

      console.log("deleteUser:", { userId });
    } catch (error) {
      console.error("deleteUser error:", error);
      throw error;
    }
  },

  // Get user detail with statistics
  async getUserDetail(userId: string): Promise<any> {
    try {
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      // Get catches count
      const { count: catchesCount, error: catchesError } = await supabase
        .from("catches")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (catchesError) throw catchesError;

      // Get competitions count
      const { count: competitionsCount, error: competitionsError } = await supabase
        .from("competition_participants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (competitionsError) throw competitionsError;

      // Get trophies count
      const { count: trophiesCount, error: trophiesError } = await supabase
        .from("trophies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (trophiesError) throw trophiesError;

      return {
        profile,
        stats: {
          catchesCount: catchesCount || 0,
          competitionsCount: competitionsCount || 0,
          trophiesCount: trophiesCount || 0,
        }
      };
    } catch (error) {
      console.error("getUserDetail error:", error);
      throw error;
    }
  },

  // Change user password (admin only)
  async changeUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      // Call Supabase RPC function to update password
      const { error } = await supabase.rpc("admin_update_user_password", {
        target_user_id: userId,
        new_password: newPassword
      });

      if (error) {
        throw error;
      }

      console.log("changeUserPassword:", { userId });
    } catch (error) {
      console.error("changeUserPassword error:", error);
      throw error;
    }
  },
};