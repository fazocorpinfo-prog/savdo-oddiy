import type { Lang, PageKey } from "../types";
import { t } from "../i18n";
import { IconCatalog, IconSettings, IconTag } from "./icons";

interface Props {
  current: PageKey;
  onChange: (page: PageKey) => void;
  lang: Lang;
}

export default function Sidebar({ current, onChange, lang }: Props) {
  const items: { key: PageKey; label: string; icon: JSX.Element }[] = [
    { key: "catalog", label: t(lang, "catalog"), icon: <IconCatalog /> },
    { key: "categories", label: t(lang, "categories"), icon: <IconTag /> },
    { key: "settings", label: t(lang, "settings"), icon: <IconSettings /> },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">S</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">Savdo</div>
          <div className="sidebar-brand-sub">Oddiy CRM</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={`nav-item ${current === it.key ? "active" : ""}`}
            onClick={() => onChange(it.key)}
          >
            <span className="nav-icon">{it.icon}</span>
            <span className="nav-label">{it.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
