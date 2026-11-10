export const languageNames = {
    en: 'English',
    de: 'Deutsch (German)',
    fr: 'Français (French)',
    it: 'Italiano (Italian)',
    es: 'Español (Spanish)',
    mn: 'монгол хэл (Mongolian)',
} as const;

export type LanguageKey = keyof typeof languageNames;

export const languageSources = {
  en: 'assets/i18n/en.ftl',
  de: 'assets/i18n/de.ftl',
} as const satisfies Partial<Record<LanguageKey, `assets/i18n/${string}.ftl`>>;
