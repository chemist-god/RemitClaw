export type UiLocale = "en" | "es" | "pt" | "fr";

export const UI_LOCALES: Array<{
  code: UiLocale;
  label: string;
  native: string;
}> = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "fr", label: "French", native: "Français" },
];

export const DEFAULT_LOCALE: UiLocale = "en";

export const STORAGE_KEY = "remitclaw-ui-locale";
