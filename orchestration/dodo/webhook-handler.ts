// Dev/demo helper that simulates a payment outcome without a real signed Dodo webhook.
// The real POST /api/webhooks/dodo route now verifies Dodo's Standard Webhooks signature
// and only accepts genuine Dodo event payloads, so this talks to the plain status endpoint
// instead - it is not a stand-in for the real webhook, only a local testing convenience.
import type { PaymentStatus } from "./client.js";

export async function forwardDodoWebhook(event: { invoice_id: string; status: PaymentStatus }): Promise<void> {
  if (event.status === "pending") return;
  const status = event.status === "succeeded" ? "paid" : "overdue";
  const response = await fetch(`${process.env.BACKEND_API_URL}/api/invoices/${event.invoice_id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Backend status update failed");
}
