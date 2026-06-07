import { WALLET_ASSETS } from "./people";

export type DisplayCurrency = {
  code: string;
  symbol: string;
  label: string;
  pillLabel: string;
};

export const DISPLAY_CURRENCIES: DisplayCurrency[] = [
  { code: "USD", symbol: "$", label: "US Dollar", pillLabel: "($) USD" },
  { code: "EUR", symbol: "€", label: "Euro", pillLabel: "(€) EUR" },
  { code: "BRL", symbol: "R$", label: "Brazil Real", pillLabel: "(R$) BRL" },
];

export function getCurrencyByCode(code: string): DisplayCurrency {
  return (
    DISPLAY_CURRENCIES.find((c) => c.code === code) ?? DISPLAY_CURRENCIES[0]
  );
}

export function getBalanceForCurrency(code: string): number {
  if (code === "USD") {
    return WALLET_ASSETS.reduce((sum, asset) => sum + asset.balance, 0);
  }

  const asset = WALLET_ASSETS.find((item) => item.code === code);
  return asset?.balance ?? 0;
}
