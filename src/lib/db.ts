// Netlify Function (/api/db) orqali MongoDB bilan ishlaydigan klient.
// storage.ts kutadigan colAll/colSet/colDel/colClear/docGet/docSet interfeysini beradi.
const BASE = "/api/db";

async function call(
  method: string,
  params: Record<string, string>,
  body?: unknown
): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}?${qs}`, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`db ${method} ${params.col} failed: ${res.status}`);
  return res.json();
}

export async function colAll<T extends { id: string }>(name: string): Promise<T[]> {
  return (await call("GET", { col: name })) as T[];
}

export async function colSet<T extends { id: string }>(name: string, item: T): Promise<void> {
  await call("PUT", { col: name }, item);
}

export async function colDel(name: string, id: string): Promise<void> {
  await call("DELETE", { col: name, id });
}

export async function colClear(name: string): Promise<void> {
  await call("DELETE", { col: name });
}

export async function docGet<T>(colName: string, docId: string): Promise<T | null> {
  return (await call("GET", { col: colName, id: docId })) as T | null;
}

export async function docSet(colName: string, docId: string, item: object): Promise<void> {
  await call("PUT", { col: colName, id: docId }, item);
}
