import assert from "node:assert/strict";
import test from "node:test";
import { toMinorUnits } from "./dodo.service.js";

test("invoice amounts are converted to INR paise", () => {
  assert.equal(toMinorUnits("240000.50"), 24000050);
  assert.throws(() => toMinorUnits(0));
});
