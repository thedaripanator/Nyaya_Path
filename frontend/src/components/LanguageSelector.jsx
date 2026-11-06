import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const LANGUAGE_OPTIONS = [
  ["en", "language.english"],
  ["hi", "language.hindi"],
  ["kn", "language.kannada"],
  ["mr", "language.marathi"]
];

export default function LanguageSelector({ compact = false }) {
  const { i18n, t } = useTranslation();

  return (
    <label className="workspace-language-selector">
      <Globe size={16} aria-hidden="true" />
      {!compact && <span>{t("language.label")}</span>}
      <select
        aria-label={t("language.label")}
        value={i18n.resolvedLanguage || "en"}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
      >
        {LANGUAGE_OPTIONS.map(([code, labelKey]) => (
          <option key={code} value={code}>{t(labelKey)}</option>
        ))}
      </select>
    </label>
  );
}
