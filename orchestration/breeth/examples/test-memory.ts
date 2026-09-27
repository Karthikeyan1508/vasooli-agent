// Minimal manual smoke test for the Breeth memory wrapper.
import { recallMemory, storeMemory } from "../client.js";
const buyerId = "demo-buyer"; await storeMemory(buyerId, "payment_promise", { date: "2026-09-30" }); console.log(await recallMemory(buyerId, "payment_promise"));
