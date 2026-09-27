// Vasooli navigation for MSME collections and legal escalation workflows.
"use client"
import * as React from "react"
import { AppWindowIcon, ChartBarIcon, FileTextIcon, LandmarkIcon, ListIcon, PhoneCallIcon, Settings2Icon, CircleHelpIcon, SearchIcon, CommandIcon } from "lucide-react"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
const icon = (Icon: React.ElementType) => <Icon />
const data = { user: { name: "Shakti Engineering", email: "owner@shaktiworks.in", avatar: "" }, navMain: [{ title: "Dashboard", url: "#", icon: icon(AppWindowIcon) }, { title: "Invoice lifecycle", url: "#", icon: icon(ListIcon) }, { title: "Recovery analytics", url: "#", icon: icon(ChartBarIcon) }, { title: "Buyer follow-ups", url: "#", icon: icon(PhoneCallIcon) }, { title: "Samadhaan cases", url: "#", icon: icon(LandmarkIcon) }], documents: [{ name: "Invoice register", url: "#", icon: icon(FileTextIcon) }, { name: "Collections reports", url: "#", icon: icon(ChartBarIcon) }, { name: "Legal notices", url: "#", icon: icon(LandmarkIcon) }], navSecondary: [{ title: "Settings", url: "#", icon: icon(Settings2Icon) }, { title: "Get Help", url: "#", icon: icon(CircleHelpIcon) }, { title: "Search", url: "#", icon: icon(SearchIcon) }] }
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) { return <Sidebar collapsible="offcanvas" {...props}><SidebarHeader><SidebarMenu><SidebarMenuItem><SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!" render={<a href="#" />}><CommandIcon className="size-5! text-primary" /><span className="text-base font-semibold">Vasooli Agent</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader><SidebarContent><NavMain items={data.navMain} /><NavDocuments items={data.documents} /><NavSecondary items={data.navSecondary} className="mt-auto" /></SidebarContent><SidebarFooter><NavUser user={data.user} /></SidebarFooter></Sidebar> }
