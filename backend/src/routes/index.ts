// Aggregated API router for all backend endpoint groups.
import { Router } from "express";
import invoices from "./invoices.js";
import webhooks from "./webhooks.js";
import complaints from "./complaints.js";
import demo from "./demo.js";
const routes = Router();
routes.use("/invoices", invoices);
routes.use("/webhooks", webhooks);
routes.use("/complaints", complaints);
routes.use("/demo", demo);
export default routes;
