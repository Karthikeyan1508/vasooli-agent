// ElevenLabs and Dodo webhook handlers backed by PostgreSQL / in-memory store.
import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { idempotency } from "../middleware/idempotency.js";

const router = Router();

// POST /api/webhooks/elevenlabs - post-call transcript & outcome handler
router.post("/elevenlabs", idempotency, async (req, res) => {
  const data = z
    .object({
      invoice_id: z.string(),
      direction: z.enum(["inbound", "outbound"]).default("outbound"),
      transcript: z.string().default(""),
      outcome: z.enum(["promise_to_pay", "dispute", "voicemail", "no_answer"]),
      promise_date: z.string().optional(),
      duration_seconds: z.number().int().nonnegative().default(0),
    })
    .parse(req.body);

  const call = (
    await query<{ id: string }>(
      `INSERT INTO calls (invoice_id, direction, transcript, outcome, promise_date, duration_seconds) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [data.invoice_id, data.direction, data.transcript, data.outcome, data.promise_date ?? null, data.duration_seconds]
    )
  )[0];

  // Automatically transition invoice status to 'called' upon outbound call completion
  await query(
    `UPDATE invoices SET status='called', updated_at=now() WHERE id=$1 AND status NOT IN ('paid', 'filed')`,
    [data.invoice_id]
  );

  res.status(201).json({ call_id: call?.id ?? "logged", outcome: data.outcome });
});

// POST /api/webhooks/dodo - Dodo Payments status webhook
router.post("/dodo", idempotency, async (req, res) => {
  const data = z
    .object({
      invoice_id: z.string(),
      status: z.enum(["succeeded", "pending", "failed"]),
    })
    .parse(req.body);

  if (data.status === "succeeded") {
    await query(`UPDATE invoices SET status='paid', updated_at=now() WHERE id=$1`, [data.invoice_id]);
  }

  res.json({ received: true, invoice_id: data.invoice_id, status: data.status });
});

export default router;
