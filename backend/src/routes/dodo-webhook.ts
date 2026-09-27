// Dodo Payments webhook: verifies the Standard Webhooks signature before trusting the event.
// Must be mounted with express.raw() (see index.ts) - the signature covers the exact bytes Dodo sent, so re-serializing a parsed JSON body would break verification.
// Requires the invoice id to have been attached as payment metadata (metadata.invoice_id) when the payment/checkout was created; there is no other way to map a Dodo payment back to an invoice.
import { Router } from "express";
import DodoPayments from "dodopayments";
import { query } from "../db.js";
import { idempotency } from "../middleware/idempotency.js";

const router = Router();
const client = new DodoPayments({ bearerToken: process.env.DODO_API_KEY ?? "", webhookKey: process.env.DODO_WEBHOOK_SECRET ?? null });

router.post("/", idempotency, async (req, res) => {
  let event;
  try {
    event = client.webhooks.unwrap((req.body as Buffer).toString("utf8"), {
      headers: {
        "webhook-id": String(req.headers["webhook-id"] ?? ""),
        "webhook-signature": String(req.headers["webhook-signature"] ?? ""),
        "webhook-timestamp": String(req.headers["webhook-timestamp"] ?? ""),
      },
    });
  } catch (error) {
    console.error("Dodo webhook signature verification failed", error);
    return res.status(401).json({ error: "Invalid signature" });
  }

  if (event.type === "payment.succeeded" || event.type === "payment.failed") {
    const invoiceId = event.data.metadata?.invoice_id;
    if (typeof invoiceId === "string" && invoiceId) {
      const status = event.type === "payment.succeeded" ? "paid" : "overdue";
      await query("UPDATE invoices SET status=$2, updated_at=now() WHERE id=$1", [invoiceId, status]);
    } else {
      console.warn(`Dodo ${event.type} event for payment ${event.data.payment_id} carries no invoice_id metadata; nothing to update.`);
    }
  }

  res.status(200).json({ received: true });
});

export default router;
