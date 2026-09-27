// HTTP MCP wrapper for storing and recalling buyer conversation memory, speaking JSON-RPC 2.0 per MCP's tools/call convention.
type JsonRpcResponse<T> = { jsonrpc: "2.0"; id: number; result?: T; error?: { code: number; message: string } };

let requestId = 0;

async function callTool<T>(name: string, args: Record<string, unknown>, attempt = 1): Promise<T> {
  let response: Response;
  try {
    response = await fetch(process.env.BREETH_MCP_URL!, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.BREETH_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args } }),
    });
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    return callTool<T>(name, args, attempt + 1);
  }
  if (!response.ok) {
    if (response.status >= 500 && attempt < 3) { await new Promise((resolve) => setTimeout(resolve, 250 * attempt)); return callTool<T>(name, args, attempt + 1); }
    throw new Error(`Breeth MCP request failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as JsonRpcResponse<T>;
  if (payload.error) throw new Error(`Breeth MCP error ${payload.error.code}: ${payload.error.message}`);
  return payload.result as T;
}

export async function storeMemory(buyerId: string, intent: string, content: object): Promise<void> {
  await callTool("store_memory", { buyerId, intent, content });
}

export async function recallMemory(buyerId: string, intent: string): Promise<object[]> {
  const result = await callTool<{ memories?: object[] }>("recall_memory", { buyerId, intent });
  return result.memories ?? [];
}
