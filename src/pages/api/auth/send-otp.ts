import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

// Email sending function (using Supabase edge function or external service)
async function sendVerificationEmail(email: string, code: string, nickname: string) {
  // For now, we'll use console.log
  // In production, integrate with SendGrid, Resend, or Supabase Edge Function
  console.log(`Sending verification code to ${email}: ${code}`);
  
  // TODO: Implement actual email sending
  // Example with SendGrid/Resend:
  // await sendEmail({
  //   to: email,
  //   subject: "Váš ověřovací kód - Ukaž Rybu",
  //   html: `<p>Ahoj ${nickname}!</p><p>Tvůj 4místný ověřovací kód je: <strong>${code}</strong></p><p>Kód je platný 5 minut.</p>`
  // });
  
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, nickname, password } = req.body;

    // Validate input
    if (!email || !nickname || !password) {
      return res.status(400).json({ 
        error: "Všechna pole jsou povinná" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Neplatný formát emailu" 
      });
    }

    // Validate nickname format
    const nicknameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nicknameRegex.test(nickname)) {
      return res.status(400).json({ 
        error: "Nick může obsahovat pouze písmena, čísla, podtržítka a pomlčky" 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Heslo musí mít alespoň 6 znaků" 
      });
    }

    // Check if email already exists in Supabase Auth
    const { data: existingUsers } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ 
        error: "Tento email je již registrován" 
      });
    }

    // Check if nickname is available
    const { data: existingNickname } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("nickname", nickname)
      .limit(1);

    if (existingNickname && existingNickname.length > 0) {
      return res.status(400).json({ 
        error: "Tento nick je již obsazený" 
      });
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Hash password (in production, use bcrypt or similar)
    // For now, store plain text (Supabase will handle actual hashing when creating user)
    const passwordHash = password; // TODO: Use proper hashing

    // Set expiration (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Delete any existing codes for this email
    await supabase
      .from("email_verification_codes")
      .delete()
      .eq("email", email);

    // Insert code into database
    const { error: insertError } = await supabase
      .from("email_verification_codes")
      .insert({
        email,
        code,
        nickname,
        password_hash: passwordHash,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error("Error inserting verification code:", insertError);
      return res.status(500).json({ 
        error: "Nepodařilo se vygenerovat ověřovací kód" 
      });
    }

    // Send email with code
    await sendVerificationEmail(email, code, nickname);

    return res.status(200).json({ 
      success: true,
      message: "Ověřovací kód byl odeslán na váš email",
      // In development, return code for testing
      ...(process.env.NODE_ENV === "development" && { code })
    });

  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ 
      error: "Došlo k neočekávané chybě" 
    });
  }
}