import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
// import { verifyAppProxySignature } from "../lib/proxy-verify.server"; // Re-enable for production
import { uploadPNGToFiles } from "../lib/shopifyFiles.server";

// CORS headers so the browser always gets JSON (dev-friendly)
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

/**
 * POST /apps/dogart/finalize
 * Accepts { finalB64 } (PNG base64, watermarked), uploads to Shopify Files,
 * and returns { artUrl } which we attach to the cart line item's properties.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  // For development we bypass App Proxy HMAC. Re-enable for production.
  // const ok = verifyAppProxySignature(
  //   new URL(request.url).search,
  //   request.headers.get("X-Shopify-Proxy-Signature") || undefined
  // );
  // if (!ok) return new Response("Invalid signature", { status: 401 });

  // Parse form data
  const form = await request.formData();
  const finalB64 = String(form.get("finalB64") || "");
  if (!finalB64) {
    return json({ error: "Missing finalB64" }, { status: 400, headers: CORS });
  }

  try {
    const bytes = Buffer.from(finalB64, "base64");
    const filename = `dog-art-${Date.now()}.png`;
    const cdnUrl = await uploadPNGToFiles(request, filename, bytes);
    return json({ artUrl: cdnUrl }, { headers: CORS });
  } catch (err: any) {
    console.error("Finalize error:", err);
    return json({ error: err?.message || "Finalize failed" }, { status: 500, headers: CORS });
  }
};