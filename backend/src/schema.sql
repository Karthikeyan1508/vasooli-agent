-- PostgreSQL schema created automatically when the Vasooli API starts.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- MSME Business Table
CREATE TABLE IF NOT EXISTS msmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  udyam TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Buyer / Client Table
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msme_id UUID NOT NULL REFERENCES msmes(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  language TEXT NOT NULL DEFAULT 'hi' CHECK (language IN ('hi','ta','en')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','nudged','noticed','called','overdue','filed','paid')),
  days_elapsed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(msme_id, invoice_number)
);

-- Calls Table (Inbound/Outbound transcripts & outcomes)
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  transcript TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('promise_to_pay','dispute','voicemail','no_answer')),
  promise_date DATE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Complaints Table (Samadhaan 3x RBI interest legal claims)
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID UNIQUE NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  principal NUMERIC(14,2) NOT NULL,
  interest NUMERIC(14,2) NOT NULL,
  total NUMERIC(14,2) NOT NULL,
  rbi_rate NUMERIC(6,2) NOT NULL DEFAULT 6.50,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  pdf_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','filed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
