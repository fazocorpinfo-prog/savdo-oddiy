import { AwsClient } from "aws4fetch";

// Server-side only. R2 maxfiy kalitlari brauzerga chiqmaydi.
const accountId = process.env.R2_ACCOUNT_ID || "";
const bucket = process.env.R2_BUCKET || "";
const publicBase = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");

const aws = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  region: "auto",
  service: "s3",
});

// Brauzer bu yerdan presigned PUT URL oladi va faylni to'g'ridan R2'ga yuklaydi
// (Netlify Function'ning 6MB chekiga urilmaydi — hajm amalda limitsiz).
export default async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const name = (url.searchParams.get("name") || "file").replace(/[^\w.\-]+/g, "_");
    const key = `products/${Date.now()}-${name}`;

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}?X-Amz-Expires=600`;
    const signed = await aws.sign(endpoint, { method: "PUT", aws: { signQuery: true } });

    return json({ uploadUrl: signed.url, publicUrl: `${publicBase}/${key}` });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};

export const config = { path: "/api/upload-url" };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
