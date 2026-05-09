import { CK, TTL, cacheSet } from './cache';
import User from '../models/User';

export async function warmCaches(): Promise<void> {
  try {
    const agents = await User
      .find({ role: { $in: ['agent', 'manager', 'AGENT', 'MANAGER'] } })
      .select('_id name email role groups lastSeen')
      .lean();
    cacheSet(CK.agents(), agents, TTL.AGENTS);
    console.log(`[CACHE] Warm-up: ${agents.length} agents cached`);
  } catch (err: any) {
    console.error('[CACHE] Warm-up failed:', err.message);
    // Non-fatal — app works without warm cache
  }
}
