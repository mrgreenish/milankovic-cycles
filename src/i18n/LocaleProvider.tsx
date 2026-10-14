"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localePath, type Locale } from "./config";
import type { Ui } from "./ui";

type LocaleValue = { locale: Locale; ui: Ui };
const LocaleContext = createContext<LocaleValue | null>(null);

/** Hands the language and its interface text to every client component below. */
export function LocaleProvider({
  locale,
  ui,
  children,
}: {
  locale: Locale;
  ui: Ui;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, ui }), [locale, ui]);
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

function useLocaleValue() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used within LocaleProvider");
  return value;
}

export const useLocale = () => useLocaleValue().locale;
export const useUi = () => useLocaleValue().ui;

/** Turns a site path such as `/lab` into one for the current language. */
export function useLocalePath() {
  const locale = useLocale();
  return useMemo(() => (path: string) => localePath(locale, path), [locale]);
}
