// PostgreSQL helper with an in-memory demo fallback for database-free development.
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool, type QueryResultRow } from "pg";
const connectionString = process.env.DATABASE_URL;
const hasDatabase = Boolean(connectionString && !/(user|pass|host)/i.test(connectionString));
export const pool = new Pool(hasDatabase ? { connectionString, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined } : {});
let demoMode = !hasDatabase;
const invoices: Record<string, any>[] = [
  { id: "demo-invoice-1", msme_id: "demo-msme", msme_name: "Shakti Engineering Works", msme_udyam: "UDYAM-DL-01-0098765", buyer_id: "demo-buyer-1", buyer_name: "Kaveri Retail Pvt Ltd", buyer_phone: "+919811111111", buyer_email: "accounts@kaveriretail.example", invoice_number: "SEW-2026-101", amount: "85000", invoice_date: "2026-07-01", due_date: "2026-08-15", language: "hi", status: "pending", days_elapsed: 12, created_at: "2026-08-01T00:00:00.000Z" },
  { id: "demo-invoice-2", msme_id: "demo-msme", msme_name: "Shakti Engineering Works", msme_udyam: "UDYAM-DL-01-0098765", buyer_id: "demo-buyer-2", buyer_name: "Aarav Distributors", buyer_phone: "+919822222222", buyer_email: "payables@aarav.example", invoice_number: "SEW-2026-102", amount: "142500", invoice_date: "2026-07-01", due_date: "2026-08-15", language: "hi", status: "called", days_elapsed: 34, created_at: "2026-08-02T00:00:00.000Z" },
  { id: "demo-invoice-3", msme_id: "demo-msme", msme_name: "Shakti Engineering Works", msme_udyam: "UDYAM-DL-01-0098765", buyer_id: "demo-buyer-3", buyer_name: "Narmada Stores", buyer_phone: "+919833333333", buyer_email: "finance@narmada.example", invoice_number: "SEW-2026-103", amount: "210000", invoice_date: "2026-07-01", due_date: "2026-08-15", language: "hi", status: "overdue", days_elapsed: 46, created_at: "2026-08-03T00:00:00.000Z" },
];
const complaints = new Map<string, Record<string, unknown>>();
const buyers = new Map<string, { name: string; phone: string; email: string }>();
function demoQuery(sql: string, params: unknown[]): unknown[] {
  const normalized = sql.replace(/\s+/g, " ").toLowerCase();
  if (normalized.includes("from invoices i join")) {
    if (normalized.includes("where i.id")) return invoices.filter((invoice) => invoice.id === params[0]);
    if (normalized.includes("i.status <> 'paid'")) return invoices.filter((invoice) => invoice.status !== "paid");
    if (normalized.includes("where i.status =")) return invoices.filter((invoice) => invoice.status === params[0]);
    return [...invoices];
  }
  if (normalized.includes("from calls")) return [];
  if (normalized.includes("from complaints")) return complaints.has(String(params[0])) ? [complaints.get(String(params[0]))!] : [];
  if (normalized.startsWith("update invoices")) { const invoice = invoices.find((item) => item.id === params[0]); if (!invoice) return []; invoice.status = params[1]; if (params[2] !== null && params[2] !== undefined) invoice.days_elapsed = params[2]; return [{ id: invoice.id }]; }
  if (normalized.startsWith("delete from complaints")) { complaints.delete(String(params[0])); return []; }
  if (normalized.startsWith("delete from calls")) return [];
  if (normalized.startsWith("insert into complaints")) { const complaint = { id: randomUUID(), invoice_id: params[0], principal: String(params[1]), interest: String(params[2]), total: String(params[3]), rbi_rate: String(params[4]), days_overdue: params[5], pdf_url: params[6], status: "draft" }; complaints.set(String(params[0]), complaint); return [complaint]; }
  if (normalized.startsWith("insert into calls")) return [{ id: randomUUID() }];
  if (normalized.startsWith("insert into msmes")) return [{ id: "demo-msme" }];
  if (normalized.startsWith("insert into buyers")) { const id = randomUUID(); buyers.set(id, { name: String(params[0]), phone: String(params[1]), email: String(params[2]) }); return [{ id }]; }
  if (normalized.startsWith("insert into invoices")) { const id = randomUUID(); const buyer = buyers.get(String(params[1])) ?? { name: "New buyer", phone: "", email: "" }; invoices.unshift({ id, msme_id: "demo-msme", msme_name: "Sharma Traders", msme_udyam: "UDYAM-KA-03-0001234", buyer_id: params[1], buyer_name: buyer.name, buyer_phone: buyer.phone, buyer_email: buyer.email, invoice_number: params[2], amount: String(params[3]), invoice_date: params[4], due_date: params[5], language: params[6], status: "pending", days_elapsed: 0, created_at: new Date().toISOString() }); return [{ id }]; }
  return [];
}
export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> { if (demoMode) return demoQuery(sql, params) as T[]; const result = await pool.query<T>(sql, params); return result.rows; }
export async function initDb(): Promise<void> { if (demoMode) { console.warn("DATABASE_URL is not configured; using in-memory demo data."); return; } try { const schemaPath = fileURLToPath(new URL("./schema.sql", import.meta.url)); await pool.query(await readFile(schemaPath, "utf8")); } catch (error) { demoMode = true; console.warn("Database unavailable; using in-memory demo data.", error); } }
