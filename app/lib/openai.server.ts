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
    
    // Try DALL-E 3 first with enhanced prompt
    try {
      const res = await openai.images.generate({
        model: "dall-e-3",
        prompt: "Create a detailed black and white LINE ART portrait of a dog's face. Focus on the dog's facial features: eyes, nose, mouth, ears, and fur patterns. Use clean, crisp lines with no shading or background. Make it look like a professional line art illustration. The style should be minimalist but detailed enough to capture the dog's unique features. Pure black lines on white background.",
        size: "1024x1024",
        response_format: "b64_json",
        quality: "hd",
      });
      
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) throw new Error("No image returned from OpenAI");
      return Buffer.from(b64, "base64");
    } catch (dalle3Error) {
      console.log("DALL-E 3 failed, trying DALL-E 2...");
      
      // Fallback to DALL-E 2 with image variation
      const res = await openai.images.createVariation({
        image: imageBuffer as any,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });
      
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) throw new Error("No image returned from OpenAI");
      return Buffer.from(b64, "base64");
    }
  } catch (error: any) {
    // If OpenAI fails (billing, API issues, etc.), throw an error to trigger fallback
    console.error("OpenAI API error:", error.message);
    throw new Error("OpenAI API unavailable - using fallback");
  }
}
