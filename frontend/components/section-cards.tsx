// Collection KPIs computed live from the fetched invoice portfolio.
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangleIcon, FileCheck2Icon, PhoneCallIcon, TrendingUpIcon } from "lucide-react"
import { INTEREST_MULTIPLIER, LEGAL_DEADLINE_DAYS, RBI_BANK_RATE } from "../../shared/constants"
import type { Invoice } from "../../shared/types"

const FOLLOW_UP_STATUSES = new Set(["nudged", "noticed", "called"])

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`
}

function mostUrgent(invoices: Invoice[]) {
  return [...invoices].sort((a, b) => b.days_elapsed - a.days_elapsed)[0]
}

export function SectionCards({ invoices }: { invoices: Invoice[] }) {
  const active = invoices.filter((invoice) => invoice.status !== "paid")
  const outstanding = active.reduce((sum, invoice) => sum + invoice.amount, 0)
  const followUp = active.filter((invoice) => FOLLOW_UP_STATUSES.has(invoice.status))
  const atDeadline = active.filter((invoice) => invoice.days_elapsed >= LEGAL_DEADLINE_DAYS)
  const urgentFollowUp = mostUrgent(followUp)
  const urgentDeadline = mostUrgent(atDeadline)
  const interestRate = RBI_BANK_RATE * INTEREST_MULTIPLIER

  const cards = [
    {
      label: "Outstanding amount",
      value: formatInr(outstanding),
      badge: `${active.length} invoice${active.length === 1 ? "" : "s"}`,
      detail: "Across active MSME collections",
      icon: TrendingUpIcon,
    },
    {
      label: "Due for follow-up",
      value: `${followUp.length} invoice${followUp.length === 1 ? "" : "s"}`,
      badge: urgentFollowUp ? `Day ${urgentFollowUp.days_elapsed}` : "—",
      detail: urgentFollowUp ? `${urgentFollowUp.buyer_name} · ${urgentFollowUp.status}` : "No active follow-ups",
      icon: PhoneCallIcon,
    },
    {
      label: "At legal deadline",
      value: urgentDeadline ? formatInr(urgentDeadline.amount) : "₹0",
      badge: urgentDeadline ? `Day ${urgentDeadline.days_elapsed}` : "—",
      detail: urgentDeadline ? `${urgentDeadline.buyer_name} · complaint ready` : "None at risk",
      icon: AlertTriangleIcon,
    },
    {
      label: "Statutory interest",
      value: `${interestRate}%`,
      badge: `${INTEREST_MULTIPLIER}× RBI rate`,
      detail: "Applied to overdue invoices",
      icon: FileCheck2Icon,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map(({ label, value, badge, detail, icon: Icon }) => (
        <Card key={label} className="@container/card">
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Icon />
                {badge}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Collections status <Icon className="size-4" />
            </div>
            <div className="text-muted-foreground">{detail}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
