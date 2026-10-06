/**
 * Every number used by video 01, computed once from src/lib/finance.ts.
 * Scenes import from here and never compute or type numbers themselves.
 */
import {
  firstYearGrowthExceedsDeposits,
  formatPercent,
  formatUSD,
  futureValueMonthly,
  monthlyBalances,
  monthlyDepositToReach,
  yearGrowthOnBalance,
  yearlySeries,
} from "../../lib/finance";
import { niceDomain } from "../../lib/scale";

// ---------------------------------------------------------------------------
// Assumptions (the only hand-entered values)
// ---------------------------------------------------------------------------

export const ASSUMPTIONS = {
  monthlyDeposit: 100,
  years: 40,
  startAge: 25,
  /** Stocks after inflation (S&P 500 1926 to 2026 real return, rounded). */
  investRate: 0.07,
  /** Stocks before inflation (S&P 500 1926 to 2026 nominal return, rounded). */
  nominalRate: 0.1,
  savingsRate: 0.04,
  mattressRate: 0,
  /** Yearly fund fee in the fine-print scene. */
  fee: 0.01,
  /** Years of delay in the cost-of-waiting scene. */
  lateStartYears: 10,
  /** "You'd think you'd end up with about three quarters." */
  naiveShareAfterDelay: 0.75,
  daysPerYear: 365,
  /** "Most people guess somewhere around fifty thousand." (the narrated guess, not a result) */
  typicalGuess: 50_000,
} as const;

/** Source for the return assumption (cited on screen in Scene 06). */
export const SOURCES = {
  marketStartYear: 1926,
  marketEndYear: 2026,
  site: "officialdata.org",
} as const;

/**
 * Illustrative market drops named in the narration ("thirty or forty percent").
 * Not computed: they label a decorative, explicitly "Illustrative" chart.
 */
export const ILLUSTRATIVE_DROPS = [-0.3, -0.4] as const;

const A = ASSUMPTIONS;
const MONTHS = A.years * 12;
/** A decade is ten years (Scenes 07 to 08 split the 40 years into decades). */
const DECADE_YEARS = 10;
const DECADES = A.years / DECADE_YEARS;

// ---------------------------------------------------------------------------
// Core results
// ---------------------------------------------------------------------------

const fv = (rate: number, years: number = A.years) => futureValueMonthly(A.monthlyDeposit, rate, years);

const mattress = fv(A.mattressRate);
const savings = fv(A.savingsRate);
const invested = fv(A.investRate);
const nominal = fv(A.nominalRate);
const withFee = fv(A.investRate - A.fee);
const lateStart = fv(A.investRate, A.years - A.lateStartYears);

const series = yearlySeries(A.monthlyDeposit, A.investRate, A.years);
const balanceAtYear = (year: number) => (year === 0 ? 0 : series[year - 1].balance);
const decadeAdds = Array.from(
  { length: DECADES },
  (_, d) => balanceAtYear((d + 1) * DECADE_YEARS) - balanceAtYear(d * DECADE_YEARS),
);
const tippingYear = firstYearGrowthExceedsDeposits(series);
if (tippingYear === null) {
  throw new Error("Growth never exceeds deposits: check the assumptions");
}
const tippingRow = series[tippingYear - 1];
const totalDeposited = A.monthlyDeposit * MONTHS;
const growth = invested - totalDeposited;
const mattressAt10 = futureValueMonthly(A.monthlyDeposit, A.mattressRate, 10);
/** Scene 07 value axis: round ticks covering the largest curve. */
const curveAxis = niceDomain(0, invested, 3);

