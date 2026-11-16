"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { translate, type Locale } from "./translations";

const LocaleContext = createContext<Locale>("en");

/** Reuses the server-verified locale. No browser locale guess or backend data rewriting. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocalization(): (text: string) => string {
  const locale = useContext(LocaleContext);
  return useMemo(() => (text: string) => translate(locale, text), [locale]);
}

export function ClientLocalize({ text }: { text: string }) {
  const t = useLocalization();
  return <>{t(text)}</>;
}
