// ElevenLabs and Dodo webhook handlers backed by PostgreSQL queries.
import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { idempotency } from "../middleware/idempotency.js";
const router = Router();
router.post("/elevenlabs", idempotency, async (req, res) => { const data = z.object({ invoice_id: z.string(), direction: z.enum(["inbound", "outbound"]), transcript: z.string().default(""), outcome: z.enum(["promise_to_pay", "dispute", "voicemail", "no_answer"]), promise_date: z.string().optional(), duration_seconds: z.number().int().nonnegative().default(0) }).parse(req.body); const call = (await query<{ id: string }>("INSERT INTO calls (invoice_id,direction,transcript,outcome,promise_date,duration_seconds) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [data.invoice_id, data.direction, data.transcript, data.outcome, data.promise_date ?? null, data.duration_seconds]))[0]; res.status(201).json({ call_id: call.id }); });
router.post("/dodo", idempotency, async (req, res) => { const data = z.object({ invoice_id: z.string(), status: z.enum(["succeeded", "pending", "failed"]) }).parse(req.body); if (data.status === "succeeded") await query("UPDATE invoices SET status=$2,updated_at=now() WHERE id=$1", [data.invoice_id, "paid"]); res.json({ received: true }); });
export default router;
