/**
 * Every number video 02 shows, with its source. Values are copied from the
 * verified facts table in script.md; labels are derived here so no scene
 * types a number. Checked by data.test.ts (npm test).
 */
import { formatPercent, formatUSD } from "../../lib/finance";

const BILLION = 1e9;

/** Illustrative examples (not data): shown with an "Example" tag. */
export const EXAMPLES = {
  /** Scene 01 and 09: the balance in "your" banking app. */
  balance: 4_280,
  /** Scene 03: the textbook deposit, as five paper banknotes. */
  textbookDeposit: 1_000,
  textbookNotes: 5,
  /** Scenes 05 to 07: Sarah's car loan. */
  carLoan: 20_000,
} as const;

export const SOURCES = {
  boeCreation: "Bank of England, Quarterly Bulletin 2014 Q1",
  boeShort: "Bank of England, 2014",
  h6: "Federal Reserve H.6, July 2026",
  regD: "Federal Register, Regulation D, 2020",
  oig: "Federal Reserve OIG, 2023",
} as const;

export const FACTS = {
  /** Federal Reserve H.6 via FRED, July 2026 (M2SL). */
  m2: 23_218.0 * BILLION,
  /** Federal Reserve H.6 via FRED, July 2026: currency in circulation (CURRCIR). */
  cash: 2_472.3 * BILLION,
  /** Bank of England 2014: share of money held as bank deposits (Dec 2013). */
  ukDepositShare: 0.97,
  /** Regulation D: US reserve requirement since 26 March 2020. */
  reserveRequirement: 0,
  reserveZeroSince: { month: "March", year: 2020 },
  /** FDIC history: bank failures 1930 to 1933. */
  depressionFailures: 9_000,
  depressionDecade: "1930s",
  /** Fed OIG, Material Loss Review of SVB. */
  svb: {
    deposits: 166 * BILLION,
    withdrawnInOneDay: 42 * BILLION,
    pendingNextDay: 100 * BILLION,
    uninsuredShare: 0.94,
    closed: "March 10, 2023",
  },
  /** FDIC: standard coverage, per depositor, per bank. */
  fdicLimit: 250_000,
  fdicFounded: 1933,
} as const;

const cashShare = FACTS.cash / FACTS.m2;
/** Squares in the 10 x 10 grid. */
const GRID = 100;

export const DATA = {
  cashShare,
  /** Grid squares that turn into banknotes (script: "about 11"). */
  cashSquares: Math.round(cashShare * GRID),
  /** "About 9 in 10" dollars were never printed. */
  neverPrintedOutOfTen: Math.round((1 - cashShare) * 10),
  ukCashSquares: Math.round((1 - FACTS.ukDepositShare) * GRID),
  svbWithdrawnShare: FACTS.svb.withdrawnInOneDay / FACTS.svb.deposits,
} as const;

const usd = (v: number) => formatUSD(v);
const billions = (v: number) => formatUSD(v, { compact: true, compactDecimals: 0 });
const trillions = (v: number) => formatUSD(v, { compact: true });

export const LABELS = {
  balance: usd(EXAMPLES.balance), // "$4,280"
  textbookDeposit: usd(EXAMPLES.textbookDeposit), // "$1,000"
  carLoan: usd(EXAMPLES.carLoan), // "$20,000"
  newMoney: formatUSD(EXAMPLES.carLoan, { signed: true }), // "+$20,000"
  /** The banner after the loan is repaid (script: "+$0"). */
  newMoneyGone: `+${usd(0)}`, // "+$0"
  m2: trillions(FACTS.m2), // "$23.2T"
  cash: trillions(FACTS.cash), // "$2.5T"
  nineInTen: `${DATA.neverPrintedOutOfTen} in 10`, // "9 in 10"
  ukShare: formatPercent(FACTS.ukDepositShare), // "97%"
  reserveRequirement: formatPercent(FACTS.reserveRequirement), // "0%"
  reserveZeroSince: `Since ${FACTS.reserveZeroSince.month} ${FACTS.reserveZeroSince.year}`, // "Since March 2020"
  svbDeposits: billions(FACTS.svb.deposits), // "$166B"
  svbWithdrawn: billions(FACTS.svb.withdrawnInOneDay), // "$42B"
  svbPending: billions(FACTS.svb.pendingNextDay), // "$100B"
  svbUninsured: formatPercent(FACTS.svb.uninsuredShare), // "94%"
  svbClosed: `CLOSED: ${FACTS.svb.closed}`,
  fdicLimit: usd(FACTS.fdicLimit), // "$250,000"
  fdicSince: `Since ${FACTS.fdicFounded}`, // "Since 1933"
  depressionDecade: FACTS.depressionDecade,
} as const;
