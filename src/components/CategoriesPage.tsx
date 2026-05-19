import { useMemo } from "react";
import type { Category, Lang, Product } from "../types";
import { t } from "../i18n";
import { IconEdit, IconPlus, IconTag, IconTrash } from "./icons";

interface Props {
  categories: Category[];
  products: Product[];
  lang: Lang;
  onAdd: () => void;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}

export default function CategoriesPage({
  categories,
  products,
  lang,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      if (!p.categoryId) continue;
      m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1);
    }
    return m;
  }, [products]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">{t(lang, "categories")}</h1>
          <div className="page-sub">
            {categories.length} {t(lang, "categories").toLowerCase()}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={onAdd}>
            <IconPlus size={16} /> {t(lang, "addCategory")}
          </button>
        </div>
      </header>

      {categories.length === 0 ? (
        <div className="empty card">
          <IconTag size={28} />
          <div>{t(lang, "noCategoriesYet")}</div>
        </div>
      ) : (
        <div className="cat-grid">
          {categories.map((c) => (
            <div className="cat-card" key={c.id}>
              <span
                className="cat-color"
                style={{ background: c.color }}
                aria-hidden
              />
              <div className="cat-body">
                <div className="cat-name">{c.name}</div>
                <div className="cat-count muted">
                  {counts.get(c.id) ?? 0} {t(lang, "productCount")}
                </div>
              </div>
              <div className="cat-actions">
                <button
                  className="icon-btn"
                  onClick={() => onEdit(c)}
                  title="Edit"
                >
                  <IconEdit />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => onDelete(c.id)}
                  title="Delete"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
