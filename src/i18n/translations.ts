export const LOCALES = ["pt-BR", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

const ptBR = {
  documentTitle: "gitcitybanner — banner de contribuições do GitHub",
  title: "gitcitybanner",
  tagline:
    "Transforme os últimos 365 dias de contribuições de um perfil do GitHub em um banner de cidade noturna, pronto para baixar em PNG.",
  previewEmpty: "O banner aparece aqui depois que você gerar.",
  footer: "Projeto open source. Nenhum dado é armazenado.",
  langSwitchLabel: "Idioma",
  langPt: "PT",
  langEn: "EN",
} satisfies Record<string, string>;

export type TranslationKey = keyof typeof ptBR;

const en: Record<TranslationKey, string> = {
  documentTitle: "gitcitybanner — GitHub contribution banner",
  title: "gitcitybanner",
  tagline:
    "Turn the last 365 days of a GitHub profile's contributions into a night-city banner, ready to download as a PNG.",
  previewEmpty: "Your banner shows up here once you generate it.",
  footer: "Open source project. No data is stored.",
  langSwitchLabel: "Language",
  langPt: "PT",
  langEn: "EN",
};

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  "pt-BR": ptBR,
  en,
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}
