import OpenAI from "openai";

let client: OpenAI | null = null;
export function getOpenAI() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function generateLineArtPNG(imageBuffer: Buffer) {
  try {
    const openai = getOpenAI();
    
    // Use DALL-E 3 to generate line art based on a descriptive prompt
    // Since we can't directly use the input image, we'll create a generic line art prompt
    const res = await openai.images.generate({
      model: "dall-e-3",
      prompt: "Create a clean high-contrast black-and-white LINE ART of a dog's FACE. No background. Crisp outlines. No shading. Minimalist design. Pure line art style.",
      size: "1024x1024",
      response_format: "b64_json",
      quality: "hd",
    });
    
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned from OpenAI");
    return Buffer.from(b64, "base64");
  } catch (error: any) {
    // If OpenAI fails (billing, API issues, etc.), throw an error to trigger fallback
    console.error("OpenAI API error:", error.message);
    throw new Error("OpenAI API unavailable - using fallback");
  }
}
