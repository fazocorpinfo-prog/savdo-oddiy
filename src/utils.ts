import type { Currency, DisplayMode, Product, Settings } from "./types";

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const genBarcode = (): string => {
  let s = "";
  for (let i = 0; i < 12; i++) s += Math.floor(Math.random() * 10).toString();
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(s[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return s + check;
};

export const calcSalePrice = (purchase: number, markup: number): number =>
  Math.round(purchase * (1 + markup / 100));

export const calcProfit = (p: Product): number => p.salePrice - p.purchasePrice;

export const totalStock = (p: Product): number =>
  p.stocks.reduce((s, x) => s + (Number(x.qty) || 0), 0);

const nf = new Intl.NumberFormat("uz-UZ");

export const fmtNumber = (v: number): string => nf.format(v);

export const fmtMoney = (v: number, c: Currency): string => {
  const s = nf.format(Math.round(v));
  return c === "USD" ? `${s} $` : `${s} so'm`;
};

export const convertPrice = (
  v: number,
  from: Currency,
  to: Currency,
  rate: number
): number => {
  if (from === to) return v;
  if (from === "USD" && to === "UZS") return v * rate;
  if (from === "UZS" && to === "USD") return rate > 0 ? v / rate : 0;
  return v;
};

export const displayPrice = (
  v: number,
  origCurrency: Currency,
  settings: Settings
): { value: number; currency: Currency; text: string } => {
  const mode: DisplayMode = settings.displayMode;
  let target: Currency = origCurrency;
  if (mode === "uzs") target = "UZS";
  else if (mode === "usd") target = "USD";
  const value = convertPrice(v, origCurrency, target, settings.usdRate);
  return { value, currency: target, text: fmtMoney(value, target) };
};
