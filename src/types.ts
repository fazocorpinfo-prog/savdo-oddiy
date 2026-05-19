export type Currency = "UZS" | "USD";

export type Unit = "dona" | "kg" | "litr" | "metr" | "quti" | "to'plam";

export const UNITS: Unit[] = ["dona", "kg", "litr", "metr", "quti", "to'plam"];

export type Lang = "uz" | "ru";

export type DisplayMode = "original" | "uzs" | "usd";

export interface Settings {
  usdRate: number;
  displayMode: DisplayMode;
  lang: Lang;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface StoreStock {
  storeId: string;
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  image?: string;
  brand?: string;
  brandPhone?: string;
  categoryId?: string;
  unit: Unit;
  currency: Currency;
  purchasePrice: number;
  markupPercent: number;
  salePrice: number;
  barcode: string;
  description?: string;
  stocks: StoreStock[];
}

export type PageKey = "catalog" | "categories" | "settings";
