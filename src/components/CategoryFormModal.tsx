import { useState } from "react";
import type { Category, Lang } from "../types";
import { t } from "../i18n";
import { uid } from "../utils";
import { IconClose } from "./icons";

const PRESETS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#a855f7",
  "#f97316",
  "#14b8a6",
  "#d946ef",
];

interface Props {
  editing?: Category;
  lang: Lang;
  onClose: () => void;
  onSave: (c: Category) => void;
}

export default function CategoryFormModal({
  editing,
  lang,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(editing?.name ?? "");
  const [color, setColor] = useState(editing?.color ?? PRESETS[0]);

  const canSave = name.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    onSave({
      id: editing?.id ?? uid(),
      name: name.trim(),
      color,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t(lang, "addCategory")}</h2>
          <button className="icon-btn ghost" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-row full">
              <label>
                {t(lang, "categoryName")} <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder={t(lang, "enterCategoryName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>

            <div className="form-row full">
              <label>{t(lang, "color")}</label>
              <div className="color-swatches">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${
                      color === c ? "selected" : ""
                    }`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>
            {t(lang, "cancel")}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={submit}
            disabled={!canSave}
          >
            {t(lang, "save")}
          </button>
        </div>
      </div>
    </div>
  );
}
