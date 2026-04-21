import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

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
  "stika": "Štika obecná",
  "pike": "Štika obecná",
  "northern pike": "Štika obecná",
  "sumec": "Sumec velký",
  "catfish": "Sumec velký",
  "wels catfish": "Sumec velký",
  "wels": "Sumec velký",
};

const ALLOWED_SPECIES = ["Kapr obecný", "Amur bílý", "Štika obecná", "Sumec velký"];

// Calculate weight from reference table with linear interpolation
async function calculateWeightFromTable(
  species: string,
  lengthCm: number
): Promise<number | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get surrounding data points from table
    const { data, error } = await supabase
      .from("fish_weight_table")
      .select("length_cm, weight_kg")
      .eq("species", species)
      .order("length_cm", { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn("No weight data found for species:", species);
      return null;
    }

    // Find exact match
    const exactMatch = data.find((row) => row.length_cm === Math.round(lengthCm));
    if (exactMatch) {
      return exactMatch.weight_kg;
    }

    // Find surrounding points for interpolation
    const roundedLength = Math.round(lengthCm);
    const lowerPoint = data.filter((row) => row.length_cm <= roundedLength).pop();
    const upperPoint = data.find((row) => row.length_cm >= roundedLength);

    if (!lowerPoint && !upperPoint) {
      return null; // Length outside table range
    }

    if (!lowerPoint) {
      return upperPoint!.weight_kg; // Below table range, use first point
    }

    if (!upperPoint) {
      return lowerPoint.weight_kg; // Above table range, use last point
    }

    // Linear interpolation
    const lengthDiff = upperPoint.length_cm - lowerPoint.length_cm;
    const weightDiff = upperPoint.weight_kg - lowerPoint.weight_kg;
    const ratio = lengthDiff === 0 ? 0 : (lengthCm - lowerPoint.length_cm) / lengthDiff;
    const interpolatedWeight = lowerPoint.weight_kg + ratio * weightDiff;

    return Math.round(interpolatedWeight * 100) / 100; // Round to 2 decimals
  } catch (error) {
    console.error("Error calculating weight from table:", error);
    return null;
  }
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
      console.warn("OpenAI API key not configured, returning null values");
      
      // Return null values if API key is not configured
      return res.status(200).json({
        species: null,
        length_cm: null,
        weight_kg: null,
        confidence: "none",
        message: "AI analýza není dostupná. API klíč není nakonfigurován. Vyplňte údaje ručně."
      });
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

KRITÉRIA PRO ROZPOZNÁNÍ DRUHU:
Odpověz POUZE pokud je ryba JEDNOZNAČNĚ jeden z těchto 4 druhů:

1. Kapr obecný (Cyprinus carpio):
   - Plné tělo, velké šupiny
   - 2 páry vousků u úst
   - Zlatohnědá nebo zelenkavá barva

2. Amur bílý (Ctenopharyngodon idella):
   - Protáhlé mohutné tělo
   - Velké šupiny s tmavým lemem
   - Stříbřitá barva, žádné vousky

3. Štika obecná (Esox lucius):
   - Protáhlé tělo, zploštělá hlava
   - Velká tlama plná zubů
   - Zelenkavá s příčnými pruhy/skvrnami

4. Sumec velký (Silurus glanis):
   - Velmi dlouhé tělo bez šupin
   - 3 páry vousků (2 dlouhé u horní čelisti)
   - Šedočerná barva

POKUD:
- Nejsi si na 100% jistý druhem → vrať null
- Ryba je jiný druh (okoun, candát, jelec...) → vrať null
- Fotka je nejasná nebo nevidíš klíčové znaky → vrať null

Délku odhadni v centimetrech podle proporcí těla a poměru k ruce/pozadí.

Odpověz POUZE v JSON formátu:
{
  "species": "Kapr obecný" | "Amur bílý" | "Štika obecná" | "Sumec velký" | null,
  "length_cm": číslo nebo null
}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this fish image. If it's clearly one of the 4 allowed species (Common Carp, Grass Carp, Northern Pike, Wels Catfish), identify it and estimate length. Otherwise return null. Be strict - only identify if you're certain.",
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
        temperature: 0.1,
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
    let analysis;
    try {
      analysis = JSON.parse(content.trim());
    } catch (err) {
      console.error("Failed to parse AI response JSON", err);
      return res.status(200).json({
        species: null,
        length_cm: null,
        weight_kg: null,
        confidence: "none",
        message: "AI analýza vrátila neplatný formát. Vyplňte údaje ručně."
      });
    }
    
    // Normalize species name - only allow specific species
    let normalizedSpecies = null;
    if (analysis.species) {
      const speciesLower = String(analysis.species).toLowerCase();
      const mapped = SPECIES_MAP[speciesLower];
      
      // Only accept if it's one of the allowed species
      if (mapped && ALLOWED_SPECIES.includes(mapped)) {
        normalizedSpecies = mapped;
      }
    }

    // Calculate weight from table if we have length
    let estimatedWeight = null;
    if (normalizedSpecies && analysis.length_cm && analysis.length_cm > 0) {
      estimatedWeight = await calculateWeightFromTable(normalizedSpecies, analysis.length_cm);
    }

    return res.status(200).json({
      species: normalizedSpecies, // null if not recognized or not allowed
      length_cm: analysis.length_cm || null,
      weight_kg: estimatedWeight, // calculated from table interpolation
      confidence: normalizedSpecies ? "high" : "none",
      message: estimatedWeight 
        ? `Rozpoznán druh: ${normalizedSpecies}. Hmotnost vypočtena podle tabulek.`
        : normalizedSpecies
          ? `Rozpoznán druh: ${normalizedSpecies}. Hmotnost zadejte ručně.`
          : "Druh ryby se nepodařilo jednoznačně rozpoznat. Vyplňte údaje ručně."
    });
  } catch (error: any) {
    console.error("AI analysis error:", error);
    
    // Return null values on error
    return res.status(200).json({
      species: null,
      length_cm: null,
      weight_kg: null,
      confidence: "none",
      message: "AI analýza selhala. Vyplňte údaje ručně.",
      error: error.message
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