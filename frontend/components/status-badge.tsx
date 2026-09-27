// Color-coded invoice status display built with the Badge primitive.
import type { InvoiceStatus } from "../../shared/types";
import { Badge } from "./ui/badge";
const labels: Record<InvoiceStatus, string> = { pending: "Pending", nudged: "Nudged", noticed: "Notice sent", called: "Called", overdue: "Overdue", filed: "Filed", paid: "Paid" };
const colors: Record<InvoiceStatus, string> = { pending: "bg-amber-100 text-amber-800", nudged: "bg-blue-100 text-blue-800", noticed: "bg-violet-100 text-violet-800", called: "bg-indigo-100 text-indigo-800", overdue: "bg-red-100 text-red-800", filed: "bg-slate-200 text-slate-800", paid: "bg-emerald-100 text-emerald-800" };
export function StatusBadge({ status }: { status: InvoiceStatus }) { return <Badge className={colors[status]}>{labels[status]}</Badge>; }
