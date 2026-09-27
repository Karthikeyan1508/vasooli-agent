// Dodo webhook parser that forwards normalized payment updates to the API.
import type { PaymentStatus } from "./client.js";
export async function forwardDodoWebhook(event: { invoice_id: string; status: PaymentStatus }): Promise<void> { const response = await fetch(`${process.env.BACKEND_API_URL}/api/webhooks/dodo`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": `${event.invoice_id}-${event.status}` }, body: JSON.stringify(event) }); if (!response.ok) throw new Error("Backend webhook forwarding failed"); }
