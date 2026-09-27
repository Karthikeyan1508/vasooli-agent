import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { InvoiceCard } from "@/components/invoice-card"
import { api } from "@/lib/api"

import data from "./data.json"

export default async function Page() {
  let invoices: Awaited<ReturnType<typeof api.invoices>> = []
  try { invoices = await api.invoices() } catch { invoices = [] }
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards invoices={invoices} />
              <section className="px-4 lg:px-6">
                <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Live invoice portfolio</h2><p className="text-sm text-muted-foreground">Tracked by the 45-day MSMED collection clock</p></div><span className="text-sm text-muted-foreground">{invoices.length} active</span></div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{invoices.map((invoice) => <InvoiceCard key={invoice.invoice_id} invoice={invoice} />)}</div>
              </section>
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data.invoices} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
