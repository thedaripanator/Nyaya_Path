import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";
import mr from "./locales/mr.json";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn },
  mr: { translation: mr }
};

const supportedLanguages = ["en", "hi", "kn", "mr"];
const savedLanguage = typeof window !== "undefined"
  ? window.localStorage.getItem("nyaya_language")
  : null;

i18n.use(initReactI18next).init({
  resources,
  lng: supportedLanguages.includes(savedLanguage) ? savedLanguage : "en",
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  interpolation: { escapeValue: false },
  returnNull: false
});

i18n.on("languageChanged", (language) => {
  if (supportedLanguages.includes(language)) {
    window.localStorage.setItem("nyaya_language", language);
    document.documentElement.lang = language;
  }
});

export default i18n;
