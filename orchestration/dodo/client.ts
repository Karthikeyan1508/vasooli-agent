// Dodo Payments API wrapper for payment status checks.
export type PaymentStatus = "succeeded" | "pending" | "failed";
export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatus> { const response = await fetch(`https://api.dodopayments.com/payments/${paymentId}`, { headers: { Authorization: `Bearer ${process.env.DODO_API_KEY}` } }); if (!response.ok) throw new Error("Dodo payment lookup failed"); const data = await response.json() as { status: PaymentStatus }; return data.status; }
