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
            content: `Na základě fotografie určete druh ryby a odhadněte její délku a hmotnost. Jedná se o sladkovodní rybu ulovenou v České republice.

Postupuj systematicky:

1. Nejprve analyzuj perspektivu (zda je ryba blíže k objektivu než člověk) a uprav odhad velikosti tak, aby nedošlo k nadhodnocení.
2. Najdi na fotografii referenční objekt (ruka, prut, podložka apod.) a použij ho pro odhad délky. Pokud chybí, uveď širší interval.
3. Odhadni délku ryby v cm (uveď interval i nejpravděpodobnější hodnotu).
4. Na základě délky a tělesné stavby (hubená / průměrná / vysoká kondice) odhadni hmotnost.
5. Uveď druh ryby (česky i latinsky) a pravděpodobnost v %.
6. Přidej 2–3 podobné druhy, které přicházejí v úvahu, a vysvětli rozdíly.
7. Stručně vysvětli, podle jakých znaků (tvar těla, ploutve, šupiny, vousky) jsi rozhodl.

Pokud si nejsi jistý, přiznej nejistotu a rozšiř intervaly.

Odpověz POUZE v JSON formátu:
{
  "species_cz": "český název" nebo null,
  "species_lat": "latinský název" nebo null,
  "confidence_percent": číslo 0-100,
  "length_min_cm": minimální délka,
  "length_max_cm": maximální délka,
  "length_cm": nejpravděpodobnější délka,
  "weight_kg": odhadovaná hmotnost nebo null,
  "body_condition": "hubená" | "průměrná" | "vysoká kondice",
  "perspective_note": "poznámka k perspektivě",
  "reference_object": "popis referenčního objektu" nebo null,
  "identification_notes": "podle jakých znaků určeno",
  "similar_species": [
    {
      "species_cz": "název",
      "species_lat": "latinský",
      "difference": "jak rozlišit"
    }
  ]
}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this freshwater fish caught in Czech Republic. Provide detailed systematic analysis including perspective, reference objects, length interval, weight estimate, species identification with confidence, and similar species.",
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
        max_tokens: 1000,
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

    console.log("Raw AI response:", content);

    // Parse AI response - strip markdown code blocks if present
    let analysis;
    try {
      // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
      let cleanContent = content.trim();
      
      // Check for markdown code blocks
      if (cleanContent.startsWith("```")) {
        // Remove opening ```json or ```
        cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/, "");
        // Remove closing ```
        cleanContent = cleanContent.replace(/\n?```\s*$/, "");
      }
      
      // Try to parse cleaned content
      analysis = JSON.parse(cleanContent.trim());
      console.log("Parsed AI analysis:", analysis);
    } catch (err) {
      console.error("Failed to parse AI response JSON:", err);
      console.error("Content that failed to parse:", content);
      return res.status(200).json({
        species: null,
        length_cm: null,
        weight_kg: null,
        confidence: "none",
        message: "AI analýza vrátila neplatný formát. Vyplňte údaje ručně.",
        debug_content: content.substring(0, 200) // First 200 chars for debugging
      });
    }
    
    // Use AI's detailed analysis
    const speciesCz = analysis.species_cz || null;
    const lengthCm = analysis.length_cm || null;
    const confidencePercent = analysis.confidence_percent || 0;
    
    // Calculate weight from table if we have species and length
    let estimatedWeight = analysis.weight_kg || null;
    if (speciesCz && lengthCm && lengthCm > 0) {
      // Try to get weight from our reference table
      const tableWeight = await calculateWeightFromTable(speciesCz, lengthCm);
      if (tableWeight) {
        estimatedWeight = tableWeight;
      }
    }

    // Build detailed message
    const confidenceLevel = confidencePercent >= 80 ? "vysoká" : confidencePercent >= 50 ? "střední" : "nízká";
    let detailedMessage = `Analýza dokončena (jistota: ${confidenceLevel} - ${confidencePercent}%).\n`;
    
    if (speciesCz) {
      detailedMessage += `Druh: ${speciesCz}`;
      if (analysis.species_lat) {
        detailedMessage += ` (${analysis.species_lat})`;
      }
      detailedMessage += `\n`;
    }
    
    if (analysis.length_min_cm && analysis.length_max_cm) {
      detailedMessage += `Interval délky: ${analysis.length_min_cm}-${analysis.length_max_cm} cm\n`;
    }
    
    if (analysis.body_condition) {
      detailedMessage += `Kondice: ${analysis.body_condition}\n`;
    }
    
    if (analysis.identification_notes) {
      detailedMessage += `Poznámky: ${analysis.identification_notes}\n`;
    }
    
    if (analysis.similar_species && analysis.similar_species.length > 0) {
      detailedMessage += `\nPodobné druhy: `;
      detailedMessage += analysis.similar_species
        .map((s: any) => `${s.species_cz} (${s.difference})`)
        .join(", ");
    }

    return res.status(200).json({
      species: speciesCz,
      length_cm: lengthCm,
      weight_kg: estimatedWeight,
      confidence: confidenceLevel,
      confidence_percent: confidencePercent,
      length_interval: analysis.length_min_cm && analysis.length_max_cm 
        ? `${analysis.length_min_cm}-${analysis.length_max_cm} cm`
        : null,
      body_condition: analysis.body_condition || null,
      perspective_note: analysis.perspective_note || null,
      reference_object: analysis.reference_object || null,
      identification_notes: analysis.identification_notes || null,
      similar_species: analysis.similar_species || [],
      message: detailedMessage.trim()
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