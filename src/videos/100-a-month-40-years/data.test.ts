/**
 * Video 01 constants: every on-screen label the spec names must come out of
 * data.ts exactly like this. Run: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ASSUMPTIONS, DATA, LABELS } from "./data";
import { JAGGED_CURVE } from "./parts/jaggedCurve";

test("video 01 labels match the spec", () => {
  assert.equal(LABELS.deposit, "$100");
  assert.equal(LABELS.typicalGuess, "$50,000");
  assert.equal(LABELS.depositPerDay, "$3.29");
  assert.equal(LABELS.depositPerYear, "$1,200");
  assert.equal(LABELS.months, "480");
  assert.equal(LABELS.startAge, "25");
  assert.equal(LABELS.endAge, "65");
  assert.equal(LABELS.lateStartAge, "35");
  assert.equal(LABELS.investRate, "7%");
  assert.equal(LABELS.nominalRate, "10%");
  assert.equal(LABELS.savingsRate, "4%");
  assert.deepEqual(LABELS.drops, ["-30%", "-40%"]);
  assert.equal(LABELS.totalDeposited, "$48,000");
  assert.equal(LABELS.totalDepositedK, "$48K");
  assert.equal(LABELS.savingsFinalK, "$118K");
  assert.equal(LABELS.final, "$262,481");
  assert.deepEqual(LABELS.milestones, ["$17,308", "$52,093", "$121,997", "$262,481"]);
  assert.deepEqual(LABELS.decadeAdds, ["+$17K", "+$35K", "+$70K", "+$140K"]);
  assert.deepEqual(LABELS.decadeRanges, ["Years 1–10", "Years 11–20", "Years 21–30", "Years 31–40"]);
  assert.equal(LABELS.firstThreeDecades, "+$122K");
  assert.equal(LABELS.growthYear1, "+$39");
  assert.equal(LABELS.tippingYear, "11");
  assert.equal(LABELS.tippingGrowth, "$1,290");
  assert.equal(LABELS.tippingDeposited, "$1,200");
  assert.equal(LABELS.growthYearLast, "$17,651");
  assert.equal(LABELS.growth, "$214,481");
  assert.equal(LABELS.growthShare, "82%");
  assert.equal(LABELS.depositShare, "18%");
  assert.equal(LABELS.lateBalance, "$121,997");
  assert.equal(LABELS.naiveExpectation, "$196,861");
  assert.equal(LABELS.lateGap, "$140,484");
  assert.equal(LABELS.catchUpDeposit, "$215");
  assert.equal(LABELS.withFee, "$199,149");
  assert.equal(LABELS.feeLoss, "-$63,332");
  assert.equal(LABELS.tenYearEdge, "+$5K");
  assert.deepEqual(LABELS.valueTicks, ["$0", "$100K", "$200K", "$300K"]);
  assert.equal(LABELS.sourceSP500, "S&P 500 returns 1926 to 2026, officialdata.org");
});

test("video 01 facts hold", () => {
  // "That last decade alone adds more money than the first thirty years combined."
  assert.ok(DATA.lastDecade > DATA.firstThreeDecades);
  // "Less than half."
  assert.ok(DATA.late.balance < DATA.final.invested / 2);
  // "More than double."
  assert.ok(DATA.late.catchUpDeposit > 2 * 100);
  // "Your own deposits are less than one fifth of the final pile."
  assert.ok(DATA.depositShare < 1 / 5);
  // "more than a quarter of a million dollars"
  assert.ok(DATA.final.invested > 250_000);
  // "more than five times that" (vs the ~$50,000 guess)
  assert.ok(DATA.final.invested > 5 * ASSUMPTIONS.typicalGuess);
  // "Only five thousand more than the mattress" after 10 years
  assert.equal(Math.round((DATA.milestones[0].balance - 12_000) / 1_000), 5);
  // Year 2's growth is fully explained by its three parts
  const parts = DATA.yearTwo.onFirstDeposit + DATA.yearTwo.onFirstGrowth + DATA.yearTwo.onNewDeposits;
  assert.ok(Math.abs(parts - DATA.series[1].growthThisYear) < 1e-9);
  // Curves end on the final balances
  assert.equal(DATA.curves.invested[480], DATA.final.invested);
  assert.equal(DATA.curves.lateStart[480], DATA.late.balance);
  assert.equal(DATA.curves.lateStart[120], 0);
  // Scene 12: the illustrative jagged path ends on exactly the same final value
  assert.equal(JAGGED_CURVE.length, DATA.curves.invested.length);
  assert.equal(JAGGED_CURVE[JAGGED_CURVE.length - 1], DATA.final.invested);
});
