// Dashboard invoice summary card composed from shadcn primitives.
import Link from "next/link";
import type { Invoice } from "../../shared/types";
import { Card, CardContent, CardHeader } from "./ui/card";
import { StatusBadge } from "./status-badge";
import { LegalClock } from "./legal-clock";
export function InvoiceCard({ invoice }: { invoice: Invoice }) { return <Link href={`/invoices/${invoice.invoice_id}`}><Card className="h-full transition-shadow hover:shadow-md"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><h2 className="font-semibold">{invoice.buyer_name}</h2><p className="mt-1 text-sm text-slate-500">{invoice.invoice_number}</p></div><StatusBadge status={invoice.status} /></CardHeader><CardContent><p className="text-2xl font-semibold">₹{invoice.amount.toLocaleString("en-IN")}</p><div className="mt-4"><LegalClock daysElapsed={invoice.days_elapsed} /></div></CardContent></Card></Link>; }
