import { useEffect, useMemo, useState } from "react";
import CatalogPage from "./components/CatalogPage";
import CategoriesPage from "./components/CategoriesPage";
import SettingsPage from "./components/SettingsPage";
import Sidebar from "./components/Sidebar";
import ProductFormModal from "./components/ProductFormModal";
import CategoryFormModal from "./components/CategoryFormModal";
import {
  clearAllData,
  loadCategories,
  loadProducts,
  loadSettings,
  loadStores,
  removeCategory,
  removeProduct,
  saveCategory,
  saveProduct,
  saveSettings,
  saveStore,
} from "./storage";
import type { Category, PageKey, Product, Settings, Store } from "./types";
import { t } from "./i18n";

export type Toast = {
  id: string;
  message: string;
  kind?: "success" | "error" | "warning" | "info";
};

type BackupData = {
  version: number;
  products: Product[];
  categories: Category[];
  stores: Store[];
  settings: Settings;
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [settings, setSettings] = useState<Settings>({
    usdRate: 12500,
    displayMode: "original",
    lang: "uz",
  });
  const [page, setPage] = useState<PageKey>("catalog");
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("sb-collapsed") === "1"
  );

  const handleSidebarToggle = () => {
    setSidebarCollapsed((v) => {
      const next = !v;
      localStorage.setItem("sb-collapsed", next ? "1" : "0");
      return next;
    });
  };

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

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadProducts(),
      loadCategories(),
      loadStores(),
      loadSettings(),
    ])
      .then(([prods, cats, strs, setts]) => {
        if (cancelled) return;
        setProducts(prods);
        setCategories(cats);
        setStores(strs);
        setSettings(setts);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    saveProduct(p);
    setProductModal({ open: false });
    pushToast("Mahsulot saqlandi", "success");
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    removeProduct(id);
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
    saveCategory(c);
    categoryModal.onCreated?.(c);
    setCategoryModal({ open: false });
    pushToast("Kategoriya saqlandi", "success");
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm("Kategoriyani o'chirishni tasdiqlaysizmi?")) return;
    removeCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.categoryId === id ? { ...p, categoryId: undefined } : p
      );
      // persist products whose category was cleared
      next.forEach((p, i) => {
        if (prev[i].categoryId === id) saveProduct(p);
      });
      return next;
    });
    pushToast("Kategoriya o'chirildi", "warning");
  };

  const handleBulkImport = (data: {
    products: Product[];
    newCategories: Category[];
    newStores: Store[];
    skipped: number;
  }) => {
    if (data.newCategories.length) {
      setCategories((prev) => [...prev, ...data.newCategories]);
      data.newCategories.forEach(saveCategory);
    }
    if (data.newStores.length) {
      setStores((prev) => [...prev, ...data.newStores]);
      data.newStores.forEach(saveStore);
    }
    setProducts((prev) => [...data.products, ...prev]);
    data.products.forEach(saveProduct);
    pushToast(
      `Import: ${data.products.length} ta mahsulot, ${data.newCategories.length} kategoriya, ${data.newStores.length} do'kon. ${data.skipped} satr o'tkazib yuborildi.`,
      "success"
    );
  };

  const handleSaveSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
    pushToast(t(s.lang, "save"), "success");
  };

  const handleExport = () => {
    const data: BackupData = {
      version: 1,
      products,
      categories,
      stores,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `savdo-zaxira-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast(t(lang, "exportDone"), "success");
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      if (!Array.isArray(data.products) || !Array.isArray(data.categories)) {
        pushToast(t(lang, "importError"), "error");
        return;
      }
      await clearAllData();
      await Promise.all([
        ...data.products.map(saveProduct),
        ...data.categories.map(saveCategory),
        ...(data.stores ?? []).map(saveStore),
        ...(data.settings ? [saveSettings(data.settings)] : []),
      ]);
      setProducts(data.products);
      setCategories(data.categories);
      if (data.stores?.length) setStores(data.stores);
      if (data.settings) setSettings(data.settings);
      pushToast(
        `${t(lang, "importDone")}: ${data.products.length} ${t(lang, "totalProducts")}`,
        "success"
      );
    } catch {
      pushToast(t(lang, "importError"), "error");
    }
  };

  const allStores = useMemo(() => stores, [stores]);

  if (loading) {
    return (
      <div
        className="app"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="muted">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className={`app${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <Sidebar
        current={page}
        onChange={setPage}
        lang={lang}
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
      />
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
          <SettingsPage
            settings={settings}
            onSave={handleSaveSettings}
            onExport={handleExport}
            onImport={handleImport}
          />
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
            saveStore(s);
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
