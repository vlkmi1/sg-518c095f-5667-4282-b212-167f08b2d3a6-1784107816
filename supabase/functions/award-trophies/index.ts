import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Trophy {
  user_id: string;
  fish_species: string;
  period_type: "weekly" | "monthly" | "yearly";
  period_end_date: string;
  weight_kg: number;
  length_cm: number;
  position: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    console.log("Starting trophy award process for:", today);

    // Determine which periods end today
    const isEndOfWeek = now.getDay() === 0; // Sunday
    const isEndOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() === now.getDate();
    const isEndOfYear = now.getMonth() === 11 && now.getDate() === 31;

    const periodsToProcess: Array<"weekly" | "monthly" | "yearly"> = [];
    if (isEndOfWeek) periodsToProcess.push("weekly");
    if (isEndOfMonth) periodsToProcess.push("monthly");
    if (isEndOfYear) periodsToProcess.push("yearly");

    if (periodsToProcess.length === 0) {
      console.log("No periods ending today");
      return new Response(
        JSON.stringify({ message: "No periods ending today", date: today }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing periods:", periodsToProcess);

    // Get all fish species from catches
    const { data: catches } = await supabaseClient
      .from("catches")
      .select("species")
      .not("species", "is", null);

    const uniqueSpecies = [...new Set((catches || []).map((c: any) => c.species))];
    console.log("Processing species:", uniqueSpecies);

    const newTrophies: Trophy[] = [];

    // Process each period type
    for (const periodType of periodsToProcess) {
      for (const species of uniqueSpecies) {
        // Get top 3 catches for this species
        const { data: topCatches } = await supabaseClient
          .from("catches")
          .select("user_id, weight_kg, length_cm")
          .eq("species", species)
          .not("weight_kg", "is", null)
          .not("length_cm", "is", null)
          .order("weight_kg", { ascending: false })
          .order("length_cm", { ascending: false })
          .limit(3);

        if (!topCatches || topCatches.length === 0) continue;

        // Award trophies to top 3
        for (let i = 0; i < topCatches.length; i++) {
          const catchData = topCatches[i];
          const position = i + 1;

          newTrophies.push({
            user_id: catchData.user_id,
            fish_species: species,
            period_type: periodType,
            period_end_date: today,
            weight_kg: catchData.weight_kg,
            length_cm: catchData.length_cm,
            position,
          });
        }
      }
    }

    console.log(`Awarding ${newTrophies.length} trophies`);

    // Insert trophies (using ON CONFLICT to avoid duplicates)
    if (newTrophies.length > 0) {
      const { error: trophyError } = await supabaseClient
        .from("trophies")
        .upsert(newTrophies, {
          onConflict: "user_id,fish_species,period_type,period_end_date,position",
          ignoreDuplicates: false,
        });

      if (trophyError) {
        console.error("Error inserting trophies:", trophyError);
        throw trophyError;
      }

      // Get the inserted trophies to create notifications
      const { data: insertedTrophies } = await supabaseClient
        .from("trophies")
        .select("id, user_id")
        .eq("period_end_date", today);

      if (insertedTrophies && insertedTrophies.length > 0) {
        const notifications = insertedTrophies.map((trophy: any) => ({
          user_id: trophy.user_id,
          trophy_id: trophy.id,
          is_read: false,
        }));

        const { error: notifError } = await supabaseClient
          .from("trophy_notifications")
          .insert(notifications);

        if (notifError) {
          console.error("Error creating notifications:", notifError);
        } else {
          console.log(`Created ${notifications.length} notifications`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        periods: periodsToProcess,
        trophiesAwarded: newTrophies.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in award-trophies function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});