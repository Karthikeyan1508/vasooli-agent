// Demo helper that marks an invoice payment as successfully received.
import { forwardDodoWebhook } from "../webhook-handler.js";
const invoiceId = process.argv[2]; if (!invoiceId) throw new Error("Pass an invoice ID"); await forwardDodoWebhook({ invoice_id: invoiceId, status: "succeeded" });
