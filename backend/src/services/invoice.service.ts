// SQL-backed invoice retrieval and shared API serialization.
import { LEGAL_DEADLINE_DAYS, NOTICE_DAY, NUDGE_DAY } from "../../../shared/constants.js";
import { query } from "../db.js";
export type InvoiceRow = { id: string; msme_id: string; msme_name: string; msme_udyam: string; buyer_id: string; buyer_name: string; buyer_phone: string; buyer_email: string; invoice_number: string; amount: string; invoice_date: string; due_date: string; language: "hi" | "ta" | "en"; status: string; days_elapsed: number; created_at: string };
export const STATUS_ORDER = ["pending", "nudged", "noticed", "called", "overdue", "filed", "paid"] as const;
export type InvoiceStatusValue = (typeof STATUS_ORDER)[number];
const invoiceSelect = `SELECT i.*, m.name AS msme_name, m.udyam AS msme_udyam, b.name AS buyer_name, b.phone AS buyer_phone, b.email AS buyer_email FROM invoices i JOIN msmes m ON m.id = i.msme_id JOIN buyers b ON b.id = i.buyer_id`;
export async function listInvoices(filter?: "active" | InvoiceStatusValue): Promise<InvoiceRow[]> {
  if (filter === "active") return query<InvoiceRow>(`${invoiceSelect} WHERE i.status <> 'paid' ORDER BY i.created_at DESC`);
  if (filter) return query<InvoiceRow>(`${invoiceSelect} WHERE i.status = $1 ORDER BY i.created_at DESC`, [filter]);
  return query<InvoiceRow>(`${invoiceSelect} ORDER BY i.created_at DESC`);
}
export async function findInvoice(id: string): Promise<InvoiceRow | undefined> { return (await query<InvoiceRow>(`${invoiceSelect} WHERE i.id = $1`, [id]))[0]; }
export function serializeInvoice(invoice: InvoiceRow) { return { invoice_id: invoice.id, msme_id: invoice.msme_id, msme_name: invoice.msme_name, msme_udyam: invoice.msme_udyam, buyer_name: invoice.buyer_name, buyer_phone: invoice.buyer_phone, buyer_email: invoice.buyer_email, invoice_number: invoice.invoice_number, amount: Number(invoice.amount), invoice_date: new Date(invoice.invoice_date).toISOString().slice(0, 10), due_date: new Date(invoice.due_date).toISOString().slice(0, 10), language: invoice.language, status: invoice.status, days_elapsed: invoice.days_elapsed, created_at: new Date(invoice.created_at).toISOString() }; }

// Maps elapsed days to the escalation stage they imply, never regressing a status a call/webhook already advanced (e.g. "called" or "paid").
export function deriveStatus(daysElapsed: number, currentStatus: string): InvoiceStatusValue {
  const rank = (status: string) => { const index = STATUS_ORDER.indexOf((status === "called" ? "nudged" : status) as InvoiceStatusValue); return index === -1 ? 0 : index; };
  let target: InvoiceStatusValue = "pending";
  if (daysElapsed >= LEGAL_DEADLINE_DAYS) target = "overdue";
  else if (daysElapsed >= NOTICE_DAY) target = "noticed";
  else if (daysElapsed >= NUDGE_DAY) target = "nudged";
  return rank(target) > rank(currentStatus) ? target : (currentStatus as InvoiceStatusValue);
}
