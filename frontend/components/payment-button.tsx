"use client";

import { useState } from "react";

export function PaymentButton({ invoiceId }: { invoiceId: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function openCheckout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${invoiceId}/checkout`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.checkout_url) throw new Error(data.error || "Unable to create payment link");
      window.location.assign(data.checkout_url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create payment link");
      setLoading(false);
    }
  }
  return <div><button type="button" onClick={openCheckout} disabled={loading} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? "Creating secure link…" : "Pay with Dodo"}</button>{error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}</div>;
}
