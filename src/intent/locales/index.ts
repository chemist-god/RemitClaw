import type { SupportedLocale } from "../../types/index.js";

export interface LocalePatterns {
  sendVerbs: RegExp[];
  recurringVerbs: RegExp[];
  amountPattern: RegExp;
  countryAliases: Record<string, string>;
  currencyByCountry: Record<string, string>;
}

export const localePatterns: Record<SupportedLocale, LocalePatterns> = {
  en: {
    sendVerbs: [/\bsend\b/i, /\btransfer\b/i, /\bpay\b/i],
    recurringVerbs: [/\bevery month\b/i, /\bmonthly\b/i, /\bweekly\b/i, /\bevery week\b/i],
    amountPattern: /(?:\$|€|£|USD|EUR|GBP)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:dollars?|euros?|pounds?|USD|EUR|GBP)/i,
    countryAliases: {
      philippines: "PH",
      ph: "PH",
      nigeria: "NG",
      ng: "NG",
      kenya: "KE",
      ke: "KE",
      brazil: "BR",
      br: "BR",
      colombia: "CO",
      co: "CO",
    },
    currencyByCountry: { PH: "PHP", NG: "NGN", KE: "KES", BR: "BRL", CO: "COP" },
  },
  es: {
    sendVerbs: [/\benviar\b/i, /\btransferir\b/i, /\bmandar\b/i, /\bpagar\b/i],
    recurringVerbs: [/\bcada mes\b/i, /\bmensual\b/i, /\bcada semana\b/i, /\bsemanal\b/i],
    amountPattern: /(?:\$|€|USD|EUR)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:dólares?|euros?|USD|EUR)/i,
    countryAliases: {
      filipinas: "PH",
      nigeria: "NG",
      kenia: "KE",
      brasil: "BR",
      colombia: "CO",
    },
    currencyByCountry: { PH: "PHP", NG: "NGN", KE: "KES", BR: "BRL", CO: "COP" },
  },
  pt: {
    sendVerbs: [/\benviar\b/i, /\btransferir\b/i, /\bmandar\b/i, /\bpagar\b/i],
    recurringVerbs: [/\btodo mês\b/i, /\bmensal\b/i, /\btoda semana\b/i, /\bsemanal\b/i],
    amountPattern: /(?:R\$|\$|€|USD|EUR|BRL)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:reais?|dólares?|euros?|USD|EUR|BRL)/i,
    countryAliases: {
      filipinas: "PH",
      nigéria: "NG",
      nigeria: "NG",
      quênia: "KE",
      brasil: "BR",
      colômbia: "CO",
    },
    currencyByCountry: { PH: "PHP", NG: "NGN", KE: "KES", BR: "BRL", CO: "COP" },
  },
  fr: {
    sendVerbs: [/\benvoyer\b/i, /\btransférer\b/i, /\bpayer\b/i],
    recurringVerbs: [/\bchaque mois\b/i, /\bmensuel\b/i, /\bchaque semaine\b/i, /\bhebdomadaire\b/i],
    amountPattern: /(?:€|\$|EUR|USD)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:euros?|dollars?|EUR|USD)/i,
    countryAliases: {
      philippines: "PH",
      nigéria: "NG",
      nigeria: "NG",
      kenya: "KE",
      brésil: "BR",
      brasil: "BR",
      colombie: "CO",
    },
    currencyByCountry: { PH: "PHP", NG: "NGN", KE: "KES", BR: "BRL", CO: "COP" },
  },
};

export function detectLocale(message: string): SupportedLocale {
  const lower = message.toLowerCase();
  if (/\b(enviar|transferir|mandar|cada mes|filipinas|nigéria)\b/.test(lower)) {
    if (/\b(todo mês|quênia|colômbia)\b/.test(lower)) return "pt";
    return "es";
  }
  if (/\b(envoyer|transférer|chaque mois|brésil|colombie)\b/.test(lower)) return "fr";
  if (/\b(todo mês|reais|quênia)\b/.test(lower)) return "pt";
  return "en";
}
