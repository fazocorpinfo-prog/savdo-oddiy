import { useMemo, useRef, useState } from "react";
import type {
  Category,
  Currency,
  Lang,
  Product,
  Store,
  StoreStock,
  Unit,
} from "../types";
import { UNITS } from "../types";
import { t } from "../i18n";
import { calcSalePrice, genBarcode, uid } from "../utils";
import {
  IconChevronDown,
  IconClose,
  IconPlus,
  IconUpload,
} from "./icons";

interface Props {
  editing?: Product;
  categories: Category[];
  stores: Store[];
  lang: Lang;
  onClose: () => void;
  onSave: (p: Product) => void;
  onRequestNewCategory: (cb: (c: Category) => void) => void;
  onAddStore: (name: string) => Store;
}

const EMPTY: Product = {
  id: "",
  name: "",
  brand: "",
  brandPhone: "",
  categoryId: undefined,
  unit: "dona",
  currency: "UZS",
  purchasePrice: 0,
  markupPercent: 20,
  salePrice: 0,
  barcode: "",
  description: "",
  stocks: [],
};

export default function ProductFormModal({
  editing,
  categories,
  stores,
  lang,
  onClose,
  onSave,
  onRequestNewCategory,
  onAddStore,
}: Props) {
  const [form, setForm] = useState<Product>(() =>
    editing
      ? { ...editing }
      : {
          ...EMPTY,
          id: uid(),
          stocks: stores.map((s) => ({ storeId: s.id, qty: 0 })),
        }
  );
  const [autoBarcode, setAutoBarcode] = useState<boolean>(
    !editing || !editing.barcode
  );
  const [showStores, setShowStores] = useState(true);
  const [newStoreName, setNewStoreName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editing;

  const setField = <K extends keyof Product>(key: K, value: Product[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onPurchaseChange = (v: number) => {
    setForm((prev) => ({
      ...prev,
      purchasePrice: v,
      salePrice: calcSalePrice(v, prev.markupPercent),
    }));
  };

  const onMarkupChange = (v: number) => {
    setForm((prev) => ({
      ...prev,
      markupPercent: v,
      salePrice: calcSalePrice(prev.purchasePrice, v),
    }));
  };

  const onSaleChange = (v: number) => {
    setForm((prev) => {
      const markup =
        prev.purchasePrice > 0
          ? Math.round(((v - prev.purchasePrice) / prev.purchasePrice) * 100)
          : prev.markupPercent;
      return { ...prev, salePrice: v, markupPercent: markup };
    });
  };

  const onImageFile = (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Rasm 2MB dan kichik bo'lishi kerak.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const setStockQty = (storeId: string, qty: number) => {
    setForm((prev) => {
      const stocks = [...prev.stocks];
      const idx = stocks.findIndex((s) => s.storeId === storeId);
      if (idx === -1) stocks.push({ storeId, qty });
      else stocks[idx] = { ...stocks[idx], qty };
      return { ...prev, stocks };
    });
  };

  const handleAddStore = () => {
    const name = newStoreName.trim();
    if (!name) return;
    const s = onAddStore(name);
    setNewStoreName("");
    setStockQty(s.id, 0);
  };

  const clearAll = () => {
    setForm({
      ...EMPTY,
      id: uid(),
      stocks: stores.map((s) => ({ storeId: s.id, qty: 0 })),
    });
    setAutoBarcode(true);
  };

  const canSave = useMemo(() => {
    return form.name.trim().length > 0 && form.salePrice >= 0;
  }, [form]);

  const handleSave = () => {
    if (!canSave) return;
    const out: Product = {
      ...form,
      name: form.name.trim(),
      barcode:
        autoBarcode || !form.barcode.trim() ? genBarcode() : form.barcode.trim(),
      brand: form.brand?.trim() || undefined,
      brandPhone: form.brandPhone?.trim() || undefined,
      description: form.description?.trim() || undefined,
      stocks: form.stocks.filter((s) => stores.some((x) => x.id === s.storeId)),
    };
    onSave(out);
  };

  const allStoresInForm: StoreStock[] = useMemo(() => {
    const map = new Map(form.stocks.map((s) => [s.storeId, s.qty]));
    return stores.map((s) => ({
      storeId: s.id,
      qty: map.get(s.id) ?? 0,
    }));
  }, [form.stocks, stores]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t(lang, "editProduct") : t(lang, "newProduct")}</h2>
          <button className="icon-btn ghost" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-row" style={{ gridColumn: "1 / span 1" }}>
              <label>
                {t(lang, "productName")} <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder={t(lang, "enterProductName")}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-row" style={{ gridColumn: "2 / span 1" }}>
              <label className="row-between">
                <span>{t(lang, "image")}</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => fileRef.current?.click()}
                  title="Yuklash"
                >
                  <IconUpload />
                </button>
              </label>
              <div className="image-uploader">
                <div
                  className="preview"
                  onClick={() => fileRef.current?.click()}
                  role="button"
                >
                  {form.image ? <img src={form.image} alt="" /> : <IconUpload size={20} />}
                </div>
                {form.image && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setField("image", undefined)}
                  >
                    {t(lang, "cancel")}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => onImageFile(e.target.files?.[0])}
                />
              </div>
            </div>

            <div className="form-row">
              <label>{t(lang, "brand")}</label>
              <input
                type="text"
                placeholder="ALKO, BOSCH..."
                value={form.brand ?? ""}
                onChange={(e) => setField("brand", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>{t(lang, "brandPhone")}</label>
              <input
                type="tel"
                placeholder="+998 XX XXX XX XX"
                value={form.brandPhone ?? ""}
                onChange={(e) => setField("brandPhone", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>{t(lang, "category")}</label>
              <div className="select-with-add">
                <div className="select-wrap">
                  <select
                    value={form.categoryId ?? ""}
                    onChange={(e) =>
                      setField("categoryId", e.target.value || undefined)
                    }
                  >
                    <option value="">{t(lang, "selectCategory")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown className="select-caret" />
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() =>
                    onRequestNewCategory((c) => setField("categoryId", c.id))
                  }
                  title={t(lang, "addCategory")}
                >
                  <IconPlus />
                </button>
              </div>
            </div>

            <div className="form-row">
              <label>{t(lang, "unit")}</label>
              <div className="select-wrap">
                <select
                  value={form.unit}
                  onChange={(e) => setField("unit", e.target.value as Unit)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="select-caret" />
              </div>
            </div>

            <div className="form-row full">
              <div className="seg-toggle">
                {(["UZS", "USD"] as Currency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`seg-btn ${form.currency === c ? "active" : ""}`}
                    onClick={() => setField("currency", c)}
                  >
                    {c === "UZS" ? t(lang, "uzsCurrency") : t(lang, "usdCurrency")}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <label>{t(lang, "purchasePrice")}</label>
              <input
                type="number"
                min={0}
                value={form.purchasePrice}
                onChange={(e) => onPurchaseChange(Number(e.target.value) || 0)}
              />
            </div>

            <div className="form-row">
              <label>{t(lang, "markup")}</label>
              <input
                type="number"
                value={form.markupPercent}
                onChange={(e) => onMarkupChange(Number(e.target.value) || 0)}
              />
            </div>

            <div className="form-row">
              <label>
                {t(lang, "salePrice")} <span className="req">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.salePrice}
                onChange={(e) => onSaleChange(Number(e.target.value) || 0)}
              />
            </div>

            <div className="form-row full">
              <label>{t(lang, "barcode")}</label>
              <div className="input-trailing">
                <input
                  type="text"
                  placeholder={t(lang, "autoGenBarcode")}
                  value={autoBarcode ? "" : form.barcode}
                  disabled={autoBarcode}
                  onChange={(e) => setField("barcode", e.target.value)}
                />
                <button
                  type="button"
                  className={`trailing-btn ${autoBarcode ? "active" : ""}`}
                  onClick={() => setAutoBarcode((v) => !v)}
                >
                  {t(lang, "autoCreate")}
                </button>
              </div>
            </div>

            <div className="form-row full">
              <label>{t(lang, "description")}</label>
              <textarea
                placeholder={t(lang, "optional")}
                value={form.description ?? ""}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            <div className="form-row full">
              <button
                type="button"
                className="collapsible-head"
                onClick={() => setShowStores((v) => !v)}
              >
                <span>{t(lang, "assignStores")}</span>
                <IconChevronDown
                  style={{
                    transform: showStores ? "rotate(180deg)" : "none",
                    transition: "transform .15s",
                  }}
                />
              </button>
              {showStores && (
                <>
                  <div className="stores-list">
                    {allStoresInForm.length === 0 && (
                      <div className="muted small" style={{ padding: 6 }}>
                        {t(lang, "noStores")}
                      </div>
                    )}
                    {allStoresInForm.map((s) => {
                      const name =
                        stores.find((x) => x.id === s.storeId)?.name ?? "?";
                      return (
                        <div className="store-row" key={s.storeId}>
                          <div className="store-name">{name}</div>
                          <input
                            type="number"
                            min={0}
                            value={s.qty}
                            onChange={(e) =>
                              setStockQty(
                                s.storeId,
                                Number(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder={t(lang, "newStoreName")}
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={handleAddStore}
                      disabled={!newStoreName.trim()}
                    >
                      <IconPlus size={14} /> {t(lang, "add")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-ghost btn-link"
            type="button"
            onClick={clearAll}
          >
            {t(lang, "clearAll")}
          </button>
          <div className="footer-right">
            <button className="btn" type="button" onClick={onClose}>
              {t(lang, "cancel")}
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSave}
              disabled={!canSave}
            >
              {t(lang, "saveAndShare")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
