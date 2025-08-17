import OpenAI from "openai";

let client: OpenAI | null = null;
export function getOpenAI() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function generateLineArtPNG(imageBuffer: Buffer) {
  const openai = getOpenAI();
  const res = await openai.images.edits({
    model: "gpt-image-1",
    image: imageBuffer as any,
    prompt:
      "Convert this dog photo into clean high-contrast black-and-white LINE ART of the dog's FACE only. No background. Crisp outlines. No shading. Remove collars/tags if visible.",
    size: "1024x1024",
    response_format: "b64_json",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from OpenAI");
  return Buffer.from(b64, "base64");
}
