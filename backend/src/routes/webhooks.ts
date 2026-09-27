// ElevenLabs webhook handler backed by PostgreSQL queries.
// The Dodo webhook lives at routes/dodo-webhook.ts, mounted separately in index.ts with a raw body parser so its signature can be verified.
import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { idempotency } from "../middleware/idempotency.js";
const router = Router();
router.post("/elevenlabs", idempotency, async (req, res) => { const data = z.object({ invoice_id: z.string(), direction: z.enum(["inbound", "outbound"]), transcript: z.string().default(""), outcome: z.enum(["promise_to_pay", "dispute", "voicemail", "no_answer"]), promise_date: z.string().optional(), duration_seconds: z.number().int().nonnegative().default(0) }).parse(req.body); const call = (await query<{ id: string }>("INSERT INTO calls (invoice_id,direction,transcript,outcome,promise_date,duration_seconds) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [data.invoice_id, data.direction, data.transcript, data.outcome, data.promise_date ?? null, data.duration_seconds]))[0]; res.status(201).json({ call_id: call.id }); });
export default router;
