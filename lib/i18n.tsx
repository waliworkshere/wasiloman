"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";
type Ctx = { lang: Lang; setLang: (l: Lang) => void; tr: (en: string, ar: string) => string; dir: "ltr" | "rtl" };

const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, tr: (en) => en, dir: "ltr" });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wasil-lang") as Lang | null;
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("wasil-lang", l);
    } catch {}
  };

  return (
    <LangCtx.Provider value={{ lang, setLang, tr: (en, ar) => (lang === "ar" ? ar : en), dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </LangCtx.Provider>
  );
}

export const useLang = () => useContext(LangCtx);
