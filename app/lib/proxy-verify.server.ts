import crypto from "crypto";

export function verifyAppProxySignature(urlSearch: string, signature?: string) {
  if (!signature) return false;
  const secret = process.env.SHOPIFY_API_SECRET || "";
  const digest = crypto.createHmac("sha256", secret).update(urlSearch, "utf8").digest("base64");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
