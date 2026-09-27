// Call timeline rendered with shadcn-style table primitives.
import { Table, TableCell, TableHead } from "./ui/table";
type Call = { call_id: string; direction: string; outcome: string; transcript: string; created_at: string };
export function CallHistory({ calls }: { calls: Call[] }) { if (!calls.length) return <p className="text-sm text-slate-500">No calls recorded yet.</p>; return <Table><thead><tr><TableHead>Direction</TableHead><TableHead>Outcome</TableHead><TableHead>Transcript</TableHead></tr></thead><tbody>{calls.map((call) => <tr key={call.call_id}><TableCell>{call.direction}</TableCell><TableCell>{call.outcome}</TableCell><TableCell>{call.transcript}</TableCell></tr>)}</tbody></Table>; }
