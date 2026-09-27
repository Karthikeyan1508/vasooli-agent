// Typed fetch wrapper restricted to the backend API URL.
import type { Invoice } from "../../shared/types";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
async function request<T>(path: string): Promise<T> { const response = await fetch(`${apiUrl}${path}`, { cache: "no-store" }); if (!response.ok) throw new Error("Unable to load dashboard data"); return response.json() as Promise<T>; }
export const api = { invoices: () => request<Invoice[]>("/api/invoices"), invoice: (id: string) => request<Invoice & { calls: unknown[]; complaint: unknown }>(`/api/invoices/${id}`) };
