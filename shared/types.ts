// Frozen cross-service type contracts for the Vasooli platform.
export interface Invoice { invoice_id: string; msme_id: string; msme_name: string; msme_udyam: string; buyer_name: string; buyer_phone: string; buyer_email: string; invoice_number: string; amount: number; invoice_date: string; due_date: string; language: "hi" | "ta" | "en"; status: InvoiceStatus; days_elapsed: number; created_at: string; }
export type InvoiceStatus = "pending" | "nudged" | "noticed" | "called" | "overdue" | "filed" | "paid";
export interface Call { call_id: string; invoice_id: string; direction: "inbound" | "outbound"; transcript: string; outcome: "promise_to_pay" | "dispute" | "voicemail" | "no_answer"; promise_date?: string; duration_seconds: number; created_at: string; }
export interface Complaint { complaint_id: string; invoice_id: string; principal: number; interest: number; total: number; rbi_rate: number; days_overdue: number; pdf_url: string; status: "draft" | "filed"; }
