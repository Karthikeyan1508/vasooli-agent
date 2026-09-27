// Dodo Payments API wrapper for payment status checks.
// Base URL per Dodo's published API reference: live mode is live.dodopayments.com, test mode is test.dodopayments.com.
const DODO_API_BASE_URL = process.env.DODO_API_BASE_URL ?? (process.env.NODE_ENV === "production" ? "https://live.dodopayments.com" : "https://test.dodopayments.com");

export type PaymentStatus = "succeeded" | "pending" | "failed";

export async function checkPaymentStatus(paymentId: string, attempt = 1): Promise<PaymentStatus> {
  let response: Response;
  try {
    response = await fetch(`${DODO_API_BASE_URL}/payments/${paymentId}`, { headers: { Authorization: `Bearer ${process.env.DODO_API_KEY}` } });
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    return checkPaymentStatus(paymentId, attempt + 1);
  }
  if (!response.ok) {
    if (response.status >= 500 && attempt < 3) { await new Promise((resolve) => setTimeout(resolve, 250 * attempt)); return checkPaymentStatus(paymentId, attempt + 1); }
    throw new Error(`Dodo payment lookup failed: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as { status: PaymentStatus };
  return data.status;
}
