import type { Category, Product, Settings, Store } from "./types";
import { colAll, colClear, colDel, colSet, docGet, docSet } from "./lib/db";

const DEFAULT_SETTINGS: Settings = {
  usdRate: 12500,
  displayMode: "original",
  lang: "uz",
};

export const loadProducts = () => colAll<Product>("products");
export const saveProduct = (p: Product) => colSet("products", p);
export const removeProduct = (id: string) => colDel("products", id);

export const loadCategories = () => colAll<Category>("categories");
export const saveCategory = (c: Category) => colSet("categories", c);
export const removeCategory = (id: string) => colDel("categories", id);

export const loadStores = async (): Promise<Store[]> => {
  const list = await colAll<Store>("stores");
  if (list.length === 0) {
    const def: Store = { id: "store-main", name: "Asosiy do'kon" };
    await colSet("stores", def);
    return [def];
  }
  return list;
};
export const saveStore = (s: Store) => colSet("stores", s);
export const removeStore = (id: string) => colDel("stores", id);

export const loadSettings = async (): Promise<Settings> => {
  const s = await docGet<Partial<Settings>>("settings", "main");
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
};
export const saveSettings = (s: Settings) => docSet("settings", "main", s);

export const clearAllData = () =>
  Promise.all([colClear("products"), colClear("categories"), colClear("stores")]);
