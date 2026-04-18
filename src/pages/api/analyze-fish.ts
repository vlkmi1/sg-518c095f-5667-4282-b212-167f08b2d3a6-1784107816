import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    return res.status(500).json({ 
      error: "OpenAI API key not configured",
      message: "Přidejte OPENAI_API_KEY do environment variables"
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Jsi expert na rozpoznávání sladkovodních ryb. Analyzuj fotografii ryby a vrať JSON s následujícími údaji:
{
  "species": "druh ryby v češtině (Kapr, Amur, Sumec, Štika, Candát, Pstruh, nebo jiný druh)",
  "length_cm": odhadovaná délka v centimetrech (číslo),
  "weight_kg": odhadovaná váha v kilogramech (číslo s desetinnou čárkou),
  "confidence": "high/medium/low - jak si jsi jistý identifikací"
}

Pokud nelze identifikovat rybu nebo odhad je velmi nejistý, vrať null pro příslušnou hodnotu. Délku a váhu odhadni co nejpřesněji podle velikosti ryby a jejího druhu.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyzuj tuto rybu a vrať jen JSON objekt bez dalšího textu."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return res.status(response.status).json({ 
        error: "AI analysis failed",
        details: errorData 
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "No response from AI" });
    }

    // Parse JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return res.status(500).json({ 
        error: "Failed to parse AI response",
        rawResponse: content 
      });
    }

    return res.status(200).json(analysis);
  } catch (error: any) {
    console.error("Fish analysis error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
}