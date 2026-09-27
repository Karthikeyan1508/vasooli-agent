import DodoPayments from "dodopayments";
import type { InvoiceRow } from "./invoice.service.js";

const PRODUCT_NAME = "Vasooli Invoice Payment";
let productId: string | undefined;

function client() {
  const bearerToken = process.env.DODO_API_KEY;
  if (!bearerToken) throw new Error("DODO_API_KEY is not configured");
  return new DodoPayments({ bearerToken, baseURL: process.env.DODO_API_BASE_URL });
}

export function toMinorUnits(amount: string | number) {
  const value = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error("Invalid invoice amount");
  return value;
}

async function invoiceProductId(dodo: DodoPayments) {
  if (process.env.DODO_PRODUCT_ID) return process.env.DODO_PRODUCT_ID;
  if (productId) return productId;
  for await (const product of dodo.products.list({ recurring: false })) {
    if (product.name === PRODUCT_NAME) return (productId = product.product_id);
  }
  // ponytail: concurrent first requests can create duplicates; set DODO_PRODUCT_ID if checkout traffic grows.
  const product = await dodo.products.create({
    name: PRODUCT_NAME,
    description: "Variable invoice payment collected through the Vasooli SaaS platform.",
    price: { type: "one_time_price", currency: "INR", price: 100, pay_what_you_want: true },
    tax_category: "saas",
  });
  return (productId = product.product_id);
}

export async function createInvoiceCheckout(invoice: InvoiceRow) {
  const dodo = client();
  const checkout = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: await invoiceProductId(dodo), quantity: 1, amount: toMinorUnits(invoice.amount) }],
    customer: { email: invoice.buyer_email, name: invoice.buyer_name, phone_number: invoice.buyer_phone },
    billing_currency: "INR",
    metadata: { invoice_id: invoice.id, invoice_number: invoice.invoice_number },
    return_url: `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/invoices/${invoice.id}?payment=complete`,
    cancel_url: `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/invoices/${invoice.id}`,
    short_link: true,
  });
  if (!checkout.checkout_url) throw new Error("Dodo did not return a checkout URL");
  return { checkout_url: checkout.checkout_url, session_id: checkout.session_id };
}
