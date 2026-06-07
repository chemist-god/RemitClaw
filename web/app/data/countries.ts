export type Country = {
  code: string;
  label: string;
  popular: boolean;
};

/** RemitClaw corridors + common remittance destinations, shown first. */
const POPULAR_ORDER = [
  "PH",
  "NG",
  "KE",
  "IN",
  "BR",
  "CO",
  "MX",
  "US",
  "GB",
  "CA",
  "AE",
  "SA",
  "PK",
  "BD",
  "GH",
  "ZA",
  "ET",
  "UG",
  "TZ",
  "VN",
  "ID",
  "MY",
  "TH",
  "EG",
  "FR",
  "DE",
  "ES",
  "IT",
  "AU",
  "NZ",
] as const;

const POPULAR_CODES = new Set<string>(POPULAR_ORDER);

const ALL_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

function toCountry(code: string): Country {
  return {
    code,
    label: displayNames.of(code) ?? code,
    popular: POPULAR_CODES.has(code),
  };
}

export const COUNTRIES: Country[] = ALL_CODES.map(toCountry).sort((a, b) =>
  a.label.localeCompare(b.label)
);

export const POPULAR_COUNTRIES: Country[] = POPULAR_ORDER.map(
  (code) => COUNTRIES.find((c) => c.code === code)!
).filter(Boolean);

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function getCountryLabel(code: string): string {
  return getCountry(code)?.label ?? code;
}

export function countryFlag(code: string): string {
  if (code.length !== 2) return "";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...upper.split("").map((char) => 127397 + char.charCodeAt(0))
  );
}

const DIAL_CODES: Record<string, string> = {
  PH: "+63",
  NG: "+234",
  KE: "+254",
  IN: "+91",
  BR: "+55",
  CO: "+57",
  MX: "+52",
  US: "+1",
  GB: "+44",
  CA: "+1",
  AE: "+971",
  SA: "+966",
  PK: "+92",
  BD: "+880",
  GH: "+233",
  ZA: "+27",
  ET: "+251",
  UG: "+256",
  TZ: "+255",
  VN: "+84",
  ID: "+62",
  MY: "+60",
  TH: "+66",
  EG: "+20",
  FR: "+33",
  DE: "+49",
  ES: "+34",
  IT: "+39",
  AU: "+61",
  NZ: "+64",
};

export function phonePlaceholder(code: string): string {
  const dial = DIAL_CODES[code] ?? "+1";
  return `${dial} …`;
}

export function filterCountries(query: string, list: Country[]): Country[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
  );
}
