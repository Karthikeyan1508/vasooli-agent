// SQL-backed complaint upsert using statutory interest rules.
import { FILING_DAY, RBI_BANK_RATE } from "../../../shared/constants.js";
import { query } from "../db.js";
import { calculateInterest } from "./interest.js";
import type { InvoiceRow } from "./invoice.service.js";
export type ComplaintRow = { id: string; invoice_id: string; principal: string; interest: string; total: string; rbi_rate: string; days_overdue: number; pdf_url: string; status: "draft" | "filed" };
export async function ensureComplaint(invoice: InvoiceRow): Promise<ComplaintRow> { const principal = Number(invoice.amount); const daysOverdue = Math.max(0, invoice.days_elapsed - FILING_DAY); const interest = calculateInterest(principal, daysOverdue); return (await query<ComplaintRow>(`INSERT INTO complaints (invoice_id, principal, interest, total, rbi_rate, days_overdue, pdf_url) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (invoice_id) DO UPDATE SET interest=EXCLUDED.interest,total=EXCLUDED.total,days_overdue=EXCLUDED.days_overdue,updated_at=now() RETURNING *`, [invoice.id, principal, interest, principal + interest, RBI_BANK_RATE, daysOverdue, `/api/invoices/${invoice.id}/complaint.pdf`]))[0]; }
