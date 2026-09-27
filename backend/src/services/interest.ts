// Statutory compound-free interest calculation for delayed MSME payments.
import { INTEREST_MULTIPLIER, RBI_BANK_RATE } from "../../../shared/constants.js";
export function calculateInterest(principal: number, daysOverdue: number): number { const rate = RBI_BANK_RATE * INTEREST_MULTIPLIER / 100; return Math.round(principal * rate * (daysOverdue / 365) * 100) / 100; }
