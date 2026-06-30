import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'

// Called from Clerk webhook (http.ts) to sync a user into Convex
export const createOrUpdate = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
      })
      return existing._id
    }

    return ctx.db.insert('users', {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
    })
  },
})

// Used client-side after sign-in to ensure the user exists
export const ensureCurrentUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) return existing._id

    return ctx.db.insert('users', args)
  },
})

// Called from the Clerk Billing webhook (http.ts) to mirror the subscription
// plan onto the user doc. The Convex generation gate reads `plan` from here.
export const setPlan = internalMutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal('free'), v.literal('pro')),
  },
  handler: async (ctx, { clerkId, plan }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
      .unique()

    // The user.created webhook normally arrives first; if not, there's nothing
    // to patch yet (a later user.created/ensureCurrentUser will seed the row,
    // and a subsequent subscription event will sync the plan).
    if (!existing) return
    await ctx.db.patch(existing._id, { plan })
  },
})

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) =>
    ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
      .unique(),
})

export const getTopPodcasters = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 5 }) => {
    const podcasts = await ctx.db.query('podcasts').collect()

    const countByAuthor = new Map<string, number>()
    for (const p of podcasts) {
      const key = p.authorId
      countByAuthor.set(key, (countByAuthor.get(key) ?? 0) + 1)
    }

    const ranked = [...countByAuthor.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)

    return Promise.all(
      ranked.map(async ([authorId, count]) => {
        const user = await ctx.db.get(authorId as any)
        return { user, count }
      })
    )
  },
})
