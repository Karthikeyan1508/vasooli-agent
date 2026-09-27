// Intent-aware memory shapes shared by Breeth integration callers.
export interface MemoryEntity { buyerId: string; intent: string; content: object; }
export interface MemoryQuery { buyerId: string; intent: string; }
