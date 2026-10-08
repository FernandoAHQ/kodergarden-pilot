import type { ReactNode } from "react";
import { useI18n } from "../i18n.js";

export function FloatingNavigation({ onBack, backLabel, controls }: { readonly onBack: () => void; readonly backLabel: string; readonly controls?: ReactNode }) {
  const { locale, setLocale, t } = useI18n();
  return <nav className="floating-navigation" aria-label={t("common.navigation")}>
    <div className="floating-navigation__left">
      <a className="brand" href="#" aria-label="Kodergarden"><span className="brand-mark">K</span><span>Koder<strong>garden</strong></span></a>
      <button className="floating-navigation__back" onClick={onBack}><span aria-hidden="true">←</span><span>{backLabel}</span></button>
    </div>
    <div className="floating-navigation__right">
      {controls}
      <select className="language-select" aria-label={t("home.languageLabel")} value={locale} onChange={(event) => setLocale(event.target.value as "en" | "es")}>
        <option value="en">{t("language.english")}</option>
        <option value="es">{t("language.spanish")}</option>
      </select>
    </div>
  </nav>;
}
