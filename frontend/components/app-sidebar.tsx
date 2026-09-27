// Vasooli navigation for MSME collections and legal escalation workflows.
"use client"
import * as React from "react"
import { AppWindowIcon, CommandIcon } from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
const icon = (Icon: React.ElementType) => <Icon />
const data = { user: { name: "Shakti Engineering", email: "owner@shaktiworks.in", avatar: "" }, navMain: [{ title: "Dashboard", url: "/", icon: icon(AppWindowIcon) }] }
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) { return <Sidebar collapsible="offcanvas" {...props}><SidebarHeader><SidebarMenu><SidebarMenuItem><SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!" render={<a href="/" />}><CommandIcon className="size-5! text-primary" /><span className="text-base font-semibold">Vasooli Agent</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader><SidebarContent><NavMain items={data.navMain} /></SidebarContent><SidebarFooter><NavUser user={data.user} /></SidebarFooter></Sidebar> }
