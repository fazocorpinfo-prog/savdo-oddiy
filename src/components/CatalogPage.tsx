import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Lang, Product, Settings, Store } from "../types";
import { displayPrice, fmtNumber, totalStock } from "../utils";
import { t } from "../i18n";
import {
  exportProductsXlsx,
  importProductsXlsx,
  type ImportResult,
} from "../excel";
import {
  IconBox,
  IconChevronDown,
  IconDownload,
  IconEdit,
  IconFilter,
  IconPlus,
  IconClose,
  IconSearch,
  IconTrash,
  IconUpload,
} from "./icons";

interface Props {
  products: Product[];
  categories: Category[];
  stores: Store[];
  settings: Settings;
  lang: Lang;
  onNewProduct: () => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onImported: (r: ImportResult) => void;
  onToast: (
    msg: string,
    kind?: "success" | "error" | "warning" | "info"
  ) => void;
}

export default function CatalogPage({
  products,
  categories,
  stores,
  settings,
  lang,
  onNewProduct,
  onEditProduct,
  onDeleteProduct,
  onImported,
  onToast,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [excelOpen, setExcelOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Escape yopadi */
  useEffect(() => {
    if (!lightbox) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lightbox]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const storeById = useMemo(
    () => new Map(stores.map((s) => [s.id, s])),
    [stores]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter && p.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryFilter]);

  const onPickFile = () => {
    setExcelOpen(false);
    fileInputRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const result = await importProductsXlsx(file, categories, stores);
      if (!result.products.length && result.skipped === 0) {
        onToast("Faylda mahsulotlar topilmadi", "warning");
        return;
      }
      onImported(result);
    } catch (err) {
      console.error(err);
      onToast("Excelni o'qishda xato yuz berdi", "error");
    }
  };

  const onExport = () => {
    setExcelOpen(false);
    if (!products.length) {
      onToast("Eksport uchun mahsulot yo'q", "warning");
      return;
    }
    try {
      exportProductsXlsx(products, categories, stores);
      onToast("Excel fayl yuklandi", "success");
    } catch (err) {
      console.error(err);
      onToast("Eksportda xato yuz berdi", "error");
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">{t(lang, "catalog")}</h1>
          <div className="page-sub">
            {fmtNumber(products.length)} {t(lang, "totalProducts")}
          </div>
        </div>
        <div className="header-actions">
          <div className="dropdown">
            <button
              className="btn btn-success-soft"
              onClick={() => setExcelOpen((v) => !v)}
              onBlur={() => setTimeout(() => setExcelOpen(false), 150)}
            >
              <IconDownload size={16} /> {t(lang, "excel")}
            </button>
            {excelOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onMouseDown={onPickFile}>
                  <IconUpload size={14} /> {t(lang, "importExcel")}
                </button>
                <button className="dropdown-item" onMouseDown={onExport}>
                  <IconDownload size={14} /> {t(lang, "exportExcel")}
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={onNewProduct}>
            <IconPlus size={16} /> {t(lang, "newProduct")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={onFile}
          />
        </div>
      </header>

      <div className="toolbar">
        <div className="search-wrap">
          <IconSearch className="search-icon" />
          <input
            className="search"
            type="text"
            placeholder={t(lang, "search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="select-wrap toolbar-filter">
          <IconFilter className="select-leading" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">{t(lang, "allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <IconChevronDown className="select-caret" />
        </div>
      </div>

      <div className="table-wrap card">
        {filtered.length === 0 ? (
          <div className="empty">
            <IconBox size={28} />
            <div>{products.length === 0 ? t(lang, "empty") : t(lang, "noMatch")}</div>
          </div>
        ) : (
          <table className="catalog">
            <thead>
              <tr>
                <th>{t(lang, "image")}</th>
                <th>{t(lang, "productName")}</th>
                <th>{t(lang, "barcode")}</th>
                <th>{t(lang, "category")}</th>
                <th>{t(lang, "purchasePrice")}</th>
                <th>{t(lang, "salePrice")}</th>
                <th>{t(lang, "unit")}</th>
                <th>{t(lang, "stores")}</th>
                <th>{t(lang, "actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cat = p.categoryId
                  ? categoryById.get(p.categoryId)
                  : undefined;
                const purchase = displayPrice(p.purchasePrice, p.currency, settings);
                const sale = displayPrice(p.salePrice, p.currency, settings);
                const storesText = p.stocks.length
                  ? p.stocks
                      .map(
                        (s) =>
                          `${storeById.get(s.storeId)?.name ?? "?"}: ${s.qty}`
                      )
                      .join(", ")
                  : `${totalStock(p)}`;
                return (
                  <tr key={p.id}>
                    <td>
                      {p.image ? (
                        <img
                          className="thumb"
                          src={p.image}
                          alt=""
                          onClick={() => setLightbox(p.image!)}
                        />
                      ) : (
                        <div className="thumb-placeholder">
                          <IconBox size={16} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="prod-name">{p.name}</div>
                      {p.brand && <div className="muted small">{p.brand}</div>}
                    </td>
                    <td>
                      <code className="muted small">{p.barcode}</code>
                    </td>
                    <td>
                      {cat ? (
                        <span
                          className="chip"
                          style={{
                            background: `${cat.color}22`,
                            color: cat.color,
                            borderColor: `${cat.color}55`,
                          }}
                        >
                          {cat.name}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="num">{purchase.text}</td>
                    <td className="num price-pos">{sale.text}</td>
                    <td className="muted">{p.unit}</td>
                    <td className="muted small">{storesText}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          onClick={() => onEditProduct(p)}
                          title="Edit"
                        >
                          <IconEdit />
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => onDeleteProduct(p.id)}
                          title="Delete"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {lightbox && (
        <div className="lightbox-backdrop" onClick={() => setLightbox(null)}>
          <button
            className="lightbox-close"
            onClick={() => setLightbox(null)}
            title={t(lang, "close")}
          >
            <IconClose />
          </button>
          <img className="lightbox-img" src={lightbox} alt="" />
        </div>
      )}
    </>
  );
}