export const DATA = {
  months: MONTHS,
  endAge: A.startAge + A.years,
  depositPerYear: A.monthlyDeposit * 12,
  depositPerDay: (A.monthlyDeposit * 12) / A.daysPerYear,
  totalDeposited,

  /** Final balances after 40 years. */
  final: { mattress, savings, invested, nominal, withFee },
  /** 7% balance at the end of years 10, 20, 30, 40. */
  milestones: [10, 20, 30, 40].map((year) => ({ year, balance: balanceAtYear(year) })),
  /** Money added in each decade at 7%. */
  decadeAdds,
  firstThreeDecades: decadeAdds[0] + decadeAdds[1] + decadeAdds[2],
  lastDecade: decadeAdds[3],

  /** Yearly rows at 7% (index 0 = year 1). */
  series,
  growthYear1: series[0].growthThisYear,
  /** Where year 2's growth comes from (Scene 05). Sums to series[1].growthThisYear. */
  yearTwo: {
    onFirstDeposit: yearGrowthOnBalance(A.monthlyDeposit * 12, A.investRate),
    onFirstGrowth: yearGrowthOnBalance(series[0].growthThisYear, A.investRate),
    onNewDeposits: series[0].growthThisYear,
  },
  /** 7% minus the mattress after 10 years ("only five thousand more"). */
  tenYearEdge: balanceAtYear(10) - mattressAt10,
  /** Scene 07/10/12 chart axes. */
  axis: { years: [0, 10, 20, 30, 40], maxValue: curveAxis.max, valueTicks: curveAxis.ticks },
  growthYearLast: series[series.length - 1].growthThisYear,
  tipping: { year: tippingYear, growth: tippingRow.growthThisYear, deposited: tippingRow.depositedThisYear },

  growth,
  growthShare: growth / invested,
  depositShare: totalDeposited / invested,

  late: {
    startAge: A.startAge + A.lateStartYears,
    balance: lateStart,
    naiveExpectation: invested * A.naiveShareAfterDelay,
    gap: invested - lateStart,
    catchUpDeposit: monthlyDepositToReach(invested, A.investRate, A.years - A.lateStartYears),
  },
  feeLoss: invested - withFee,

  /** Monthly balances for smooth chart lines (index = month, 0..480). */
  curves: {
    mattress: monthlyBalances(A.monthlyDeposit, A.mattressRate, A.years),
    savings: monthlyBalances(A.monthlyDeposit, A.savingsRate, A.years),
    invested: monthlyBalances(A.monthlyDeposit, A.investRate, A.years),
    /** Starts 10 years late: zero until month 120, then 30 years of deposits. */
    lateStart: [
      ...Array<number>(A.lateStartYears * 12).fill(0),
      ...monthlyBalances(A.monthlyDeposit, A.investRate, A.years - A.lateStartYears),
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// Display labels (derived from the exact values above)
// ---------------------------------------------------------------------------

const usd = (v: number) => formatUSD(v);
const usdK = (v: number) => formatUSD(v, { compact: true });
const pct = (rate: number) => formatPercent(rate);

export const LABELS = {
  deposit: usd(A.monthlyDeposit), // "$100"
  typicalGuess: usd(A.typicalGuess), // "$50,000"
  depositPerDay: formatUSD(DATA.depositPerDay, { decimals: 2 }), // "$3.29"
  depositPerYear: usd(DATA.depositPerYear), // "$1,200"
  months: String(MONTHS), // "480"
  startAge: String(A.startAge),
  endAge: String(DATA.endAge),
  lateStartAge: String(DATA.late.startAge),
  years: String(A.years),
  lateStartYears: String(A.lateStartYears),

  investRate: pct(A.investRate), // "7%"
  nominalRate: pct(A.nominalRate), // "10%"
  savingsRate: pct(A.savingsRate), // "4%"
  fee: pct(A.fee), // "1%"
  drops: ILLUSTRATIVE_DROPS.map((d) => pct(d)), // ["-30%", "-40%"]

  totalDeposited: usd(totalDeposited), // "$48,000"
  totalDepositedK: usdK(totalDeposited), // "$48K"
  savingsFinalK: usdK(savings), // "$118K"
  final: usd(invested), // "$262,481"
  finalK: usdK(invested), // "$262K"
  withFee: usd(withFee), // "$199,149"
  feeLoss: formatUSD(-DATA.feeLoss), // "-$63,332"
  milestones: DATA.milestones.map((m) => usd(m.balance)), // "$17,308", "$52,093", "$121,997", "$262,481"
  decadeAdds: decadeAdds.map((v) => formatUSD(v, { compact: true, signed: true })), // "+$17K" ... "+$140K"
  decadeRanges: decadeAdds.map((_, i) => `Years ${i * DECADE_YEARS + 1}–${(i + 1) * DECADE_YEARS}`), // "Years 1–10" ...
  firstThreeDecades: formatUSD(DATA.firstThreeDecades, { compact: true, signed: true }), // "+$122K"
  lastDecadeYears: String(DECADE_YEARS), // "10"
  firstDecadesYears: String(A.years - DECADE_YEARS), // "30"
  growthYear1: formatUSD(DATA.growthYear1, { signed: true }), // "+$39"
  growthYearLast: usd(DATA.growthYearLast), // "$17,651"
  tippingYear: String(tippingYear), // "11"
  tippingGrowth: usd(tippingRow.growthThisYear), // "$1,290"
  tippingDeposited: usd(tippingRow.depositedThisYear), // "$1,200"
  growth: usd(growth), // "$214,481"
  growthShare: formatPercent(DATA.growthShare), // "82%"
  depositShare: formatPercent(DATA.depositShare), // "18%"
  lateBalance: usd(lateStart), // "$121,997"
  naiveExpectation: usd(DATA.late.naiveExpectation), // "$196,861"
  lateGap: usd(DATA.late.gap), // "$140,484"
  catchUpDeposit: usd(DATA.late.catchUpDeposit), // "$215"
  tenYearEdge: formatUSD(DATA.tenYearEdge, { compact: true, signed: true }), // "+$5K"
  valueTicks: DATA.axis.valueTicks.map((v) => formatUSD(v, { compact: true })), // "$0" ... "$300K"
  sourceSP500: `S&P 500 returns ${SOURCES.marketStartYear} to ${SOURCES.marketEndYear}, ${SOURCES.site}`,
} as const;
