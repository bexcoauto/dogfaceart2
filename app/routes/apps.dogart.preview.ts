import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import sharp from "sharp";
// import { verifyAppProxySignature } from "../lib/proxy-verify.server"; // Re-enable for production
import { generateLineArtPNG } from "../lib/openai.server";
import { watermarkDiagonal } from "../lib/watermark.server";

const CORS = {
  "Access-Control-Allow-Origin": "*", // DEV ONLY – restrict to your storefront in prod
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

// GET /apps/dogart/preview — health check for wiring
export const loader = async (_args: LoaderFunctionArgs) =>
  json({ ok: true, route: "preview", ts: Date.now() }, { headers: CORS });

// POST /apps/dogart/preview — generate preview (AI raced against fast fallback)
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  // For development we bypass App Proxy HMAC. Re-enable for production.
  // const ok = verifyAppProxySignature(
  //   new URL(request.url).search,
  //   request.headers.get("X-Shopify-Proxy-Signature") || undefined
  // );
  // if (!ok) return new Response("Invalid signature", { status: 401 });

  // Parse form data
  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("image");
    if (f instanceof File) file = f;
  } catch {
    return json({ error: "Invalid form data" }, { status: 400, headers: CORS });
  }
  if (!file) return json({ error: "Missing image" }, { status: 400, headers: CORS });

  // Normalize image (rotate; cap size; HEIC -> JPEG if needed)
  const buf = Buffer.from(await file.arrayBuffer());
  let normalized = buf;
  try {
    const meta = await sharp(buf).metadata();
    if (meta.format === "heic" || meta.format === "heif") {
      normalized = await sharp(buf).jpeg({ quality: 95 }).toBuffer();
    }
    normalized = await sharp(normalized)
      .rotate()
      .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
      .toBuffer();
  } catch {
    normalized = buf;
  }

  try {
    // Fast local fallback (grayscale + threshold) for sub-7s responses
    const fast = await sharp(normalized)
      .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
      .greyscale()
      .threshold(170)
      .toBuffer();

    // Race OpenAI vs ~6.5s deadline (avoid App Proxy timeout)
    const deadlineMs = 6500;
    const clean = await Promise.race<Buffer>([
      generateLineArtPNG(normalized), // preferred (AI)
      new Promise<Buffer>((resolve) => setTimeout(() => resolve(fast), deadlineMs)), // fallback
    ]);

    const wm = await watermarkDiagonal(clean);
    return json({ previewB64: wm.toString("base64") }, { headers: CORS });
  } catch (err: any) {
    console.error("Preview error:", err);
    return json({ error: err?.message || "Preview failed" }, { status: 500, headers: CORS });
  }
};