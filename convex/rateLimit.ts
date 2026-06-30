import { ConvexError } from 'convex/values'
import { internalMutation } from './_generated/server'

// Token-bucket rate limiter backed by the `rateLimits` table. Convex mutations
// are serializable, so a single-document bucket is race-free without extra work.
//
// `semanticSearch` is the one public, anonymous, Gemini-calling endpoint (it
// embeds every query). Anonymous callers have no userId, so we protect the
// Gemini key with a single GLOBAL bucket: steady refill with a burst allowance.
// This is a backstop against abuse, not per-user fairness.

const SEARCH_KEY = 'semanticSearch:global'
const SEARCH_CAPACITY = 30 // burst allowance
const SEARCH_REFILL_PER_SEC = 0.5 // 30 tokens / minute sustained

export const consumeSearchToken = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('rateLimits')
      .withIndex('by_key', (q) => q.eq('key', SEARCH_KEY))
      .unique()

    if (!existing) {
      await ctx.db.insert('rateLimits', {
        key: SEARCH_KEY,
        tokens: SEARCH_CAPACITY - 1,
        lastRefill: now,
      })
      return
    }

    const elapsedSec = Math.max(0, (now - existing.lastRefill) / 1000)
    const refilled = Math.min(
      SEARCH_CAPACITY,
      existing.tokens + elapsedSec * SEARCH_REFILL_PER_SEC,
    )

    if (refilled < 1) {
      throw new ConvexError({
        code: 'RATE_LIMITED',
        message: 'Search is busy right now. Try again in a moment.',
      })
    }

    await ctx.db.patch(existing._id, { tokens: refilled - 1, lastRefill: now })
  },
})
