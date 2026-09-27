// Express server entry point configured for Render networking.
import "dotenv/config";
import express from "express";
import { initDb } from "./db.js";
import routes from "./routes/index.js";
import dodoWebhook from "./routes/dodo-webhook.js";
import { errorHandler } from "./middleware/error.js";
const app = express();
// Raw body first: the Dodo signature covers the exact bytes sent, so this must run before express.json() parses (and would otherwise re-serialize) the body.
app.use("/api/webhooks/dodo", express.raw({ type: "application/json" }), dodoWebhook);
app.use(express.json());
app.use((req, res, next) => { res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*"); res.header("Access-Control-Allow-Headers", "Content-Type, Authorization"); res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); if (req.method === "OPTIONS") return res.sendStatus(200); next(); });
app.use("/api", routes); app.get("/health", (_req, res) => res.json({ ok: true })); app.use(errorHandler);
const port = Number(process.env.PORT ?? 10000);
initDb().then(() => app.listen(port, "0.0.0.0", () => console.log(`Vasooli API listening on 0.0.0.0:${port}`))).catch((error) => { console.error("Database initialization failed", error); process.exit(1); });
