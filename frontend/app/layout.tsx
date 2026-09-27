// Root layout that applies Geist Sans globally.
import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { createElement } from "react";
import "./globals.css";

export const metadata: Metadata = { title: "Vasooli Agent", description: "Voice-first MSME collections" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={GeistSans.variable}><body className="font-sans antialiased">{children}<Script src="https://elevenlabs.io/convai-widget/index.js" strategy="afterInteractive" />{createElement("elevenlabs-convai", { "agent-id": "agent_2301m3gtw3g8fagrxajykttp7k8w", "action-text": "Simulate payment call", "start-call-text": "Start simulation", "end-call-text": "End simulation" })}</body></html>; }
