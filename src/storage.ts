import type { Category, Product, Settings, Store } from "./types";

const KEY_PRODUCTS = "savdo.products";
const KEY_CATEGORIES = "savdo.categories";
const KEY_STORES = "savdo.stores";
const KEY_SETTINGS = "savdo.settings";

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value));

export const loadProducts = (): Product[] => read<Product[]>(KEY_PRODUCTS, []);
export const saveProducts = (p: Product[]) => write(KEY_PRODUCTS, p);

export const loadCategories = (): Category[] =>
  read<Category[]>(KEY_CATEGORIES, []);
export const saveCategories = (c: Category[]) => write(KEY_CATEGORIES, c);

export const loadStores = (): Store[] =>
  read<Store[]>(KEY_STORES, [{ id: "store-main", name: "Asosiy do'kon" }]);
export const saveStores = (s: Store[]) => write(KEY_STORES, s);

const DEFAULT_SETTINGS: Settings = {
  usdRate: 12500,
  displayMode: "original",
  lang: "uz",
};

export const loadSettings = (): Settings => {
  const s = read<Partial<Settings>>(KEY_SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...s };
};
export const saveSettings = (s: Settings) => write(KEY_SETTINGS, s);
