import { authenticate } from "../shopify.server";

/**
 * Uploads a PNG to Shopify Files and returns the CDN URL.
 * Uses the authenticated Admin client from the Remix template.
 */
export async function uploadPNGToFiles(filename: string, bytes: Buffer): Promise<string> {
  const { admin } = await authenticate.admin(); // relies on the template's session
  // 1) stagedUploadsCreate
  const staged = await admin.graphql(`#graphql
    mutation Staged($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }
  `, { variables: { input: [{ resource: "FILE", filename, mimeType: "image/png", httpMethod: "POST" }] } });
  const stagedJson = await staged.json();
  const target = stagedJson.data.stagedUploadsCreate.stagedTargets[0];

  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([bytes], { type: "image/png" }), filename);
  await fetch(target.url, { method: "POST", body: form });

  // 2) fileCreate
  const create = await admin.graphql(`#graphql
    mutation FileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) { files { id url } userErrors { field message } }
    }
  `, { variables: { files: [{ contentType: "IMAGE", originalSource: target.resourceUrl, filename }] } });
  const createJson = await create.json();
  const url = createJson.data.fileCreate.files[0].url as string;
  return url;
}
