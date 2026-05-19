import { useState } from "react";
import type { DisplayMode, Lang, Settings } from "../types";
import { t } from "../i18n";
import { fmtMoney } from "../utils";
import {
  IconCheck,
  IconDollar,
  IconEye,
  IconGlobe,
  IconSave,
} from "./icons";

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
}

const MODES: { key: DisplayMode; titleKey: "modeOriginal" | "modeUzs" | "modeUsd"; helpKey: "modeOriginalHelp" | "modeUzsHelp" | "modeUsdHelp" }[] = [
  { key: "original", titleKey: "modeOriginal", helpKey: "modeOriginalHelp" },
  { key: "uzs", titleKey: "modeUzs", helpKey: "modeUzsHelp" },
  { key: "usd", titleKey: "modeUsd", helpKey: "modeUsdHelp" },
];

export default function SettingsPage({ settings, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(settings);
  const lang = draft.lang;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  const previewSomFromUsd = draft.usdRate * 50;
  const previewUsdFromSom = draft.usdRate > 0 ? 500000 / draft.usdRate : 0;

  return (
    <div className="settings-wrap">
      <section className="card settings-card">
        <header className="card-head">
          <span className="card-head-icon success">
            <IconDollar size={18} />
          </span>
          <h3>{t(lang, "dollarRate")}</h3>
        </header>
        <div className="muted small">{t(lang, "oneDollar")}</div>
        <div className="input-suffix">
          <input
            type="number"
            min={0}
            value={draft.usdRate}
            onChange={(e) => set("usdRate", Number(e.target.value) || 0)}
          />
          <span className="suffix">so'm</span>
        </div>
        <div className="muted small">{t(lang, "rateExample")}</div>
      </section>

      <section className="card settings-card">
        <header className="card-head">
          <span className="card-head-icon">
            <IconEye size={18} />
          </span>
          <h3>{t(lang, "displayCurrency")}</h3>
        </header>
        <div className="muted small">{t(lang, "displayCurrencyQ")}</div>
        <div className="radio-list">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`radio-row ${draft.displayMode === m.key ? "selected" : ""}`}
              onClick={() => set("displayMode", m.key)}
            >
              <span className="radio-dot">
                {draft.displayMode === m.key && <span className="radio-inner" />}
              </span>
              <span className="radio-text">
                <span className="radio-title">{t(lang, m.titleKey)}</span>
                <span className="radio-help">{t(lang, m.helpKey)}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="preview-box">
          <div className="muted small">{t(lang, "preview")}</div>
          <div className="preview-row">
            <span>{t(lang, "dollarProduct")}</span>
            <span className="mono accent">
              {draft.displayMode === "uzs"
                ? fmtMoney(previewSomFromUsd, "UZS")
                : fmtMoney(50, "USD")}
            </span>
          </div>
          <div className="preview-row">
            <span>{t(lang, "somProduct")}</span>
            <span className="mono accent">
              {draft.displayMode === "usd"
                ? fmtMoney(previewUsdFromSom, "USD")
                : fmtMoney(500000, "UZS")}
            </span>
          </div>
        </div>
      </section>

      <section className="card settings-card">
        <header className="card-head">
          <span className="card-head-icon">
            <IconGlobe size={18} />
          </span>
          <h3>{t(lang, "language")}</h3>
        </header>
        <div className="lang-grid">
          {(["uz", "ru"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`lang-btn ${draft.lang === l ? "selected" : ""}`}
              onClick={() => set("lang", l)}
            >
              <span className="lang-code">{l.toUpperCase()}</span>
              <span className="lang-name">{t(lang, l)}</span>
              {draft.lang === l && (
                <span className="lang-check">
                  <IconCheck size={14} />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <button
        className="btn btn-primary btn-block btn-lg"
        type="button"
        onClick={() => onSave(draft)}
      >
        <IconSave size={16} />
        {t(lang, "save")}
      </button>
    </div>
  );
}
