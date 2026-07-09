import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import type { QueryCtx } from './_generated/server'

// Free users may download up to this many DISTINCT podcasts. Re-downloading a
// podcast they already have is free (deduped per (user, podcast)), so this caps
// unique episodes, not download actions. Pro is unlimited. Mirrors the shape of
// FREE_BOOKMARK_LIMIT in convex/bookmarks.ts.
export const FREE_DOWNLOAD_LIMIT = 3

// Resolve the current user from the authenticated Clerk identity (NOT a
// client-supplied id). Mirrors requireUser in convex/bookmarks.ts.
async function requireUser(ctx: QueryCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError({ code: 'UNAUTHENTICATED' })
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique()
  if (!user) throw new ConvexError({ code: 'UNAUTHENTICATED' })
  return user
}

// Download-quota state for the current user — drives the "N of 3 downloads used"
// copy and the upgrade nudge. Returns a signed-out default so the UI can render
// without gating on auth. `downloadedIds` lets the menu show "Downloaded" for
// episodes already saved (which cost no additional slot).
export const myDownloadInfo = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { isPro: false, count: 0, limit: FREE_DOWNLOAD_LIMIT, downloadedIds: [] as string[] }
    }
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) {
      return { isPro: false, count: 0, limit: FREE_DOWNLOAD_LIMIT, downloadedIds: [] as string[] }
    }

    const rows = await ctx.db
      .query('downloads')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    return {
      isPro: user.plan === 'pro',
      count: rows.length,
      limit: FREE_DOWNLOAD_LIMIT,
      downloadedIds: rows.map((r) => r.podcastId as string),
    }
  },
})

// Authorize + record a download, returning the audio URL to save. Server is the
// source of truth for the quota: a Free user who already downloaded this podcast
// re-downloads for free (dedup), a Free user under the cap consumes a slot, and a
// Free user at FREE_DOWNLOAD_LIMIT is rejected with a typed ConvexError the UI
// turns into an upgrade nudge. Pro is unlimited. Mirrors addBookmark's gate.
export const recordDownload = mutation({
  args: { podcastId: v.id('podcasts') },
  handler: async (ctx, { podcastId }) => {
    const user = await requireUser(ctx)

    const podcast = await ctx.db.get(podcastId)
    if (!podcast || podcast.status !== 'ready') {
      throw new ConvexError({ code: 'NOT_DOWNLOADABLE' })
    }
    const audioUrl = podcast.audioStorageId
      ? await ctx.storage.getUrl(podcast.audioStorageId)
      : podcast.audioUrl
    if (!audioUrl) throw new ConvexError({ code: 'NOT_DOWNLOADABLE' })

    // Already downloaded → no new slot, just hand back the URL again.
    const existing = await ctx.db
      .query('downloads')
      .withIndex('by_user_podcast', (q) =>
        q.eq('userId', user._id).eq('podcastId', podcastId),
      )
      .unique()
    if (existing) return { audioUrl, title: podcast.title }

    if (user.plan !== 'pro') {
      const all = await ctx.db
        .query('downloads')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect()
      if (all.length >= FREE_DOWNLOAD_LIMIT) {
        throw new ConvexError({ code: 'DOWNLOAD_LIMIT' })
      }
    }

    await ctx.db.insert('downloads', { userId: user._id, podcastId })
    return { audioUrl, title: podcast.title }
  },
})
