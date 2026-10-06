/**
 * Finance checks from BUILD_VIDEO_01.md (Phase 2). Every value is asserted
 * EXACTLY after rounding to the displayed precision. Run: npm test
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  firstYearGrowthExceedsDeposits,
  formatPercent,
  formatUSD,
  futureValueMonthly,
  monthlyBalances,
  monthlyDepositToReach,
  yearGrowthOnBalance,
  yearlySeries,
} from "./finance";

const DEPOSIT = 100;
const round = (n: number) => Math.round(n);

describe("futureValueMonthly ($100 a month, deposit at end of each month)", () => {
  const cases: [rate: number, years: number, expected: number, label: string][] = [
    [0, 40, 48_000, "0%, 40 years"],
    [0.04, 40, 118_196, "4%, 40 years"],
    [0.07, 10, 17_308, "7%, 10 years"],
    [0.07, 20, 52_093, "7%, 20 years"],
    [0.07, 30, 121_997, "7%, 30 years"],
    [0.07, 40, 262_481, "7%, 40 years"],
    [0.1, 40, 632_408, "10%, 40 years"],
    [0.06, 40, 199_149, "6%, 40 years (1% fee case)"],
  ];
  for (const [rate, years, expected, label] of cases) {
    test(`${label} = ${expected.toLocaleString("en-US")}`, () => {
      assert.equal(round(futureValueMonthly(DEPOSIT, rate, years)), expected);
    });
  }

  test("rate 0 returns deposit x months", () => {
    assert.equal(futureValueMonthly(DEPOSIT, 0, 40), DEPOSIT * 480);
  });
});

describe("yearlySeries at 7%", () => {
  const rows = yearlySeries(DEPOSIT, 0.07, 40);

  test("has one row per year with running deposits", () => {
    assert.equal(rows.length, 40);
    assert.equal(rows[0].year, 1);
    assert.equal(rows[39].totalDeposited, 48_000);
    assert.equal(rows[39].depositedThisYear, 1_200);
  });

  test("growth in year 1 = 39", () => {
    assert.equal(round(rows[0].growthThisYear), 39);
  });

  test("growth in year 11 = 1,290, the first year growth > 1,200", () => {
    assert.equal(round(rows[10].growthThisYear), 1_290);
    assert.ok(rows[9].growthThisYear <= 1_200, "year 10 growth must not exceed deposits");
    assert.equal(firstYearGrowthExceedsDeposits(rows), 11);
  });

  test("growth in year 40 = 17,651", () => {
    assert.equal(round(rows[39].growthThisYear), 17_651);
  });

  test("added per decade = 17,308 / 34,784 / 69,904 / 140,484", () => {
    const at = (year: number) => (year === 0 ? 0 : rows[year - 1].balance);
    const adds = [1, 2, 3, 4].map((d) => round(at(d * 10) - at((d - 1) * 10)));
    assert.deepEqual(adds, [17_308, 34_784, 69_904, 140_484]);
  });

  test("final row matches futureValueMonthly", () => {
    assert.equal(rows[39].balance, futureValueMonthly(DEPOSIT, 0.07, 40));
  });
});

describe("derived results at 7%, 40 years", () => {
  const final = futureValueMonthly(DEPOSIT, 0.07, 40);
  const deposits = DEPOSIT * 480;

  test("growth share = 81.7%, shown as 82%", () => {
    const share = (final - deposits) / final;
    assert.equal(Math.round(share * 1000) / 10, 81.7);
    assert.equal(formatPercent(share), "82%");
  });

  test("final minus deposits = 214,481", () => {
    assert.equal(round(final - deposits), 214_481);
  });

  test("start 10 years late: gap at the end = 140,484", () => {
    assert.equal(round(final - futureValueMonthly(DEPOSIT, 0.07, 30)), 140_484);
  });

  test("monthly deposit over 30 years to match 262,481 = 215", () => {
    assert.equal(round(monthlyDepositToReach(final, 0.07, 30)), 215);
  });
});

describe("year 2 growth breakdown at 7%", () => {
  test("growth on year-1 deposits + growth on year-1 growth + growth on new deposits = year 2 growth", () => {
    const rows = yearlySeries(DEPOSIT, 0.07, 2);
    const onDeposits = yearGrowthOnBalance(1_200, 0.07);
    const onGrowth = yearGrowthOnBalance(rows[0].growthThisYear, 0.07);
    const onNew = rows[0].growthThisYear; // new deposits earn exactly what year 1's deposits earned in year 1
    assert.ok(Math.abs(onDeposits + onGrowth + onNew - rows[1].growthThisYear) < 1e-9);
    assert.equal(round(onDeposits), 87);
    assert.equal(round(onGrowth), 3);
  });
});

describe("monthlyBalances", () => {
  test("481 points from month 0 to 480, ending at the future value", () => {
    const m = monthlyBalances(DEPOSIT, 0.07, 40);
    assert.equal(m.length, 481);
    assert.equal(m[0], 0);
    assert.equal(m[480], futureValueMonthly(DEPOSIT, 0.07, 40));
  });
});

describe("formatUSD", () => {
  test("full format", () => {
    assert.equal(formatUSD(262_481.34), "$262,481");
    assert.equal(formatUSD(48_000), "$48,000");
    assert.equal(formatUSD(3.2877, { decimals: 2 }), "$3.29");
  });

  test("compact format", () => {
    assert.equal(formatUSD(262_481.34, { compact: true }), "$262K");
    assert.equal(formatUSD(1_234_567, { compact: true }), "$1.2M");
    assert.equal(formatUSD(17_308.48, { compact: true }), "$17K");
    assert.equal(formatUSD(140_484.24, { compact: true }), "$140K");
    assert.equal(formatUSD(39.26, { compact: true }), "$39");
    assert.equal(formatUSD(999_600, { compact: true }), "$1.0M");
  });

  test("signs", () => {
    assert.equal(formatUSD(39.26, { signed: true }), "+$39");
    assert.equal(formatUSD(-63_332.27), "-$63,332");
    assert.equal(formatUSD(34_784.19, { compact: true, signed: true }), "+$35K");
  });
});
