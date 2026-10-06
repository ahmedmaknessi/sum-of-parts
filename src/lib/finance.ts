/**
 * Pure finance math for the channel. Every dollar figure shown on screen must
 * come from these functions (never typed by hand).
 *
 * Convention: a fixed deposit at the END of each month, compounded monthly at
 * annualRate / 12.
 */

const MONTHS_PER_YEAR = 12;

/** Balance after `months` monthly deposits (end of month), at a monthly rate. */
const balanceAfterMonths = (monthlyDeposit: number, annualRate: number, months: number): number => {
  const r = annualRate / MONTHS_PER_YEAR;
  if (r === 0) {
    return monthlyDeposit * months;
  }
  return (monthlyDeposit * ((1 + r) ** months - 1)) / r;
};

/** Future value of a monthly deposit after `years` years. With rate 0 it is deposit x months. */
export const futureValueMonthly = (monthlyDeposit: number, annualRate: number, years: number): number =>
  balanceAfterMonths(monthlyDeposit, annualRate, Math.round(years * MONTHS_PER_YEAR));

export type YearRow = {
  /** 1-based year number. */
  readonly year: number;
  /** Balance at the end of the year. */
  readonly balance: number;
  readonly depositedThisYear: number;
  /** Interest earned during this year (balance change minus deposits). */
  readonly growthThisYear: number;
  readonly totalDeposited: number;
};

/** One row per year, years 1..years. */
export const yearlySeries = (monthlyDeposit: number, annualRate: number, years: number): YearRow[] => {
  const rows: YearRow[] = [];
  let previous = 0;
  for (let year = 1; year <= years; year++) {
    const balance = futureValueMonthly(monthlyDeposit, annualRate, year);
    const depositedThisYear = monthlyDeposit * MONTHS_PER_YEAR;
    rows.push({
      year,
      balance,
      depositedThisYear,
      growthThisYear: balance - previous - depositedThisYear,
      totalDeposited: monthlyDeposit * MONTHS_PER_YEAR * year,
    });
    previous = balance;
  }
  return rows;
};

/** Balance at every month 0..years*12, for smooth line charts (index = month). */
export const monthlyBalances = (monthlyDeposit: number, annualRate: number, years: number): number[] =>
  Array.from({ length: Math.round(years * MONTHS_PER_YEAR) + 1 }, (_, month) =>
    balanceAfterMonths(monthlyDeposit, annualRate, month),
  );

/** Interest a fixed balance earns over one year of monthly compounding (no new deposits). */
export const yearGrowthOnBalance = (balance: number, annualRate: number): number =>
  balance * ((1 + annualRate / MONTHS_PER_YEAR) ** MONTHS_PER_YEAR - 1);

/** Monthly deposit needed to reach `target` in `years` years. */
export const monthlyDepositToReach = (target: number, annualRate: number, years: number): number =>
  target / futureValueMonthly(1, annualRate, years);

/** First year whose growth exceeds that year's deposits, or null if it never happens. */
export const firstYearGrowthExceedsDeposits = (rows: readonly YearRow[]): number | null =>
  rows.find((r) => r.growthThisYear > r.depositedThisYear)?.year ?? null;

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export type USDFormat = {
  /** "$262K", "$1.2M" instead of "$262,481". */
  readonly compact?: boolean;
  /** Digits after the decimal point for the full format (default 0), e.g. 2 for "$3.29". */
  readonly decimals?: number;
  /** Prefix positive values with "+" (e.g. "+$39"). */
  readonly signed?: boolean;
};

/** Hyphen-minus is used for negatives ("-$63,332") to match the spec's labels. */
const sign = (value: number, signed: boolean) => (value < 0 ? "-" : signed && value > 0 ? "+" : "");

/**
 * "$262,481" by default.
 * Compact: under $1,000 stays whole dollars ("$39"), thousands round to whole K
 * ("$17K", "$140K"), millions and up keep one decimal ("$1.2M", "$3.4B").
 */
export const formatUSD = (value: number, { compact = false, decimals = 0, signed = false }: USDFormat = {}): string => {
  const abs = Math.abs(value);
  const s = sign(Number(abs.toFixed(decimals)) === 0 ? 0 : value, signed);

  if (compact && abs >= 999.5) {
    const k = Math.round(abs / 1_000);
    if (k < 1_000) {
      return `${s}$${k}K`;
    }
    const steps = [
      { size: 1e12, suffix: "T" },
      { size: 1e9, suffix: "B" },
      { size: 1e6, suffix: "M" },
    ];
    const step = steps.find((x) => abs >= x.size * 0.99995) ?? steps[2];
    return `${s}$${(abs / step.size).toFixed(1)}${step.suffix}`;
  }

  const body = abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${s}$${body}`;
};

/** 0.817 -> "82%" (or with decimals: "81.7%"). */
export const formatPercent = (fraction: number, decimals = 0): string =>
  `${(fraction * 100).toFixed(decimals)}%`;
