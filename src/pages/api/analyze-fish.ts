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

    // For now, return mock data
    // In production, this would call an actual AI vision API like OpenAI GPT-4 Vision
    const mockResult = {
      species: FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)],
      length: Math.floor(Math.random() * 50) + 30, // 30-80 cm
      weight: (Math.random() * 10 + 1).toFixed(1), // 1-11 kg
    };

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return res.status(200).json(mockResult);
  } catch (error: any) {
    console.error("AI analysis error:", error);
    return res.status(500).json({ 
      error: "AI analysis failed",
      details: error.message 
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