// Invoice REST endpoints implemented with parameterized PostgreSQL queries and dynamic interest calculation.
import { Router } from "express";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { LEGAL_DEADLINE_DAYS, RBI_BANK_RATE, INTEREST_MULTIPLIER } from "../../../shared/constants.js";
import { query } from "../db.js";
import { ensureComplaint } from "../services/complaint.service.js";
import { findInvoice, listInvoices, serializeInvoice } from "../services/invoice.service.js";
import { calculateInterest } from "../services/interest.js";

const router = Router();
const statuses = ["pending", "nudged", "noticed", "called", "overdue", "filed", "paid"] as const;

const createSchema = z.object({
  msme_name: z.string().default("Shakti Engineering Works"),
  msme_udyam: z.string().default("UDYAM-DL-01-0098765"),
  buyer_name: z.string(),
  buyer_phone: z.string(),
  buyer_email: z.string().email().optional().default("accounts@buyer.example"),
  invoice_number: z.string(),
  amount: z.number().positive(),
  invoice_date: z.string(),
  due_date: z.string(),
  language: z.enum(["hi", "ta", "en"]).default("hi"),
});

// GET /api/invoices - list invoices with dynamic legal clock & statutory interest
router.get("/", async (_req, res) => {
  const invoices = await listInvoices();
  const serialized = invoices.map((inv) => {
    const s = serializeInvoice(inv);
    const daysOverdue = Math.max(0, s.days_elapsed - LEGAL_DEADLINE_DAYS);
    const interest = calculateInterest(s.amount, daysOverdue);
    return {
      ...s,
      days_overdue: daysOverdue,
      rbi_rate: RBI_BANK_RATE,
      interest_multiplier: INTEREST_MULTIPLIER,
      statutory_interest: interest,
      total_claim: s.amount + interest,
    };
  });
  res.json(serialized);
});

