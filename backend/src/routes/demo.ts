// Demo-control endpoints for live pitches: rewind the clock, force a payment.
import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { resetDemoData } from "../services/demo.service.js";
import { findInvoice, serializeInvoice } from "../services/invoice.service.js";
const router = Router();
router.post("/reset", async (_req, res) => { await resetDemoData(); res.json({ reset: true }); });
router.post("/mark-paid", async (req, res) => {
  const { invoice_id } = z.object({ invoice_id: z.string() }).parse(req.body);
  const updated = (await query<{ id: string }>("UPDATE invoices SET status='paid', updated_at=now() WHERE id=$1 RETURNING id", [invoice_id]))[0];
  if (!updated) return res.status(404).json({ error: "Invoice not found" });
  res.json(serializeInvoice((await findInvoice(updated.id))!));
});
export default router;
