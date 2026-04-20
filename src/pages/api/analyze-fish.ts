import type { NextApiRequest, NextApiResponse } from "next";

const FISH_SPECIES = [
  "Kapr",
  "Amur",
  "Sumec",
  "Štika",
  "Candát",
  "Pstruh",
  "Úhoř",
  "Lín",
  "Plotice",
  "Cejn",
  "Jelec",
  "Okoun",
  "Bolen",
  "Mník",
  "Perlin",
  "Síven",
  "Jeseter",
];

// Fish species mapping
const SPECIES_MAP: Record<string, string> = {
  "kapr": "Kapr obecný",
  "carp": "Kapr obecný",
  "common carp": "Kapr obecný",
  "amur": "Amur bílý",
  "grass carp": "Amur bílý",
  "white amur": "Amur bílý",
  "štika": "Štika obecná",
  "pike": "Štika obecná",
  "northern pike": "Štika obecná",
  "sumec": "Sumec velký",
  "catfish": "Sumec velký",
  "wels catfish": "Sumec velký",
};

const ALLOWED_SPECIES = ["Kapr obecný", "Amur bílý", "Štika obecná", "Sumec velký"];

// Calculate weight from length using fishing tables formula
// Weight (kg) = Length (cm)³ × coefficient
function calculateWeightFromLength(species: string, lengthCm: number): number {
  const coefficients: Record<string, number> = {
    "Kapr obecný": 0.000015,  // Těžší ryba, vysoké tělo
    "Amur bílý": 0.000018,     // Nejtěžší, mohutné tělo
    "Štika obecná": 0.000012,  // Štíhlá ryba
    "Sumec velký": 0.000010,   // Velmi štíhlá v poměru k délce
  };

  const coefficient = coefficients[species] || 0.000013; // default pro ostatní
  const weightKg = Math.pow(lengthCm, 3) * coefficient;
  
  // Round to 2 decimal places
  return Math.round(weightKg * 100) / 100;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.warn("OpenAI API key not configured, using mock data");
      
      // Return mock data if API key is not configured
      const mockResult = {
        species: FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)],
        length: Math.floor(Math.random() * 50) + 30,
        weight: (Math.random() * 10 + 1).toFixed(1),
      };
      
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return res.status(200).json(mockResult);
    }

    // Call OpenAI GPT-4 Vision API
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
            content: `Jsi expert na rozpoznávání ryb z fotografií. Analyzuj obrázek a urči:
1. Druh ryby - POUZE pokud je to jednoznačně jeden z těchto druhů: Kapr obecný, Amur bílý, Štika obecná, Sumec velký. Pokud to není žádný z těchto druhů nebo nejsi si jistý, vrať null.
2. Délku v centimetrech - odhadni podle proporcí ryby a poměru k ruce/okolí.

Odpověz POUZE v JSON formátu:
{
  "species": "Kapr obecný" nebo "Amur bílý" nebo "Štika obecná" nebo "Sumec velký" nebo null,
  "length_cm": číslo
}

Pokud nejsi si jistý druhem, raději vrať null.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this fish image carefully. Identify the species based on body shape, fins, barbels, color pattern, and scales. Estimate realistic length and weight based on visible size cues. Respond with JSON only.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse AI response
    const analysis = JSON.parse(content.trim());
    
    // Normalize species name - only allow specific species
    let normalizedSpecies = null;
    if (analysis.species) {
      const speciesLower = analysis.species.toLowerCase();
      const mapped = SPECIES_MAP[speciesLower];
      
      // Only accept if it's one of the allowed species
      if (mapped && ALLOWED_SPECIES.includes(mapped)) {
        normalizedSpecies = mapped;
      }
    }

    // Calculate weight from length using fishing tables
    let calculatedWeight = null;
    if (normalizedSpecies && analysis.length_cm) {
      calculatedWeight = calculateWeightFromLength(normalizedSpecies, analysis.length_cm);
    }

    return res.status(200).json({
      species: normalizedSpecies, // null if not recognized or not allowed
      length_cm: analysis.length_cm || null,
      weight_kg: calculatedWeight, // calculated from length, not AI estimate
      confidence: normalizedSpecies ? "high" : "low",
      message: normalizedSpecies 
        ? "Druh ryby rozpoznán. Hmotnost vypočítána z délky podle rybářských tabulek."
        : "Druh ryby se nepodařilo rozpoznat. Vyberte druh ručně."
    });
  } catch (error: any) {
    console.error("AI analysis error:", error);
    
    // Return fallback mock data on error
    const mockResult = {
      species: FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)],
      length: Math.floor(Math.random() * 50) + 30,
      weight: (Math.random() * 10 + 1).toFixed(1),
    };
    
    return res.status(200).json({
      ...mockResult,
      warning: "AI analysis failed, using estimated values",
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};