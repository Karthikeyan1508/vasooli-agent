// Complaint metadata endpoint using direct PostgreSQL queries.
import { Router } from "express";
import { query } from "../db.js";
const router = Router();
router.get("/:invoiceId", async (req, res) => { const complaint = (await query("SELECT * FROM complaints WHERE invoice_id = $1", [req.params.invoiceId]))[0]; if (!complaint) return res.status(404).json({ error: "Complaint not found" }); res.json(complaint); });
export default router;
