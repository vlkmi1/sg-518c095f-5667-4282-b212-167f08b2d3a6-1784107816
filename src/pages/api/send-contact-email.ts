import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message } = req.body;

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Všechna pole jsou povinná" });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Neplatný email" });
  }

  try {
    // Use Resend API to send email
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set. Email will not be sent.");
      console.log("Contact form submission:", { name, email, message });
      
      // Fallback: Save to database instead
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("contact_messages")
        .insert([{ name, email, message }]);
      
      if (error) {
        console.error("Database save error:", error);
        return res.status(500).json({ error: "Nepodařilo se odeslat zprávu" });
      }
      
      return res.status(200).json({ 
        success: true,
        message: "Zpráva uložena (email služba není nakonfigurována)" 
      });
    }

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Ukaž Rybu <onboarding@resend.dev>",
        to: ["info@ukazrybu.cz"],
        reply_to: email,
        subject: `Nový návrh na vylepšení od ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #186E4E;">Nový návrh na vylepšení - Ukaž Rybu</h2>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Od:</strong> ${name}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <p style="margin: 0 0 10px 0;"><strong>Zpráva:</strong></p>
              <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Tento email byl odeslán z kontaktního formuláře na ukazrybu.cz
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);
      throw new Error("Nepodařilo se odeslat email");
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);

    return res.status(200).json({ 
      success: true,
      message: "Email odeslán úspěšně" 
    });

  } catch (error: any) {
    console.error("Send email error:", error);
    return res.status(500).json({ 
      error: error.message || "Nepodařilo se odeslat zprávu" 
    });
  }
}