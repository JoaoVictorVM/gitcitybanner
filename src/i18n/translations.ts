export const LOCALES = ["pt-BR", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

const ptBR = {
  documentTitle: "gitcitybanner — banner de contribuições do GitHub",
  title: "gitcitybanner",
  tagline:
    "Transforme os últimos 365 dias de contribuições de um perfil do GitHub em um banner de cidade noturna, pronto para baixar em PNG.",
  previewEmpty: "O banner aparece aqui depois que você gerar.",
  usernameLabel: "Nome de usuário do GitHub",
  usernamePlaceholder: "torvalds",
  generateButtonLabel: "Gerar banner",
  invalidUsernameMessage: "Nome de usuário inválido. Use apenas letras, números e hífens.",
  errorUserNotFound: "Usuário não encontrado no GitHub. Verifique o nome e tente de novo.",
  errorRateLimited: "Muitas gerações em pouco tempo. Tente de novo em {minutes} minutos.",
  errorServiceUnavailable: "Não foi possível ler os dados do GitHub agora. Tente de novo mais tarde.",
  errorConnectionFailed: "A conexão falhou. Verifique sua internet e tente de novo.",
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
  usernameLabel: "GitHub username",
  usernamePlaceholder: "torvalds",
  generateButtonLabel: "Generate banner",
  invalidUsernameMessage: "Invalid username. Use only letters, numbers, and hyphens.",
  errorUserNotFound: "GitHub user not found. Check the name and try again.",
  errorRateLimited: "Too many generations in a short time. Try again in {minutes} minutes.",
  errorServiceUnavailable: "Could not read data from GitHub right now. Please try again later.",
  errorConnectionFailed: "The connection failed. Check your internet and try again.",
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
