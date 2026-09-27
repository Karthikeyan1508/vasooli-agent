import assert from "node:assert/strict";
import test from "node:test";
import { deriveStatus } from "./invoice.service.js";

test("a completed nudge call still advances to notice and overdue", () => {
  assert.equal(deriveStatus(39, "called"), "called");
  assert.equal(deriveStatus(40, "called"), "noticed");
  assert.equal(deriveStatus(45, "called"), "overdue");
  assert.equal(deriveStatus(45, "paid"), "paid");
});
