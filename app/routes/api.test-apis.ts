import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader = async (_args: LoaderFunctionArgs) => {
  const apis = {
    openai: !!process.env.OPENAI_API_KEY,
    replicate: !!process.env.REPLICATE_API_TOKEN,
    stability: !!process.env.STABILITY_API_KEY,
  };

  return json({
    available: apis,
    message: "Check which line art APIs are configured",
    timestamp: new Date().toISOString()
  });
};
