// Rasmni Cloudflare R2'ga yuklaydi:
// 1) funksiyadan presigned PUT URL olamiz
// 2) faylni to'g'ridan R2'ga PUT qilamiz (hajm amalda limitsiz)
// 3) MongoDB uchun ommaviy URL qaytaramiz
export async function uploadImage(file: File): Promise<string> {
  const res = await fetch(`/api/upload-url?name=${encodeURIComponent(file.name)}`);
  if (!res.ok) throw new Error(`upload-url failed: ${res.status}`);
  const { uploadUrl, publicUrl } = (await res.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "content-type": file.type || "application/octet-stream" },
  });
  if (!put.ok) throw new Error(`r2 upload failed: ${put.status}`);

  return publicUrl;
}
