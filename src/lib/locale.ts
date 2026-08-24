import { DEFAULT_LOCALE, isLocale, type Locale } from "./i18n";

/** Reads ?lang= from a resolved searchParams object. */
export function readLocale(sp: Record<string, string | string[] | undefined>): Locale {
  const raw = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
