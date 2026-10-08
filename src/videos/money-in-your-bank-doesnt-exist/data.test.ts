/**
 * Video 02: every on-screen number, checked against the verified facts
 * table in script.md. Run: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DATA, LABELS } from "./data";

test("video 02 labels match the script", () => {
  assert.equal(LABELS.balance, "$4,280");
  assert.equal(LABELS.textbookDeposit, "$1,000");
  assert.equal(LABELS.carLoan, "$20,000");
  assert.equal(LABELS.newMoney, "+$20,000");
  assert.equal(LABELS.newMoneyGone, "+$0");
  assert.equal(LABELS.m2, "$23.2T");
  assert.equal(LABELS.cash, "$2.5T");
  assert.equal(LABELS.nineInTen, "9 in 10");
  assert.equal(LABELS.ukShare, "97%");
  assert.equal(LABELS.reserveRequirement, "0%");
  assert.equal(LABELS.reserveZeroSince, "Since March 2020");
  assert.equal(LABELS.svbDeposits, "$166B");
  assert.equal(LABELS.svbWithdrawn, "$42B");
  assert.equal(LABELS.svbPending, "$100B");
  assert.equal(LABELS.svbUninsured, "94%");
  assert.equal(LABELS.fdicLimit, "$250,000");
  assert.equal(LABELS.fdicSince, "Since 1933");
});

test("cash share: about 1 in 10 dollars is cash (script: 10.6%, about 11 squares)", () => {
  assert.ok(Math.abs(DATA.cashShare - 0.106) < 0.0005);
  assert.equal(DATA.cashSquares, 11);
  assert.equal(DATA.neverPrintedOutOfTen, 9);
  assert.equal(DATA.ukCashSquares, 3);
});

test("SVB: $42B was about a quarter of deposits", () => {
  assert.ok(DATA.svbWithdrawnShare > 0.24 && DATA.svbWithdrawnShare < 0.26);
});
