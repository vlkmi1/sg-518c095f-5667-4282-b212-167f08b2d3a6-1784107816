import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code) {
      return res.status(400).json({ 
        error: "Email a kód jsou povinné" 
      });
    }

    // Find verification code
    const { data: verificationData, error: fetchError } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("verified", false)
      .single();

    if (fetchError || !verificationData) {
      return res.status(400).json({ 
        error: "Neplatný nebo expirovaný kód" 
      });
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(verificationData.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ 
        error: "Kód vypršel. Vyžádejte si nový kód." 
      });
    }

    // Create user in Supabase Auth
    // Note: This needs to be done with service role key on the backend
    // For now, we'll use the client (which won't work in production)
    // In production, use Supabase Admin API with service role key
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: verificationData.email,
      password: verificationData.password_hash,
      options: {
        data: {
          nickname: verificationData.nickname,
        },
      },
    });

    if (signUpError) {
      console.error("SignUp error:", signUpError);
      return res.status(500).json({ 
        error: signUpError.message || "Nepodařilo se vytvořit účet" 
      });
    }

    if (!signUpData.user) {
      return res.status(500).json({ 
        error: "Nepodařilo se vytvořit účet" 
      });
    }

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: signUpData.user.id,
        email: verificationData.email,
        nickname: verificationData.nickname,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Account created but profile failed - user can fix this in profile settings
    }

    // Mark code as verified
    await supabase
      .from("email_verification_codes")
      .update({ verified: true })
      .eq("id", verificationData.id);

    // Sign in the user automatically
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: verificationData.email,
      password: verificationData.password_hash,
    });

    if (signInError) {
      return res.status(200).json({ 
        success: true,
        message: "Účet vytvořen úspěšně. Nyní se můžete přihlásit.",
        requiresLogin: true,
      });
    }

    return res.status(200).json({ 
      success: true,
      message: "Účet vytvořen a přihlášen úspěšně",
      user: {
        id: signUpData.user.id,
        email: signUpData.user.email,
        nickname: verificationData.nickname,
      },
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ 
      error: "Došlo k neočekávané chybě" 
    });
  }
}