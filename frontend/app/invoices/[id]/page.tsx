// Invoice detail page with payment clock and voice-call history.
import Link from "next/link";
import { api } from "../../../lib/api";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/status-badge";
import { LegalClock } from "../../../components/legal-clock";
import { CallHistory } from "../../../components/call-history";
export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const invoice = await api.invoice(id); return <main className="mx-auto min-h-screen max-w-4xl p-6 md:p-10"><Link href="/" className="text-sm text-emerald-700">← All invoices</Link><div className="mt-6 flex items-start justify-between"><div><h1 className="text-3xl font-bold">{invoice.buyer_name}</h1><p className="text-slate-600">{invoice.invoice_number}</p></div><StatusBadge status={invoice.status} /></div><div className="mt-8 grid gap-5 md:grid-cols-2"><Card><CardHeader><h2 className="font-semibold">Invoice value</h2></CardHeader><CardContent><p className="text-3xl font-bold">₹{invoice.amount.toLocaleString("en-IN")}</p></CardContent></Card><Card><CardHeader><h2 className="font-semibold">Legal clock</h2></CardHeader><CardContent><LegalClock daysElapsed={invoice.days_elapsed} /></CardContent></Card></div><Card className="mt-5"><CardHeader><h2 className="font-semibold">Call history</h2></CardHeader><CardContent><CallHistory calls={invoice.calls as never[]} /></CardContent></Card></main>; }
