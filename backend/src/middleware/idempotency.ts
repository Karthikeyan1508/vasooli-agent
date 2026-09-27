// Lightweight webhook idempotency guard keyed by Idempotency-Key.
import type { RequestHandler } from "express";
const seen = new Set<string>();
export const idempotency: RequestHandler = (req, res, next) => { const key = req.header("Idempotency-Key"); if (!key) return next(); if (seen.has(key)) return res.status(409).json({ error: "Duplicate request" }); seen.add(key); next(); };
