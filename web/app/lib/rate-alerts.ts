const STORAGE_KEY = "remitclaw-rate-alerts";

export type RateAlert = {
  id: string;
  corridor: string;
  sourceCurrency: string;
  destinationCurrency: string;
  /** Alert when live rate reaches or exceeds this value. */
  targetRate: number;
  createdAt: string;
};

export type RateAlertHit = {
  alert: RateAlert;
  currentRate: number;
};

function load(): RateAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RateAlert[]) : [];
  } catch {
    return [];
  }
}

function save(alerts: RateAlert[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function listRateAlerts(): RateAlert[] {
  return load();
}

export function addRateAlert(input: Omit<RateAlert, "id" | "createdAt">): RateAlert {
  const alert: RateAlert = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next = load().filter(
    (a) =>
      !(
        a.corridor === alert.corridor &&
        Math.abs(a.targetRate - alert.targetRate) < 1e-9
      )
  );
  next.push(alert);
  save(next);
  return alert;
}

export function removeRateAlert(id: string): void {
  save(load().filter((a) => a.id !== id));
}

export function corridorKey(
  sourceCurrency: string,
  destinationCountry: string
): string {
  return `${sourceCurrency.toUpperCase()}-${destinationCountry.toUpperCase()}`;
}

/** Return alerts whose target rate has been met by the live quote. */
export function checkRateAlerts(
  sourceCurrency: string,
  destinationCurrency: string,
  destinationCountry: string,
  exchangeRate: number | undefined
): RateAlertHit[] {
  if (exchangeRate == null || !Number.isFinite(exchangeRate)) return [];
  const key = corridorKey(sourceCurrency, destinationCountry);
  return load()
    .filter(
      (a) =>
        a.corridor === key &&
        a.destinationCurrency === destinationCurrency &&
        exchangeRate >= a.targetRate
    )
    .map((alert) => ({ alert, currentRate: exchangeRate }));
}
