/**
 * Video 03: every on-screen number, checked against the verified facts table
 * in script.md and its accuracy rules. Run: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DATA, LABELS } from "./data";

test("video 03 labels match the script", () => {
  assert.equal(LABELS.noteDigits, "100,000,000,000,000");
  assert.equal(LABELS.noteIssued, "Jan 2009");
  assert.equal(LABELS.noteUsd, "$30");
  assert.equal(LABELS.noteShort, "$100 TRILLION");
  assert.equal(LABELS.noteEquals, "= $30");
  assert.equal(LABELS.doubling, "Prices doubled every 24.7 hours");
  assert.equal(LABELS.peak, "79,600,000,000%");
  assert.equal(LABELS.peakWhen, "per month, Nov 2008");
  assert.equal(LABELS.islandBefore, "$1");
  assert.equal(LABELS.islandAfter, "$2");
  assert.equal(LABELS.m2Before, "$15.5T");
  assert.equal(LABELS.m2After, "$21.8T");
  assert.equal(LABELS.cpi, "9.1%");
  assert.equal(LABELS.usdShare, "57%");
  assert.equal(LABELS.target, "2%");
});

test("M2 grew about 40% (the money supply, not prices)", () => {
  assert.ok(Math.abs(DATA.m2Growth - 0.406) < 0.001);
  assert.equal(LABELS.m2Growth, "+40.6%");
});
