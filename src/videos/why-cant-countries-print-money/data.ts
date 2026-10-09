/**
 * Every number video 03 shows, with its source (script.md, verified facts).
 * Labels are derived here so no scene types a number. Checked by
 * data.test.ts (npm test).
 */
import { formatPercent, formatUSD } from "../../lib/finance";

const BILLION = 1e9;

export const SOURCES = {
  hanke: "Hanke and Kwok, Cato Journal, 2009",
  bbc: "BBC News, 2009",
  h6: "Federal Reserve H.6, via FRED",
  bls: "US Bureau of Labor Statistics",
  cofer: "IMF COFER, 2026 Q1",
} as const;

/** The simplified island economy (scene 03). Not data: labelled "Simplified example". */
export const ISLAND = { loaves: 10, money: 10, printed: 10 } as const;

export const FACTS = {
  /** BBC, 16 January 2009. */
  note: { face: 100e12, launchUsd: 30, issued: { month: "Jan", year: 2009 } },
  /** Hanke and Kwok 2009, Table 2: time for prices to double at the November 2008 peak (hours). */
  doublingHours: 24.7,
  /** Hanke and Kwok 2009: monthly inflation at the peak, 14 November 2008 (percent). */
  peakMonthlyPercent: 79.6e9,
  peakWhen: "Nov 2008",
  /** BBC, 12 April 2009: Zimbabwean dollar suspended. */
  suspended: "April 2009",
  /** Federal Reserve H.6 via FRED (M2SL). */
  m2: { feb2020: 15_492.8 * BILLION, mar2022: 21_788.1 * BILLION },
  /** BLS: CPI, 12 months to June 2022, largest since November 1981. */
  cpiJune2022: 0.091,
  cpiYearsSince: 40,
  /** IMF COFER 2026 Q1: share of US dollars in allocated FX reserves. */
  usdReserveShare: 0.5713,
  /** Fed, ECB and Bank of England inflation targets. */
  inflationTarget: 0.02,
} as const;

export const DATA = {
  m2Growth: FACTS.m2.mar2022 / FACTS.m2.feb2020 - 1,
  islandPriceBefore: ISLAND.money / ISLAND.loaves,
  islandPriceAfter: (ISLAND.money + ISLAND.printed) / ISLAND.loaves,
} as const;

const plainUsd = (v: number) => formatUSD(v);

export const LABELS = {
  /** Cut into the paper note: the face value, in full. */
  noteDigits: FACTS.note.face.toLocaleString("en-US"), // "100,000,000,000,000"
  noteIssued: `${FACTS.note.issued.month} ${FACTS.note.issued.year}`, // "Jan 2009"
  noteUsd: plainUsd(FACTS.note.launchUsd), // "$30"
  noteAbout: `About ${plainUsd(FACTS.note.launchUsd)}`,
  /** Thumbnails: "$100 TRILLION" and "= $30". */
  noteShort: `$${FACTS.note.face / 1e12} TRILLION`,
  noteEquals: `= ${plainUsd(FACTS.note.launchUsd)}`,
  /** The hook's loaf tag doubling with each turn of the clock (illustrative: 1, 2, 4). */
  doublingTags: [1, 2, 4].map((v) => plainUsd(DATA.islandPriceBefore * v)),
  peakWhenShort: FACTS.peakWhen,
  doubling: `Prices doubled every ${FACTS.doublingHours} hours`,
  peak: `${(FACTS.peakMonthlyPercent).toLocaleString("en-US")}%`, // "79,600,000,000%"
  peakWhen: `per month, ${FACTS.peakWhen}`,
  suspended: `Zimbabwean dollar suspended, ${FACTS.suspended}`,
  islandBefore: plainUsd(DATA.islandPriceBefore), // "$1"
  islandAfter: plainUsd(DATA.islandPriceAfter), // "$2"
  /** "Money: $10 -> $20" and "Bread: 10 -> 10", as the two sides of a drawn arrow (Outfit has no arrow glyph). */
  islandMoney: [`Money: ${plainUsd(ISLAND.money)}`, plainUsd(ISLAND.money + ISLAND.printed)] as const,
  islandBread: [`Bread: ${ISLAND.loaves}`, String(ISLAND.loaves)] as const,
  m2Before: formatUSD(FACTS.m2.feb2020, { compact: true }), // "$15.5T"
  m2After: formatUSD(FACTS.m2.mar2022, { compact: true }), // "$21.8T"
  m2Growth: `+${formatPercent(DATA.m2Growth, 1)}`, // "+40.6%"
  cpi: formatPercent(FACTS.cpiJune2022, 1), // "9.1%"
  cpiNote: `June 2022, highest in ${FACTS.cpiYearsSince} years`,
  usdShare: formatPercent(FACTS.usdReserveShare), // "57%"
  usdShareNote: `${formatPercent(FACTS.usdReserveShare)} of reserves in USD`,
  target: formatPercent(FACTS.inflationTarget), // "2%"
  m2BeforeWhen: "Feb 2020",
  m2AfterWhen: "Mar 2022",
} as const;
