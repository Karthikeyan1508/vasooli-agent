// Lightweight webhook idempotency guard keyed by Idempotency-Key, falling back to Dodo's webhook-id header for providers that don't send ours.
import type { RequestHandler } from "express";
const seen = new Set<string>();
export const idempotency: RequestHandler = (req, res, next) => { const key = req.header("Idempotency-Key") ?? req.header("webhook-id"); if (!key) return next(); if (seen.has(key)) return res.status(409).json({ error: "Duplicate request" }); seen.add(key); next(); };
