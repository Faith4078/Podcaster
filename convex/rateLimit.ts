import { ConvexError } from 'convex/values';
import { internalMutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';

// Token-bucket rate limiter backed by the `rateLimits` table. Convex mutations
// are serializable, so a single-document bucket is race-free without extra work.
//
// `semanticSearch` is the one public, anonymous, Gemini-calling endpoint (it
// embeds every query). Anonymous callers have no userId, so we protect the
// Gemini key with a single GLOBAL bucket: steady refill with a burst allowance.

// Shared token-bucket consume: refill by elapsed time, throw RATE_LIMITED when
// the bucket is empty, otherwise take one token.
async function consumeToken(
  ctx: MutationCtx,
  opts: {
    key: string;
    capacity: number;
    refillPerSec: number;
    message: string;
  },
) {
  const now = Date.now();
  const existing = await ctx.db
    .query('rateLimits')
    .withIndex('by_key', (q) => q.eq('key', opts.key))
    .unique();

  if (!existing) {
    await ctx.db.insert('rateLimits', {
      key: opts.key,
      tokens: opts.capacity - 1,
      lastRefill: now,
    });
    return;
  }

  const elapsedSec = Math.max(0, (now - existing.lastRefill) / 1000);
  const refilled = Math.min(
    opts.capacity,
    existing.tokens + elapsedSec * opts.refillPerSec,
  );

  if (refilled < 1) {
    throw new ConvexError({
      code: 'RATE_LIMITED',
      message: opts.message,
    });
  }

  await ctx.db.patch(existing._id, { tokens: refilled - 1, lastRefill: now });
}

const SEARCH_KEY = 'semanticSearch:global';
const SEARCH_CAPACITY = 30; // burst allowance
const SEARCH_REFILL_PER_SEC = 0.5; // 30 tokens / minute sustained

export const consumeSearchToken = internalMutation({
  args: {},
  handler: async (ctx) => {
    await consumeToken(ctx, {
      key: SEARCH_KEY,
      capacity: SEARCH_CAPACITY,
      refillPerSec: SEARCH_REFILL_PER_SEC,
      message: 'Search is busy right now. Try again in a moment.',
    });
  },
});

// Global throttle for the generation pipeline. Each run makes 3-4 Gemini API
// calls, so unbounded concurrent generations trip Google's rate limits.
// Tunable knobs, sized for low-tier Gemini quotas: small burst, ~2/minute
// sustained. Raise these if the Gemini quota tier increases.
const GENERATION_KEY = 'generation:global';
const GENERATION_CAPACITY = 3; // burst allowance
const GENERATION_REFILL_PER_SEC = 1 / 30; // 1 token per 30s = 2/minute sustained

export const consumeGenerationToken = internalMutation({
  args: {},
  handler: async (ctx) => {
    await consumeToken(ctx, {
      key: GENERATION_KEY,
      capacity: GENERATION_CAPACITY,
      refillPerSec: GENERATION_REFILL_PER_SEC,
      message: 'Generation is busy right now. Please try again in a minute.',
    });
  },
});
