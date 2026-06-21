import { MongoClient, type Collection } from "mongodb";

// Server-side only. MONGODB_URI hech qachon brauzerga chiqmaydi (VITE_ prefiksi yo'q).
const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "savdo";
const ALLOWED = new Set(["products", "categories", "stores", "settings"]);

type Doc = { _id: string; data: Record<string, unknown> };

// Lambda invokatsiyalari orasida ulanishni qayta ishlatamiz (cold start kamayadi).
let clientPromise: Promise<MongoClient> | null = null;
function connect(): Promise<MongoClient> {
  if (!clientPromise) clientPromise = new MongoClient(uri).connect();
  return clientPromise;
}

async function collection(name: string): Promise<Collection<Doc>> {
  const client = await connect();
  return client.db(dbName).collection<Doc>(name);
}

export default async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const col = url.searchParams.get("col") ?? "";
    const id = url.searchParams.get("id");
    if (!ALLOWED.has(col)) return json({ error: "unknown collection" }, 400);

    const c = await collection(col);

    switch (req.method) {
      case "GET": {
        if (id) {
          // docGet: bitta hujjatning xom data'sini qaytaradi
          const doc = await c.findOne({ _id: id });
          return json(doc ? doc.data : null);
        }
        // colAll: { id, ...data } ko'rinishida ro'yxat
        const docs = await c.find({}).toArray();
        return json(docs.map((d) => ({ id: d._id, ...d.data })));
      }
      case "PUT": {
        const body = await req.json();
        if (id) {
          // docSet: butun item'ni data sifatida saqlaymiz
          await c.updateOne({ _id: id }, { $set: { data: body } }, { upsert: true });
        } else {
          // colSet: body = { id, ...rest }
          const { id: itemId, ...rest } = body as { id: string };
          await c.updateOne({ _id: itemId }, { $set: { data: rest } }, { upsert: true });
        }
        return json({ ok: true });
      }
      case "DELETE": {
        if (id) await c.deleteOne({ _id: id }); // colDel
        else await c.deleteMany({}); // colClear
        return json({ ok: true });
      }
      default:
        return json({ error: "method not allowed" }, 405);
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};

export const config = { path: "/api/db" };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
