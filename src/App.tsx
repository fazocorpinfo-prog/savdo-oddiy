import { useEffect, useMemo, useState } from "react";
import CatalogPage from "./components/CatalogPage";
import CategoriesPage from "./components/CategoriesPage";
import SettingsPage from "./components/SettingsPage";
import Sidebar from "./components/Sidebar";
import ProductFormModal from "./components/ProductFormModal";
import CategoryFormModal from "./components/CategoryFormModal";
import {
  loadCategories,
  loadProducts,
  loadSettings,
  loadStores,
  saveCategories,
  saveProducts,
  saveSettings,
  saveStores,
} from "./storage";
import type {
  Category,
  PageKey,
  Product,
  Settings,
  Store,
} from "./types";
import { t } from "./i18n";

export type Toast = {
  id: string;
  message: string;
  kind?: "success" | "error" | "warning" | "info";
};

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [categories, setCategories] = useState<Category[]>(() =>
    loadCategories()
  );
  const [stores, setStores] = useState<Store[]>(() => loadStores());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [page, setPage] = useState<PageKey>("catalog");

  const [productModal, setProductModal] = useState<{
    open: boolean;
    editing?: Product;
  }>({ open: false });
  const [categoryModal, setCategoryModal] = useState<{
    open: boolean;
    editing?: Category;
    onCreated?: (c: Category) => void;
  }>({ open: false });

  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => saveProducts(products), [products]);
  useEffect(() => saveCategories(categories), [categories]);
  useEffect(() => saveStores(stores), [stores]);
  useEffect(() => saveSettings(settings), [settings]);

  const pushToast = (message: string, kind: Toast["kind"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const lang = settings.lang;

  const handleSaveProduct = (p: Product) => {
    setProducts((prev) => {
      const i = prev.findIndex((x) => x.id === p.id);
      if (i === -1) return [p, ...prev];
      const next = prev.slice();
      next[i] = p;
      return next;
    });
    setProductModal({ open: false });
    pushToast("Mahsulot saqlandi", "success");
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    pushToast("Mahsulot o'chirildi", "warning");
  };

  const handleSaveCategory = (c: Category) => {
    setCategories((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx === -1) return [...prev, c];
      const next = prev.slice();
      next[idx] = c;
      return next;
    });
    categoryModal.onCreated?.(c);
    setCategoryModal({ open: false });
    pushToast("Kategoriya saqlandi", "success");
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm("Kategoriyani o'chirishni tasdiqlaysizmi?")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setProducts((prev) =>
      prev.map((p) =>
        p.categoryId === id ? { ...p, categoryId: undefined } : p
      )
    );
    pushToast("Kategoriya o'chirildi", "warning");
  };

  const handleBulkImport = (data: {
    products: Product[];
    newCategories: Category[];
    newStores: Store[];
    skipped: number;
  }) => {
    if (data.newCategories.length)
      setCategories((prev) => [...prev, ...data.newCategories]);
    if (data.newStores.length)
      setStores((prev) => [...prev, ...data.newStores]);
    setProducts((prev) => [...data.products, ...prev]);
    pushToast(
      `Import: ${data.products.length} ta mahsulot, ${data.newCategories.length} kategoriya, ${data.newStores.length} do'kon. ${data.skipped} satr o'tkazib yuborildi.`,
      "success"
    );
  };

  const handleSaveSettings = (s: Settings) => {
    setSettings(s);
    pushToast(t(s.lang, "save"), "success");
  };

  const allStores = useMemo(() => stores, [stores]);

  return (
    <div className="app">
      <Sidebar current={page} onChange={setPage} lang={lang} />
      <main className="main">
        {page === "catalog" && (
          <CatalogPage
            products={products}
            categories={categories}
            stores={allStores}
            settings={settings}
            lang={lang}
            onNewProduct={() => setProductModal({ open: true })}
            onEditProduct={(p) => setProductModal({ open: true, editing: p })}
            onDeleteProduct={handleDeleteProduct}
            onImported={handleBulkImport}
            onToast={pushToast}
          />
        )}
        {page === "categories" && (
          <CategoriesPage
            categories={categories}
            products={products}
            lang={lang}
            onAdd={() => setCategoryModal({ open: true })}
            onEdit={(c) => setCategoryModal({ open: true, editing: c })}
            onDelete={handleDeleteCategory}
          />
        )}
        {page === "settings" && (
          <SettingsPage settings={settings} onSave={handleSaveSettings} />
        )}
      </main>

      {productModal.open && (
        <ProductFormModal
          editing={productModal.editing}
          categories={categories}
          stores={allStores}
          lang={lang}
          onClose={() => setProductModal({ open: false })}
          onSave={handleSaveProduct}
          onRequestNewCategory={(cb) =>
            setCategoryModal({ open: true, onCreated: cb })
          }
          onAddStore={(name) => {
            const s = { id: Math.random().toString(36).slice(2), name };
            setStores((prev) => [...prev, s]);
            return s;
          }}
        />
      )}

      {categoryModal.open && (
        <CategoryFormModal
          editing={categoryModal.editing}
          lang={lang}
          onClose={() => setCategoryModal({ open: false })}
          onSave={handleSaveCategory}
        />
      )}

      <div className="toast-stack">
        {toasts.map((tt) => (
          <div key={tt.id} className={`toast ${tt.kind ?? ""}`}>
            {tt.message}
          </div>
        ))}
      </div>
    </div>
  );
}
