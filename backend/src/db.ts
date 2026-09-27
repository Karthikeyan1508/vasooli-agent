// PostgreSQL helper with an in-memory demo fallback for database-free development.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool, type QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;
const hasDatabase = Boolean(
  connectionString &&
  connectionString.trim() !== "" &&
  !connectionString.includes("user:pass@host")
);

export const pool = new Pool(
  hasDatabase
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false },
      }
    : {}
);

let demoMode = !hasDatabase;

const invoices: Record<string, any>[] = [
  {
    id: "demo-invoice-1",
    msme_id: "demo-msme",
    msme_name: "Shakti Engineering Works",
    msme_udyam: "UDYAM-DL-01-0098765",
    buyer_id: "demo-buyer-1",
    buyer_name: "Kaveri Retail Pvt Ltd",
    buyer_phone: "+919811111111",
    buyer_email: "accounts@kaveriretail.example",
    invoice_number: "SEW-2026-101",
    amount: "85000",
    invoice_date: "2026-07-01",
    due_date: "2026-08-15",
    language: "hi",
    status: "pending",
    days_elapsed: 12,
    created_at: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "demo-invoice-2",
    msme_id: "demo-msme",
    msme_name: "Shakti Engineering Works",
    msme_udyam: "UDYAM-DL-01-0098765",
    buyer_id: "demo-buyer-2",
    buyer_name: "Aarav Distributors",
    buyer_phone: "+919822222222",
    buyer_email: "payables@aarav.example",
    invoice_number: "SEW-2026-102",
    amount: "142500",
    invoice_date: "2026-07-01",
    due_date: "2026-08-15",
    language: "hi",
    status: "called",
    days_elapsed: 34,
    created_at: "2026-08-02T00:00:00.000Z",
  },
  {
    id: "demo-invoice-3",
    msme_id: "demo-msme",
    msme_name: "Shakti Engineering Works",
    msme_udyam: "UDYAM-DL-01-0098765",
    buyer_id: "demo-buyer-3",
    buyer_name: "Narmada Stores",
    buyer_phone: "+919833333333",
    buyer_email: "finance@narmada.example",
    invoice_number: "SEW-2026-103",
    amount: "210000",
    invoice_date: "2026-07-01",
    due_date: "2026-08-15",
    language: "hi",
    status: "overdue",
    days_elapsed: 46,
    created_at: "2026-08-03T00:00:00.000Z",
  },
];

const complaints = new Map<string, Record<string, unknown>>();
const buyers = new Map<string, { name: string; phone: string; email: string }>();
const callsStore: Record<string, any>[] = [];

function demoQuery(sql: string, params: unknown[]): unknown[] {
  const normalized = sql.replace(/\s+/g, " ").toLowerCase();

  if (normalized.includes("from invoices i join")) {
    if (normalized.includes("where i.id")) {
      return invoices.filter((invoice) => invoice.id === params[0]);
    }
    return [...invoices];
  }

  if (normalized.includes("from calls")) {
    const invoiceId = params[0];
    return callsStore.filter((c) => c.invoice_id === invoiceId);
  }

  if (normalized.includes("from complaints")) {
    const invoiceId = params[0];
    const match = complaints.get(String(invoiceId));
    return match ? [match] : [];
  }

  if (normalized.startsWith("update invoices")) {
    const invoiceId = params[0];
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return [];

    if (normalized.includes("status='paid'") || normalized.includes("status = 'paid'")) {
      invoice.status = "paid";
    } else if (params[1]) {
      invoice.status = params[1];
    }

    if (params[2] !== null && params[2] !== undefined) {
      invoice.days_elapsed = params[2];
    }
    return [{ id: invoice.id }];
  }

  if (normalized.startsWith("insert into complaints")) {
    const complaint = {
      id: randomUUID(),
      invoice_id: params[0],
      principal: String(params[1]),
      interest: String(params[2]),
      total: String(params[3]),
      rbi_rate: String(params[4]),
      days_overdue: params[5],
      pdf_url: params[6],
      status: "draft",
    };
    complaints.set(String(params[0]), complaint);
    return [complaint];
  }

  if (normalized.startsWith("insert into calls")) {
    const callObj = {
      id: randomUUID(),
      invoice_id: params[0],
      direction: params[1],
      transcript: params[2],
      outcome: params[3],
      promise_date: params[4] ?? null,
      duration_seconds: params[5] ?? 0,
      created_at: new Date().toISOString(),
    };
    callsStore.unshift(callObj);
    return [{ id: callObj.id }];
  }

  if (normalized.startsWith("insert into msmes")) {
    return [{ id: "demo-msme" }];
  }

  if (normalized.startsWith("insert into buyers")) {
    const id = randomUUID();
    buyers.set(id, {
      name: String(params[0]),
      phone: String(params[1]),
      email: String(params[2]),
    });
    return [{ id }];
  }

  if (normalized.startsWith("insert into invoices")) {
    const id = randomUUID();
    const buyer = buyers.get(String(params[1])) ?? {
      name: "New Buyer",
      phone: "",
      email: "",
    };
    const newInvoice = {
      id,
      msme_id: "demo-msme",
      msme_name: "Shakti Engineering Works",
      msme_udyam: "UDYAM-DL-01-0098765",
      buyer_id: params[1],
      buyer_name: buyer.name,
      buyer_phone: buyer.phone,
      buyer_email: buyer.email,
      invoice_number: params[2],
      amount: String(params[3]),
      invoice_date: params[4],
      due_date: params[5],
      language: params[6] ?? "hi",
      status: "pending",
      days_elapsed: 0,
      created_at: new Date().toISOString(),
    };
    invoices.unshift(newInvoice);
    return [{ id }];
  }

  return [];
}

export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (demoMode) return demoQuery(sql, params) as T[];
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

export async function initDb(): Promise<void> {
  if (demoMode) {
    console.warn("DATABASE_URL is not configured; using in-memory demo data.");
    return;
  }
  try {
    const schemaPath = fileURLToPath(new URL("./schema.sql", import.meta.url));
    await pool.query(await readFile(schemaPath, "utf8"));
  } catch (error) {
    demoMode = true;
    console.warn("Database unavailable; using in-memory demo data.", error);
  }
}
