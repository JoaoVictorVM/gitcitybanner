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
  downloadXLabel: "Baixar para X (1500×500)",
  downloadLinkedInLabel: "Baixar para LinkedIn (1584×396)",
  errorExportFailed: "Não foi possível gerar o arquivo. Tente de novo.",
  errorDownloadBlocked:
    "Seu navegador bloqueou o download. Permita downloads deste site e tente de novo.",
  previewDescription: "Banner da cidade de @{username} com {count} contribuições",
  bannerCaption: "@{username} · {count} contribuições",
  footer: "Projeto open source. Nenhum dado é armazenado.",
  langSwitchLabel: "Idioma",
  langPt: "PT",
  langEn: "EN",
  landingDocumentTitle: "gitcitybanner — sua atividade no GitHub como uma cidade à noite",
  heroEyebrow: "365 dias · 12 casas · 1 banner",
  heroHeadline: "Sua atividade no GitHub, vista como uma cidade à noite.",
  heroLead:
    "Cada casa é um mês. Cada janela, um dia. Quanto mais contribuições, mais forte a luz. Digite um username e baixe o banner pronto para o X ou o LinkedIn.",
  heroCta: "Gerar meu banner",
  heroCaption: "Exemplo gerado com as contribuições de @torvalds",
  howTitle: "Como funciona",
  step1Title: "Digite o username",
  step1Body: "Qualquer perfil público do GitHub. Nada é armazenado.",
  step2Title: "Veja a cidade acender",
  step2Body: "Os últimos 365 dias viram doze casas, uma por mês.",
  step3Title: "Baixe em PNG",
  step3Body: "1500×500 para o X, 1584×396 para o LinkedIn.",
  legendTitle: "Como ler a cidade",
  legendHouse: "Cada casa é um mês — doze casas, os últimos doze meses, da esquerda para a direita.",
  legendWindow: "Cada janela é um dia, em ordem: de cima para baixo, coluna a coluna.",
  legendLight: "O brilho é a quantidade de contribuições do dia, na mesma escala de verdes do gráfico do GitHub.",
  legendFigure: "Uma casa do banner com o grid de janelas",
  closingTitle: "Pronto para ver a sua cidade?",
  backHome: "Início",
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
  downloadXLabel: "Download for X (1500×500)",
  downloadLinkedInLabel: "Download for LinkedIn (1584×396)",
  errorExportFailed: "Could not generate the file. Please try again.",
  errorDownloadBlocked:
    "Your browser blocked the download. Allow downloads from this site and try again.",
  previewDescription: "City banner for @{username} with {count} contributions",
  bannerCaption: "@{username} · {count} contributions",
  footer: "Open source project. No data is stored.",
  langSwitchLabel: "Language",
  langPt: "PT",
  langEn: "EN",
  landingDocumentTitle: "gitcitybanner — your GitHub activity as a city at night",
  heroEyebrow: "365 days · 12 houses · 1 banner",
  heroHeadline: "Your GitHub activity, seen as a city at night.",
  heroLead:
    "Every house is a month. Every window, a day. The more contributions, the brighter the light. Type a username and download a banner ready for X or LinkedIn.",
  heroCta: "Generate my banner",
  heroCaption: "Example generated from @torvalds's contributions",
  howTitle: "How it works",
  step1Title: "Type the username",
  step1Body: "Any public GitHub profile. Nothing is stored.",
  step2Title: "Watch the city light up",
  step2Body: "The last 365 days become twelve houses, one per month.",
  step3Title: "Download as PNG",
  step3Body: "1500×500 for X, 1584×396 for LinkedIn.",
  legendTitle: "How to read the city",
  legendHouse: "Every house is a month — twelve houses, the last twelve months, left to right.",
  legendWindow: "Every window is a day, in order: top to bottom, column by column.",
  legendLight: "Brightness is the day's contribution count, on the same green scale as the GitHub graph.",
  legendFigure: "One house from the banner with its window grid",
  closingTitle: "Ready to see your city?",
  backHome: "Home",
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
