export type NumberUnit = "none" | "currency" | "percent";

export type NumberFormat = {
  /** "currency" prefixes $, "percent" suffixes % (pass 7 for 7%, not 0.07). */
  readonly unit?: NumberUnit;
  /** Abbreviates large numbers: 1,200,000 becomes 1.2M. */
  readonly compact?: boolean;
  /** Digits after the decimal point. Defaults to 1 when compact, else 0. */
  readonly decimals?: number;
  /** Drops trailing zeros after the decimal point: $80.0K becomes $80K. */
  readonly trimZeros?: boolean;
};

const COMPACT_STEPS = [
  { threshold: 1e12, suffix: "T" },
  { threshold: 1e9, suffix: "B" },
  { threshold: 1e6, suffix: "M" },
  { threshold: 1e3, suffix: "K" },
] as const;

/** Typographic minus sign, matches the width of digits better than a hyphen. */
const MINUS = "−";

/**
 * Formats a number for on-screen display.
 * formatNumber(1234567, {unit: "currency", compact: true}) -> "$1.2M"
 * formatNumber(7.25, {unit: "percent", decimals: 1}) -> "7.3%"
 * formatNumber(48210) -> "48,210"
 */
export const formatNumber = (
  value: number,
  { unit = "none", compact = false, decimals, trimZeros = false }: NumberFormat = {},
): string => {
  const abs = Math.abs(value);
  let scaled = abs;
  let suffix = "";

  if (compact) {
    const step = COMPACT_STEPS.find((s) => abs >= s.threshold);
    if (step) {
      scaled = abs / step.threshold;
      suffix = step.suffix;
    }
  }

  const digits = decimals ?? (compact && suffix !== "" ? 1 : 0);
  const body = scaled.toLocaleString("en-US", {
    minimumFractionDigits: trimZeros ? 0 : digits,
    maximumFractionDigits: digits,
  });

  const sign = value < 0 && Number(body.replace(/,/g, "")) !== 0 ? MINUS : "";
  const prefix = unit === "currency" ? "$" : "";
  const percent = unit === "percent" ? "%" : "";

  return `${sign}${prefix}${body}${suffix}${percent}`;
};
