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
};