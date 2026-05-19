import * as XLSX from "xlsx";
import type { Category, Currency, Product, Store, Unit } from "./types";
import {
  calcProfit,
  calcSalePrice,
  fmtMoney,
  genBarcode,
  totalStock,
  uid,
} from "./utils";

// Exact header strings shown in the catalog table.
const HEADERS = [
  "Mahsulot nomi",
  "Shtrix kod",
  "Kategoriya",
  "Sotib olish narxi",
  "Ustama (%)",
  "Sotuv narxi",
  "Valyuta",
  "Foyda",
  "O'lchov",
  "Do'konlar",
  "Umumiy zaxira",
] as const;

const norm = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-()%]+/g, "");

const HEADER_ALIASES: Record<string, string[]> = {
  "Mahsulot nomi": ["mahsulotnomi", "nomi", "name", "product", "mahsulot"],
  "Shtrix kod": ["shtrixkod", "barcode", "shtrix", "kod"],
  Kategoriya: ["kategoriya", "category", "kategoria"],
  "Sotib olish narxi": [
    "sotibolishnarxi",
    "kelishnarxi",
    "purchase",
    "purchaseprice",
    "tannarx",
  ],
  "Ustama (%)": ["ustama", "markup", "ustamafoizi", "foiz"],
  "Sotuv narxi": ["sotuvnarxi", "saleprice", "sale", "narxi"],
  Valyuta: ["valyuta", "currency", "valuta"],
  Foyda: ["foyda", "profit"],
  "O'lchov": ["olchov", "unit", "olchovbirligi"],
  "Do'konlar": ["dokonlar", "stores", "store", "dokon"],
  "Umumiy zaxira": ["umumiyzaxira", "zaxira", "stock", "qoldiq", "miqdor"],
};

const matchHeader = (raw: string): string | null => {
  const n = norm(raw);
  for (const [canon, aliases] of Object.entries(HEADER_ALIASES)) {
    if (n === norm(canon)) return canon;
    if (aliases.some((a) => norm(a) === n)) return canon;
  }
  return null;
};

export function exportProductsXlsx(
  products: Product[],
  categories: Category[],
  stores: Store[]
) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const storeMap = new Map(stores.map((s) => [s.id, s.name]));

  const rows = products.map((p) => ({
    "Mahsulot nomi": p.name,
    "Shtrix kod": p.barcode,
    Kategoriya: p.categoryId ? catMap.get(p.categoryId) ?? "" : "",
    "Sotib olish narxi": p.purchasePrice,
    "Ustama (%)": p.markupPercent,
    "Sotuv narxi": p.salePrice,
    Valyuta: p.currency,
    Foyda: calcProfit(p),
    "O'lchov": p.unit,
    "Do'konlar": p.stocks
      .map(
        (s) =>
          `${storeMap.get(s.storeId) ?? s.storeId}:${s.qty}`
      )
      .join("; "),
    "Umumiy zaxira": totalStock(p),
  }));

  const ws = XLSX.utils.json_to_sheet(rows, { header: [...HEADERS] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Katalog");
  XLSX.writeFile(wb, `katalog-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export interface ImportResult {
  products: Product[];
  newCategories: Category[];
  newStores: Store[];
  skipped: number;
}

const parseNum = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const s = String(v).replace(/[^0-9.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const parseCurrency = (v: unknown): Currency => {
  const s = String(v ?? "").toUpperCase();
  if (s.includes("USD") || s.includes("$") || s === "DOLLAR") return "USD";
  return "UZS";
};

const parseUnit = (v: unknown): Unit => {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  const known: Unit[] = ["dona", "kg", "litr", "metr", "quti", "to'plam"];
  return (known.find((u) => u === s) as Unit) ?? "dona";
};

const parseStores = (
  v: unknown,
  totalFromCol: number,
  existing: Store[]
): { stocks: { storeId: string; qty: number }[]; newStores: Store[] } => {
  const newStores: Store[] = [];
  const stocks: { storeId: string; qty: number }[] = [];
  const text = String(v ?? "").trim();

  if (!text) {
    const main = existing[0];
    if (main) stocks.push({ storeId: main.id, qty: totalFromCol });
    return { stocks, newStores };
  }

  const parts = text.split(/[;,]/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^(.+?)\s*[:=]\s*(\-?\d+(?:\.\d+)?)$/);
    let name: string;
    let qty: number;
    if (m) {
      name = m[1].trim();
      qty = Number(m[2]);
    } else {
      name = part;
      qty = 0;
    }
    let store =
      existing.find((s) => s.name.toLowerCase() === name.toLowerCase()) ??
      newStores.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (!store) {
      store = { id: uid(), name };
      newStores.push(store);
    }
    stocks.push({ storeId: store.id, qty });
  }
  return { stocks, newStores };
};

export async function importProductsXlsx(
  file: File,
  existingCategories: Category[],
  existingStores: Store[]
): Promise<ImportResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });

  const newCategories: Category[] = [];
  const newStores: Store[] = [];
  const products: Product[] = [];
  let skipped = 0;

  for (const raw of rows) {
    const row: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      const canon = matchHeader(k);
      if (canon) row[canon] = v;
    }

    const name = String(row["Mahsulot nomi"] ?? "").trim();
    if (!name) {
      skipped++;
      continue;
    }

    const catName = String(row["Kategoriya"] ?? "").trim();
    let categoryId: string | undefined;
    if (catName) {
      let cat =
        existingCategories.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase()
        ) ??
        newCategories.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase()
        );
      if (!cat) {
        cat = { id: uid(), name: catName, color: "#94a3b8" };
        newCategories.push(cat);
      }
      categoryId = cat.id;
    }

    const purchasePrice = parseNum(row["Sotib olish narxi"]);
    const markupPercent = parseNum(row["Ustama (%)"]);
    const salePriceRaw = parseNum(row["Sotuv narxi"]);
    const salePrice =
      salePriceRaw > 0
        ? salePriceRaw
        : calcSalePrice(purchasePrice, markupPercent);
    const currency = parseCurrency(row["Valyuta"]);
    const unit = parseUnit(row["O'lchov"]);
    const totalFromCol = parseNum(row["Umumiy zaxira"]);
    const { stocks, newStores: ns } = parseStores(
      row["Do'konlar"],
      totalFromCol,
      [...existingStores, ...newStores]
    );
    for (const s of ns) newStores.push(s);

    const barcode = String(row["Shtrix kod"] ?? "").trim() || genBarcode();

    products.push({
      id: uid(),
      name,
      categoryId,
      unit,
      currency,
      purchasePrice,
      markupPercent,
      salePrice,
      barcode,
      stocks,
    });
  }

  return { products, newCategories, newStores, skipped };
}

// Helper so the UI can show a sample of expected columns.
export const expectedHeaders = HEADERS;
export { fmtMoney };