// GET /api/invoices/:id - get single invoice with call logs & complaint metadata
router.get("/:id", async (req, res) => {
  const invoice = await findInvoice(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const calls = await query(
    `SELECT id AS call_id, invoice_id, direction, transcript, outcome, promise_date, duration_seconds, created_at FROM calls WHERE invoice_id = $1 ORDER BY created_at DESC`,
    [invoice.id]
  );
  const complaint = (await query("SELECT * FROM complaints WHERE invoice_id = $1", [invoice.id]))[0] ?? null;

  const serialized = serializeInvoice(invoice);
  const daysOverdue = Math.max(0, serialized.days_elapsed - LEGAL_DEADLINE_DAYS);
  const interest = calculateInterest(serialized.amount, daysOverdue);

  res.json({
    ...serialized,
    days_overdue: daysOverdue,
    rbi_rate: RBI_BANK_RATE,
    interest_multiplier: INTEREST_MULTIPLIER,
    statutory_interest: interest,
    total_claim: serialized.amount + interest,
    calls,
    complaint,
  });
});

// POST /api/invoices - Intake endpoint called by n8n / ElevenLabs
router.post("/", async (req, res) => {
  const input = createSchema.parse(req.body);

  // Upsert MSME
  const msme = (
    await query<{ id: string }>(
      `INSERT INTO msmes (name, udyam) VALUES ($1,$2) ON CONFLICT (udyam) DO UPDATE SET name=EXCLUDED.name, updated_at=now() RETURNING id`,
      [input.msme_name, input.msme_udyam]
    )
  )[0];

  // Insert Buyer
  const buyer = (
    await query<{ id: string }>(
      `INSERT INTO buyers (name, phone, email) VALUES ($1,$2,$3) RETURNING id`,
      [input.buyer_name, input.buyer_phone, input.buyer_email]
    )
  )[0];

  // Insert Invoice
  const created = (
    await query<{ id: string }>(
      `INSERT INTO invoices (msme_id, buyer_id, invoice_number, amount, invoice_date, due_date, language, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING id`,
      [msme.id, buyer.id, input.invoice_number, input.amount, input.invoice_date, input.due_date, input.language]
    )
  )[0];

  const invoice = await findInvoice(created.id);
  res.status(201).json(serializeInvoice(invoice!));
});

// POST /api/invoices/:id/status - Escalation status updater
router.post("/:id/status", async (req, res) => {
  const body = z
    .object({
      status: z.enum(statuses),
      days_elapsed: z.number().int().min(0).optional(),
    })
    .parse(req.body);

  const updated = (
    await query<{ id: string }>(
      `UPDATE invoices SET status=$2, days_elapsed=COALESCE($3, days_elapsed), updated_at=now() WHERE id=$1 RETURNING id`,
      [req.params.id, body.status, body.days_elapsed ?? null]
    )
  )[0];

  if (!updated) return res.status(404).json({ error: "Invoice not found" });

  const invoice = (await findInvoice(updated.id))!;
  if (invoice.days_elapsed >= LEGAL_DEADLINE_DAYS && invoice.status !== "paid") {
    await ensureComplaint(invoice);
  }

  res.json(serializeInvoice(invoice));
});

// GET /api/invoices/:id/complaint.pdf - Download Samadhaan legal complaint PDF
router.get("/:id/complaint.pdf", async (req, res) => {
  const invoice = await findInvoice(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const complaint = await ensureComplaint(invoice);
  const principal = Number(complaint.principal);
  const interest = Number(complaint.interest);
  const total = Number(complaint.total);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=Samadhaan-${invoice.invoice_number}.pdf`);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  // Header Banner
  doc.rect(40, 40, 515, 60).fill("#0f172a");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text("MSME SAMADHAAN LEGAL COMPLAINT", 55, 55);
  doc.font("Helvetica").fontSize(10).text("Delayed Payment Statutory Recovery Claim (MSMED Act 2006, Section 16)", 55, 78);

  doc.moveDown(3);
  doc.fillColor("#1e293b").fontSize(12).font("Helvetica-Bold").text("FORMAL APPLICATION BEFORE MSE FACILITATION COUNCIL", { underline: true });
  doc.moveDown(0.5);

  // Details Table / Box
  doc.font("Helvetica").fontSize(10);
  doc.text(`Filing Date: ${new Date().toLocaleDateString("en-IN")}`);
  doc.text(`Complaint ID: ${complaint.id}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").fillColor("#0284c7").text("1. CLAIMANT (MSME SUPPLIER INFORMATION)");
  doc.font("Helvetica").fillColor("#334155")
    .text(`Supplier Name: ${invoice.msme_name}`)
    .text(`Udyam Registration: ${invoice.msme_udyam}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").fillColor("#0284c7").text("2. RESPONDENT (BUYER INFORMATION)");
  doc.font("Helvetica").fillColor("#334155")
    .text(`Buyer Enterprise: ${invoice.buyer_name}`)
    .text(`Contact Phone: ${invoice.buyer_phone}`)
    .text(`Contact Email: ${invoice.buyer_email}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").fillColor("#0284c7").text("3. INVOICE & FINANCIAL CLAIM BREAKDOWN");
  doc.font("Helvetica").fillColor("#334155")
    .text(`Invoice Number: ${invoice.invoice_number}`)
    .text(`Invoice Date: ${invoice.invoice_date.slice(0, 10)}`)
    .text(`Statutory Payment Due Date (45 Days Max): ${invoice.due_date.slice(0, 10)}`)
    .text(`Days Overdue Past 45-Day Deadline: ${complaint.days_overdue} day(s)`);
  doc.moveDown();

  // Financial Table Box
  doc.rect(40, doc.y, 515, 100).fillAndStroke("#f8fafc", "#cbd5e1");
  const tableY = doc.y - 90;
  doc.fillColor("#0f172a").fontSize(11)
    .text(`Principal Invoice Amount:`, 55, tableY)
    .text(`INR ${principal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 380, tableY, { align: "right" })
    
    .text(`Statutory Interest Rate:`, 55, tableY + 20)
    .text(`3 x RBI Rate (${RBI_BANK_RATE}% x 3 = 19.5% p.a.)`, 250, tableY + 20, { align: "right" })

    .text(`Accrued Statutory Interest (${complaint.days_overdue} days overdue):`, 55, tableY + 40)
    .text(`INR ${interest.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 380, tableY + 40, { align: "right" })

    .font("Helvetica-Bold")
    .text(`TOTAL RECOVERY CLAIM AMOUNT:`, 55, tableY + 68)
    .text(`INR ${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 380, tableY + 68, { align: "right" });

  doc.moveDown(4);
  doc.font("Helvetica").fontSize(10).fillColor("#475569")
    .text("STATUTORY DECLARATION:", { underline: true })
    .text(
      "Pursuant to Section 16 of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006, the buyer is liable to pay compound interest with monthly rests to the supplier on the amount at three times of the bank rate notified by the Reserve Bank of India.",
      { align: "justify" }
    );

  doc.moveDown(2);
  doc.font("Helvetica-Oblique").text("Generated automatically by Vasooli Autonomous Collections Agent", { align: "center" });

  doc.end();
});

export default router;
