// Legal deadline indicator calculated from frozen collection constants.
import { LEGAL_DEADLINE_DAYS } from "../../shared/constants";
export function LegalClock({ daysElapsed }: { daysElapsed: number }) { const remaining = LEGAL_DEADLINE_DAYS - daysElapsed; return <p className={remaining < 0 ? "text-sm font-medium text-red-600" : "text-sm text-slate-600"}>{remaining < 0 ? `${Math.abs(remaining)} days overdue` : `${remaining} days remaining`}</p>; }
