// Invoice REST endpoints implemented with parameterized PostgreSQL queries.
import { Router } from "express";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { LEGAL_DEADLINE_DAYS } from "../../../shared/constants.js";
import { query } from "../db.js";
import { ensureComplaint } from "../services/complaint.service.js";
import { STATUS_ORDER, deriveStatus, findInvoice, listInvoices, serializeInvoice } from "../services/invoice.service.js";
const router = Router();
const statuses = STATUS_ORDER;
const createSchema = z.object({
  msme_name: z.string().optional().default("Shakti Engineering Works"),
  msme_udyam: z.string().optional().default("UDYAM-DL-01-0098765"),
  buyer_name: z.string(),
  buyer_phone: z.string(),
  buyer_email: z.string().email().optional().default("buyer@unknown.local"),
  invoice_number: z.string(),
  amount: z.coerce.number().positive(),
  invoice_date: z.string(),
  due_date: z.string().optional(),
  language: z.enum(["hi", "ta", "en"]).default("hi"),
});

function defaultDueDate(invoiceDate: string) {
  const date = new Date(`${invoiceDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 45);
  return date.toISOString().slice(0, 10);
}
router.get("/", async (req, res) => { const status = typeof req.query.status === "string" ? req.query.status : undefined; res.json((await listInvoices(status as "active" | (typeof STATUS_ORDER)[number] | undefined)).map(serializeInvoice)); });
router.get("/:id", async (req, res) => { const invoice = await findInvoice(req.params.id); if (!invoice) return res.status(404).json({ error: "Invoice not found" }); const calls = await query(`SELECT id AS call_id, invoice_id, direction, transcript, outcome, promise_date, duration_seconds, created_at FROM calls WHERE invoice_id = $1 ORDER BY created_at DESC`, [invoice.id]); const complaint = (await query("SELECT * FROM complaints WHERE invoice_id = $1", [invoice.id]))[0] ?? null; res.json({ ...serializeInvoice(invoice), calls, complaint }); });
router.post("/", async (req, res) => { const input = createSchema.parse(req.body); const dueDate = input.due_date ?? defaultDueDate(input.invoice_date); const msme = (await query<{ id: string }>(`INSERT INTO msmes (name, udyam) VALUES ($1,$2) ON CONFLICT (udyam) DO UPDATE SET name=EXCLUDED.name,updated_at=now() RETURNING id`, [input.msme_name, input.msme_udyam]))[0]; const buyer = (await query<{ id: string }>("INSERT INTO buyers (name, phone, email) VALUES ($1,$2,$3) RETURNING id", [input.buyer_name, input.buyer_phone, input.buyer_email]))[0]; const created = (await query<{ id: string }>("INSERT INTO invoices (msme_id,buyer_id,invoice_number,amount,invoice_date,due_date,language) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id", [msme.id, buyer.id, input.invoice_number, input.amount, input.invoice_date, dueDate, input.language]))[0]; res.status(201).json(serializeInvoice((await findInvoice(created.id))!)); });
router.post("/:id/status", async (req, res) => { const body = z.object({ status: z.enum(statuses), days_elapsed: z.number().int().min(0).optional() }).parse(req.body); const updated = (await query<{ id: string }>("UPDATE invoices SET status=$2, days_elapsed=COALESCE($3,days_elapsed), updated_at=now() WHERE id=$1 RETURNING id", [req.params.id, body.status, body.days_elapsed ?? null]))[0]; if (!updated) return res.status(404).json({ error: "Invoice not found" }); const invoice = (await findInvoice(updated.id))!; if (invoice.days_elapsed >= LEGAL_DEADLINE_DAYS && invoice.status !== "paid") await ensureComplaint(invoice); res.json(serializeInvoice(invoice)); });
router.post("/:id/increment-days", async (req, res) => { const body = z.object({ days: z.number().int().positive().default(1) }).parse(req.body ?? {}); const invoice = await findInvoice(req.params.id); if (!invoice) return res.status(404).json({ error: "Invoice not found" }); const daysElapsed = invoice.days_elapsed + body.days; const status = deriveStatus(daysElapsed, invoice.status); const updated = (await query<{ id: string }>("UPDATE invoices SET status=$2, days_elapsed=$3, updated_at=now() WHERE id=$1 RETURNING id", [invoice.id, status, daysElapsed]))[0]; const refreshed = (await findInvoice(updated.id))!; if (daysElapsed >= LEGAL_DEADLINE_DAYS && status !== "paid") await ensureComplaint(refreshed); res.json(serializeInvoice(refreshed)); });
router.get("/:id/complaint.pdf", async (req, res) => { const invoice = await findInvoice(req.params.id); if (!invoice) return res.status(404).json({ error: "Invoice not found" }); const complaint = await ensureComplaint(invoice); res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `inline; filename=Samadhaan-${invoice.invoice_number}.pdf`); const doc = new PDFDocument(); doc.pipe(res); doc.fontSize(18).text("MSME Samadhaan Complaint Draft"); doc.moveDown().fontSize(11).text(`MSME: ${invoice.msme_name} (${invoice.msme_udyam})`).text(`Buyer: ${invoice.buyer_name}`).text(`Invoice: ${invoice.invoice_number}`).text(`Principal: INR ${Number(complaint.principal).toFixed(2)}`).text(`Interest: INR ${Number(complaint.interest).toFixed(2)}`).text(`Total claim: INR ${Number(complaint.total).toFixed(2)}`).text(`Days elapsed: ${invoice.days_elapsed} / ${LEGAL_DEADLINE_DAYS}`); doc.end(); });
export default router;
