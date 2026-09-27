// Resets the three canonical demo invoices back to their pitch-ready baseline.
import { query } from "../db.js";
import { listInvoices } from "./invoice.service.js";

const DEMO_BASELINE: Record<string, { status: string; days_elapsed: number }> = {
  "SEW-2026-101": { status: "pending", days_elapsed: 12 },
  "SEW-2026-102": { status: "called", days_elapsed: 34 },
  "SEW-2026-103": { status: "overdue", days_elapsed: 46 },
};

export async function resetDemoData(): Promise<void> {
  const invoices = await listInvoices();
  for (const invoice of invoices) {
    const baseline = DEMO_BASELINE[invoice.invoice_number];
    if (!baseline) continue;
    await query("UPDATE invoices SET status=$2, days_elapsed=$3, updated_at=now() WHERE id=$1", [invoice.id, baseline.status, baseline.days_elapsed]);
    await query("DELETE FROM complaints WHERE invoice_id = $1", [invoice.id]);
    await query("DELETE FROM calls WHERE invoice_id = $1", [invoice.id]);
  }
}
