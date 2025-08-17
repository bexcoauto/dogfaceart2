import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

// Redirect from /apps/dogart/finalize/ to /apps/dogart/finalize
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const newPath = url.pathname.replace(/\/$/, ''); // Remove trailing slash
  return redirect(newPath + url.search);
};
